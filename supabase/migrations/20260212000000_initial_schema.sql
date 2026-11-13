-- ====================================================================
-- HI: Private Two-Person Chat Application
-- Migration: 20260212000000_initial_schema.sql
-- Description: Core tables, foreign keys, triggers, indices,
--              concurrency-safe 2-person membership lock & secure RPCs
-- ====================================================================

-- 1. PROFILES TABLE
-- Extends auth.users with public profile information and unique username
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
    ON public.profiles(LOWER(username));

-- 2. PRIVATE USERNAMES LOOKUP TABLE
-- STRICT SECURITY: Maps username to email for the Edge Function login resolver.
-- This table is completely inaccessible to ordinary frontend queries (no client RLS policies).
-- Only the Supabase Edge Function using the service_role key can read this table.
CREATE TABLE IF NOT EXISTS public.usernames_private (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    normalized_username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usernames_private_username_lower 
    ON public.usernames_private(LOWER(normalized_username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_usernames_private_email_lower 
    ON public.usernames_private(LOWER(email));

-- 3. CHAT ROOMS TABLE
-- Dedicated private room (designed for two authorized participants)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'HI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CHAT MEMBERS TABLE
-- Room membership junction. Ensures only explicitly authorized members can access.
CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, user_id)
);

-- 5. MESSAGES TABLE
-- Encapsulates private messages sent within a chat room
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 6. INVITATIONS TABLE
-- Controlled access mechanism for bringing the second authorized person into the room
-- Uses token hashes instead of plaintext tokens for database-level credential safety.
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AUTH RATE LIMITS TABLE
-- Tracks login attempts for the auth-login Edge Function to prevent brute-force attacks.
-- Accessible only by backend services via service_role key.
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    attempt_type TEXT NOT NULL DEFAULT 'login',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_room ON public.chat_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_room ON public.chat_members(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(LOWER(invited_email));
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ident ON public.auth_rate_limits(identifier, created_at DESC);

-- ====================================================================
-- AUTOMATIC TIMESTAMPS AND DATABASE INTEGRITY TRIGGERS
-- ====================================================================

-- Function to handle auto-updating updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger on profiles
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger on usernames_private
DROP TRIGGER IF EXISTS tr_usernames_private_updated_at ON public.usernames_private;
CREATE TRIGGER tr_usernames_private_updated_at
    BEFORE UPDATE ON public.usernames_private
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger on chat_rooms
DROP TRIGGER IF EXISTS tr_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER tr_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger on messages
DROP TRIGGER IF EXISTS tr_messages_updated_at ON public.messages;
CREATE TRIGGER tr_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- CONCURRENCY-SAFE 2-PERSON ROOM LIMIT TRIGGER
-- ====================================================================

-- Serializes member additions using row locking to strictly enforce 2-member limit
CREATE OR REPLACE FUNCTION public.enforce_room_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INT;
BEGIN
    -- Acquire exclusive row lock on the chat room row to serialize concurrent inserts
    PERFORM 1 FROM public.chat_rooms WHERE id = NEW.room_id FOR UPDATE;

    SELECT COUNT(*) INTO current_count 
    FROM public.chat_members 
    WHERE room_id = NEW.room_id;

    IF current_count >= 2 THEN
        RAISE EXCEPTION 'This private room has reached maximum capacity of 2 members.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_chat_members_limit ON public.chat_members;
CREATE TRIGGER tr_chat_members_limit
    BEFORE INSERT ON public.chat_members
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_room_member_limit();

-- ====================================================================
-- USER REGISTRATION TRIGGER (INSERT ONLY)
-- ====================================================================

-- Safely syncs new auth.users signup to public.profiles and usernames_private.
-- Executed strictly AFTER INSERT ON auth.users to prevent overwriting user profiles on update.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    clean_username TEXT;
    raw_display_name TEXT;
BEGIN
    raw_username := NEW.raw_user_meta_data->>'username';
    IF raw_username IS NULL OR trim(raw_username) = '' THEN
        clean_username := LOWER(split_part(NEW.email, '@', 1));
    ELSE
        clean_username := LOWER(trim(raw_username));
    END IF;

    raw_display_name := NEW.raw_user_meta_data->>'display_name';
    IF raw_display_name IS NULL OR trim(raw_display_name) = '' THEN
        raw_display_name := clean_username;
    END IF;

    -- Upsert profile
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        clean_username,
        raw_display_name,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;

    -- Upsert private lookup table for Edge Function username-to-email resolver
    INSERT INTO public.usernames_private (user_id, normalized_username, email)
    VALUES (
        NEW.id,
        clean_username,
        LOWER(NEW.email)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET normalized_username = EXCLUDED.normalized_username,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- SECURE PUBLIC RPCS
-- ====================================================================

-- 1. Check Username Availability (Safe for unauthenticated registration checks)
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean TEXT;
BEGIN
    clean := LOWER(trim(check_username));
    IF clean IS NULL OR clean = '' OR char_length(clean) < 3 OR char_length(clean) > 30 THEN
        RETURN FALSE;
    END IF;

    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.usernames_private 
        WHERE normalized_username = clean
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Secure First Room Initialization (Owner Bootstrap)
-- Only an authenticated user who belongs to NO room can initialize the private room.
CREATE OR REPLACE FUNCTION public.initialize_chat_room(room_name TEXT DEFAULT 'HI')
RETURNS JSONB AS $$
DECLARE
    caller_id UUID;
    new_room_id UUID;
    existing_rooms_count INT;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify caller is not already in a chat room
    IF EXISTS (SELECT 1 FROM public.chat_members WHERE user_id = caller_id) THEN
        RAISE EXCEPTION 'You are already a member of an existing chat room.';
    END IF;

    -- Ensure only 1 room exists in the private 2-person system
    SELECT COUNT(*) INTO existing_rooms_count FROM public.chat_rooms;
    IF existing_rooms_count >= 1 THEN
        RAISE EXCEPTION 'The designated private chat room has already been initialized.';
    END IF;

    -- Create room
    INSERT INTO public.chat_rooms (name)
    VALUES (COALESCE(trim(room_name), 'HI'))
    RETURNING id INTO new_room_id;

    -- Add caller as owner
    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (new_room_id, caller_id, 'owner');

    RETURN jsonb_build_object(
        'success', true,
        'room_id', new_room_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Create Room Invitation (Owner only)
CREATE OR REPLACE FUNCTION public.create_room_invitation(
    p_room_id UUID,
    p_invited_email TEXT,
    p_token_hash TEXT,
    p_duration_days INT DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
    caller_id UUID;
    clean_email TEXT;
    inv_id UUID;
    member_count INT;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify caller is owner of the room
    IF NOT EXISTS (
        SELECT 1 FROM public.chat_members 
        WHERE room_id = p_room_id AND user_id = caller_id AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: only room owners can create invitations.';
    END IF;

    -- Verify room capacity has not been reached
    SELECT COUNT(*) INTO member_count FROM public.chat_members WHERE room_id = p_room_id;
    IF member_count >= 2 THEN
        RAISE EXCEPTION 'Room has already reached maximum capacity of 2 members.';
    END IF;

    clean_email := LOWER(trim(p_invited_email));
    IF clean_email IS NULL OR clean_email = '' THEN
        RAISE EXCEPTION 'Invalid invited email address.';
    END IF;

    -- Delete or supersede previous pending unaccepted invitations for this room
    DELETE FROM public.invitations 
    WHERE room_id = p_room_id AND accepted_at IS NULL;

    -- Insert new invitation with token hash
    INSERT INTO public.invitations (
        room_id,
        invited_email,
        token_hash,
        expires_at,
        created_by
    )
    VALUES (
        p_room_id,
        clean_email,
        p_token_hash,
        timezone('utc'::text, now()) + (COALESCE(p_duration_days, 7) || ' days')::interval,
        caller_id
    )
    RETURNING id INTO inv_id;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', inv_id,
        'invited_email', clean_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Redeem Room Invitation (Atomically joins second participant)
CREATE OR REPLACE FUNCTION public.redeem_invitation(p_token_hash TEXT)
RETURNS JSONB AS $$
DECLARE
    inv public.invitations%ROWTYPE;
    caller_id UUID;
    caller_email TEXT;
    current_count INT;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;
    IF caller_email IS NULL THEN
        RAISE EXCEPTION 'Authenticated user has no verified email address.';
    END IF;

    -- Find matching active invitation
    SELECT * INTO inv 
    FROM public.invitations
    WHERE token_hash = p_token_hash
      AND accepted_at IS NULL
      AND expires_at > timezone('utc'::text, now())
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid, expired, or already accepted invitation.';
    END IF;

    -- Verify the invitation is addressed to the caller's email
    IF LOWER(inv.invited_email) <> LOWER(caller_email) THEN
        RAISE EXCEPTION 'This invitation was addressed to a different email address.';
    END IF;

    -- Lock the chat room to serialize concurrent join attempts
    PERFORM 1 FROM public.chat_rooms WHERE id = inv.room_id FOR UPDATE;

    SELECT COUNT(*) INTO current_count 
    FROM public.chat_members 
    WHERE room_id = inv.room_id;

    IF current_count >= 2 THEN
        RAISE EXCEPTION 'This private room has reached maximum capacity of 2 members.';
    END IF;

    -- Add member
    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (inv.room_id, caller_id, 'member')
    ON CONFLICT (room_id, user_id) DO NOTHING;

    -- Mark invitation accepted
    UPDATE public.invitations
    SET accepted_at = timezone('utc'::text, now())
    WHERE id = inv.id;

    RETURN jsonb_build_object(
        'success', true,
        'room_id', inv.room_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
