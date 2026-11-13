-- ====================================================================
-- HI: Private Two-Person Chat Application
-- Migration: 20260212000002_simplify_private_chat.sql
-- Description: Dedicated 2-Account Channel Configuration (vipin & sithya)
--              Strict database-level enforcement, zero-friction access,
--              and full preservation of existing room, users, and messages.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. IDENTIFY ROOM & ATOMICALLY ENROLL SITHYA WITH VIPIN
-- --------------------------------------------------------------------
DO $$
DECLARE
    target_room_id UUID;
    vipin_id CONSTANT UUID := '3ff12c7c-6ff3-4ef2-a5d4-da0ea9ee5f20'::UUID;
    sithya_id CONSTANT UUID := '4062422f-ab4d-47db-859b-7b0c1825e72a'::UUID;
BEGIN
    -- Locate existing room where vipin is already an enrolled owner/member
    SELECT room_id INTO target_room_id 
    FROM public.chat_members 
    WHERE user_id = vipin_id 
    LIMIT 1;

    -- Fallback to the first existing room if membership row was not found
    IF target_room_id IS NULL THEN
        SELECT id INTO target_room_id 
        FROM public.chat_rooms 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;

    -- If no room exists at all, create the dedicated HI private room
    IF target_room_id IS NULL THEN
        INSERT INTO public.chat_rooms (name) 
        VALUES ('HI') 
        RETURNING id INTO target_room_id;
    END IF;

    -- Ensure vipin is registered as owner in this room (preserves existing)
    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (target_room_id, vipin_id, 'owner')
    ON CONFLICT (room_id, user_id) DO NOTHING;

    -- Add sithya as the second authorized participant (member)
    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (target_room_id, sithya_id, 'member')
    ON CONFLICT (room_id, user_id) DO NOTHING;

    -- Purge any obsolete pending invitation tokens (invitations are no longer used)
    DELETE FROM public.invitations;
END $$;

-- --------------------------------------------------------------------
-- 2. HARDEN DATABASE-LEVEL TRIGGER: STRICT 2-ACCOUNT WHITELIST
-- --------------------------------------------------------------------
-- Prevents any account other than vipin and sithya from ever entering
-- public.chat_members, even if attempted via direct SQL or client bypass.
CREATE OR REPLACE FUNCTION public.enforce_room_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INT;
    allowed_accounts CONSTANT UUID[] := ARRAY[
        '3ff12c7c-6ff3-4ef2-a5d4-da0ea9ee5f20'::UUID, -- vipin
        '4062422f-ab4d-47db-859b-7b0c1825e72a'::UUID  -- sithya
    ];
BEGIN
    -- Strict whitelist enforcement at database level
    IF NOT (NEW.user_id = ANY(allowed_accounts)) THEN
        RAISE EXCEPTION 'Access Denied: User % is not an authorized participant of this private channel.', NEW.user_id;
    END IF;

    -- Acquire exclusive row lock on the room to prevent race conditions
    PERFORM 1 FROM public.chat_rooms WHERE id = NEW.room_id FOR UPDATE;

    SELECT COUNT(*) INTO current_count 
    FROM public.chat_members 
    WHERE room_id = NEW.room_id AND user_id != NEW.user_id;

    IF current_count >= 2 THEN
        RAISE EXCEPTION 'This private room has reached its maximum capacity of 2 members.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_chat_members_limit ON public.chat_members;
CREATE TRIGGER tr_chat_members_limit
    BEFORE INSERT ON public.chat_members
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_room_member_limit();

-- --------------------------------------------------------------------
-- 3. HELPER FUNCTION: GET DEFAULT PRIVATE ROOM ID
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_default_room_id()
RETURNS UUID AS $$
DECLARE
    r_id UUID;
BEGIN
    SELECT id INTO r_id 
    FROM public.chat_rooms 
    ORDER BY created_at ASC 
    LIMIT 1;

    RETURN r_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_default_room_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_default_room_id() TO authenticated, service_role;

-- --------------------------------------------------------------------
-- 4. AUTOMATIC ACCESS RPC: ensure_private_chat_room()
-- --------------------------------------------------------------------
-- Validates that the caller is either vipin or sithya, guarantees their
-- membership row exists, and returns the room ID. Arbitrary users are rejected.
CREATE OR REPLACE FUNCTION public.ensure_private_chat_room()
RETURNS JSONB AS $$
DECLARE
    caller_id UUID;
    target_room_id UUID;
    allowed_accounts CONSTANT UUID[] := ARRAY[
        '3ff12c7c-6ff3-4ef2-a5d4-da0ea9ee5f20'::UUID, -- vipin
        '4062422f-ab4d-47db-859b-7b0c1825e72a'::UUID  -- sithya
    ];
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Strict identity check: only vipin and sithya are authorized
    IF NOT (caller_id = ANY(allowed_accounts)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Access denied: HI is a private channel restricted exclusively to authorized accounts.'
        );
    END IF;

    -- Find the shared private chat room
    SELECT room_id INTO target_room_id 
    FROM public.chat_members 
    WHERE user_id = caller_id 
    LIMIT 1;

    IF target_room_id IS NULL THEN
        SELECT id INTO target_room_id 
        FROM public.chat_rooms 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;

    IF target_room_id IS NULL THEN
        INSERT INTO public.chat_rooms (name) 
        VALUES ('HI') 
        RETURNING id INTO target_room_id;
    END IF;

    -- Ensure caller membership exists
    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (
        target_room_id, 
        caller_id, 
        CASE WHEN caller_id = '3ff12c7c-6ff3-4ef2-a5d4-da0ea9ee5f20'::UUID THEN 'owner' ELSE 'member' END
    )
    ON CONFLICT (room_id, user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'room_id', target_room_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.ensure_private_chat_room() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_private_chat_room() TO authenticated, service_role;

-- --------------------------------------------------------------------
-- 5. PROFILE ACCESS POLICY
-- --------------------------------------------------------------------
-- Allows authenticated users to view peer profiles (usernames, display names, avatars)
DROP POLICY IF EXISTS "Users can view profile of room peers and self" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
