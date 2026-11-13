// ====================================================================
// HI: Supabase Edge Function — Secure Username Authentication
// Function: auth-login
// Path: supabase/functions/auth-login/index.ts
//
// Description:
// Resolves a username to its associated verified email address via the
// private `usernames_private` table and authenticates against Supabase Auth.
// Neither the email address nor the mapping is ever returned or exposed to clients.
// Includes origin allowlist CORS, input validation, and brute-force protection.
// ====================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Explicit CORS origin allowlist as required by security specifications
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://hi-six-topaz.vercel.app",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-supabase-auth",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

// Generic error response to prevent username enumeration
const GENERIC_AUTH_ERROR = "Invalid username or password.";

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  const corsHeaders = buildCorsHeaders(origin);

  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    if (origin && !isAllowed) {
      return new Response(
        JSON.stringify({ error: "Origin not allowed by CORS policy." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Reject unapproved origins for actual POST requests
  if (origin && !isAllowed) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed by CORS policy." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Edge function environment is unconfigured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate incoming payload
    const body = await req.json().catch(() => null);
    const rawUsername = body?.username;
    const password = body?.password;

    // Strict type and length validation
    if (
      !rawUsername ||
      typeof rawUsername !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Username and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanUsername = rawUsername.toLowerCase().trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract client IP for abuse prevention / rate limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown-ip";

    // 3. Initialize privileged Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Rate Limiting Check (Max 5 failed attempts per IP or username within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: failedAttempts } = await supabaseAdmin
      .from("auth_rate_limits")
      .select("*", { count: "exact", head: true })
      .or(`identifier.eq."${clientIp}",identifier.eq."${cleanUsername}"`)
      .gte("created_at", fifteenMinutesAgo);

    if ((failedAttempts || 0) >= 5) {
      return new Response(
        JSON.stringify({
          error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
          code: "rate_limit_exceeded",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Secure private database lookup (inaccessible to ordinary client JWTs)
    const { data: record, error: lookupError } = await supabaseAdmin
      .from("usernames_private")
      .select("email, user_id")
      .eq("normalized_username", cleanUsername)
      .maybeSingle();

    if (lookupError || !record || !record.email) {
      // Record failed attempt
      await supabaseAdmin.from("auth_rate_limits").insert([
        { identifier: clientIp, attempt_type: "login" },
        { identifier: cleanUsername, attempt_type: "login" },
      ]);

      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Verify email confirmation status before authenticating
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      record.user_id
    );

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          error: "Please verify your email address before logging in. Check your inbox for the confirmation link.",
          code: "email_not_confirmed",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Authenticate against Supabase Auth using resolved email and provided password
    // Supabase Auth remains the sole authority for password hashing and verification
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: record.email,
      password: password,
    });

    if (authError || !authData?.session) {
      // Record failed attempt
      await supabaseAdmin.from("auth_rate_limits").insert([
        { identifier: clientIp, attempt_type: "login" },
        { identifier: cleanUsername, attempt_type: "login" },
      ]);

      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Return authenticated session tokens
    // CRITICAL SECURITY: The resolved email address is NEVER returned to the client
    const responsePayload = {
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
        user: {
          id: authData.user.id,
          user_metadata: authData.user.user_metadata,
        },
      },
    };

    return new Response(
      JSON.stringify(responsePayload),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during authentication." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
