import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

// Support standardized VITE_SUPABASE_PUBLISHABLE_KEY with fallback to VITE_SUPABASE_ANON_KEY
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

/**
 * Validates whether the Supabase configuration is present and structurally valid.
 */
function checkSupabaseConfig(): boolean {
  if (!supabaseUrl || !supabasePublishableKey) {
    return false;
  }
  // Ensure not a default placeholder
  if (
    supabaseUrl.includes('your-project-ref') ||
    supabaseUrl.includes('your_supabase_project_url') ||
    supabasePublishableKey.includes('your-publishable-key') ||
    supabasePublishableKey.includes('your_supabase_publishable_key') ||
    supabasePublishableKey.includes('your-anon-publishable-key')
  ) {
    return false;
  }
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean = checkSupabaseConfig();

/**
 * The official Supabase client instance.
 * When real credentials are not yet set (e.g. during local preview without .env),
 * this client is null, and services seamlessly route to the dev preview adapter.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'hi_auth_token',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Safe accessor for the Supabase client.
 * Throws a helpful, human-readable error if called in production without credentials.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'
    );
  }
  return supabase;
}
