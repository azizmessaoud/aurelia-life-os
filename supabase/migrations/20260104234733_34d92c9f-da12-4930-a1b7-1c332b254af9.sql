-- Add user_id column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing messages to be owned by any existing user (or leave NULL for now)
-- New messages will require user_id

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON public.chat_messages;

-- Create policies that require authentication and scope to user's own messages
CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);