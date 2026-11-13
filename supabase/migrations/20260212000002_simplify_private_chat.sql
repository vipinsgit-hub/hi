-- ====================================================================
-- HI: Private Two-Person Chat Application
-- Migration: 20260212000002_simplify_private_chat.sql
-- Description: Automatic private room initialization, zero-friction 
--              2-person membership enrollment, and profile query policy
-- ====================================================================

-- 1. Ensure the single designated private chat room exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.chat_rooms) THEN
        INSERT INTO public.chat_rooms (name)
        VALUES ('HI');
    END IF;
END $$;

-- 2. Helper function to get default private chat room ID
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

-- 3. Automatic Room Enrollment RPC: ensure_private_chat_room()
-- Atomically ensures the private room exists and automatically admits
-- the first two authenticated users without invitations or manual setup.
-- Strictly caps membership to 2 users to preserve private channel security.
CREATE OR REPLACE FUNCTION public.ensure_private_chat_room()
RETURNS JSONB AS $$
DECLARE
    caller_id UUID;
    target_room_id UUID;
    member_count INT;
    user_role TEXT;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Step A: Get or create the single designated private room
    SELECT id INTO target_room_id 
    FROM public.chat_rooms 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF target_room_id IS NULL THEN
        INSERT INTO public.chat_rooms (name)
        VALUES ('HI')
        RETURNING id INTO target_room_id;
    END IF;

    -- Step B: If caller is already an admitted member, return room_id immediately
    IF EXISTS (
        SELECT 1 FROM public.chat_members 
        WHERE room_id = target_room_id AND user_id = caller_id
    ) THEN
        RETURN jsonb_build_object(
            'success', true,
            'room_id', target_room_id,
            'is_new_member', false
        );
    END IF;

    -- Step C: Serialize member additions using row locking on the room
    PERFORM 1 FROM public.chat_rooms WHERE id = target_room_id FOR UPDATE;

    SELECT COUNT(*) INTO member_count 
    FROM public.chat_members 
    WHERE room_id = target_room_id;

    -- Strict 2-person cap: reject any 3rd party
    IF member_count >= 2 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This private chat room has reached its maximum capacity of 2 authorized participants.'
        );
    END IF;

    -- Step D: First user is 'owner', second user is 'member'
    user_role := CASE WHEN member_count = 0 THEN 'owner' ELSE 'member' END;

    INSERT INTO public.chat_members (room_id, user_id, role)
    VALUES (target_room_id, caller_id, user_role)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'room_id', target_room_id,
        'is_new_member', true,
        'role', user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.ensure_private_chat_room() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_private_chat_room() TO authenticated, service_role;

-- 4. Ensure profiles policy allows authenticated users to read peer profiles
DROP POLICY IF EXISTS "Users can view profile of room peers and self" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
