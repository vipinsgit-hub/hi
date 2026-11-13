-- ====================================================================
-- HI: Private Two-Person Chat Application
-- Migration: 20260212000001_rls_policies.sql
-- Description: Strict Row-Level Security (RLS) policies, privilege revokes,
--              and Realtime publication configuration
-- ====================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL RELEVANT TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usernames_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. REVOKE ALL INAPPROPRIATE CLIENT TABLE PRIVILEGES ON PRIVATE TABLES
-- Neither anon nor authenticated users can query usernames_private or auth_rate_limits directly.
REVOKE ALL ON public.usernames_private FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.usernames_private TO service_role;

REVOKE ALL ON public.auth_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.auth_rate_limits TO service_role;

-- 3. HELPER SECURITY DEFINER FUNCTIONS (WITH FIXED SEARCH PATH)
-- Used by RLS policies to check membership without triggering infinite recursion.
CREATE OR REPLACE FUNCTION public.is_room_member(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_user_id IS NULL OR check_room_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1
        FROM public.chat_members
        WHERE user_id = check_user_id
          AND room_id = check_room_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_room_owner(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_user_id IS NULL OR check_room_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1
        FROM public.chat_members
        WHERE user_id = check_user_id
          AND room_id = check_room_id
          AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- 4. FUNCTION EXECUTION PERMISSIONS
REVOKE ALL ON FUNCTION public.is_room_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_room_owner(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_owner(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_username_availability(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.initialize_chat_room(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_chat_room(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_room_invitation(UUID, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_room_invitation(UUID, TEXT, TEXT, INT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.redeem_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(TEXT) TO authenticated, service_role;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- 5. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view profile of room peers and self" ON public.profiles;
CREATE POLICY "Users can view profile of room peers and self"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.chat_members cm1
            JOIN public.chat_members cm2 ON cm1.room_id = cm2.room_id
            WHERE cm1.user_id = auth.uid() AND cm2.user_id = public.profiles.id
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 6. CHAT ROOMS POLICIES
DROP POLICY IF EXISTS "Members can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Members can view their chat rooms"
    ON public.chat_rooms
    FOR SELECT
    USING (public.is_room_member(auth.uid(), id));

DROP POLICY IF EXISTS "Room owners can update room" ON public.chat_rooms;
CREATE POLICY "Room owners can update room"
    ON public.chat_rooms
    FOR UPDATE
    USING (public.is_room_owner(auth.uid(), id))
    WITH CHECK (public.is_room_owner(auth.uid(), id));

-- 7. CHAT MEMBERS POLICIES
DROP POLICY IF EXISTS "Members can view room memberships" ON public.chat_members;
CREATE POLICY "Members can view room memberships"
    ON public.chat_members
    FOR SELECT
    USING (public.is_room_member(auth.uid(), room_id));

-- Unauthorized users cannot arbitrarily add themselves to chat_members.
-- Only the existing owner can add members directly, or via secure redeem_invitation RPC.
DROP POLICY IF EXISTS "Only room owners can add members" ON public.chat_members;
CREATE POLICY "Only room owners can add members"
    ON public.chat_members
    FOR INSERT
    WITH CHECK (public.is_room_owner(auth.uid(), room_id));

DROP POLICY IF EXISTS "Room owners can remove members" ON public.chat_members;
CREATE POLICY "Room owners can remove members"
    ON public.chat_members
    FOR DELETE
    USING (public.is_room_owner(auth.uid(), room_id) OR user_id = auth.uid());

-- 8. MESSAGES POLICIES
DROP POLICY IF EXISTS "Members can read room messages" ON public.messages;
CREATE POLICY "Members can read room messages"
    ON public.messages
    FOR SELECT
    USING (public.is_room_member(auth.uid(), room_id));

DROP POLICY IF EXISTS "Members can send room messages" ON public.messages;
CREATE POLICY "Members can send room messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        public.is_room_member(auth.uid(), room_id)
        AND sender_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
CREATE POLICY "Users can edit their own messages"
    ON public.messages
    FOR UPDATE
    USING (sender_id = auth.uid() AND public.is_room_member(auth.uid(), room_id))
    WITH CHECK (sender_id = auth.uid() AND public.is_room_member(auth.uid(), room_id));

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (sender_id = auth.uid() AND public.is_room_member(auth.uid(), room_id));

-- 9. INVITATIONS POLICIES
DROP POLICY IF EXISTS "Room owners can create invitations" ON public.invitations;
CREATE POLICY "Room owners can create invitations"
    ON public.invitations
    FOR INSERT
    WITH CHECK (public.is_room_owner(auth.uid(), room_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Room owners and invitees can view invitations" ON public.invitations;
CREATE POLICY "Room owners and invitees can view invitations"
    ON public.invitations
    FOR SELECT
    USING (
        created_by = auth.uid() 
        OR LOWER(invited_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Room owners can delete invitations" ON public.invitations;
CREATE POLICY "Room owners can delete invitations"
    ON public.invitations
    FOR DELETE
    USING (public.is_room_owner(auth.uid(), room_id));

-- ====================================================================
-- 10. SUPABASE REALTIME REPLICATION CONFIGURATION
-- ====================================================================

-- Ensure the messages table has REPLICA IDENTITY FULL so deletes/updates include full row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Publish messages table to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
