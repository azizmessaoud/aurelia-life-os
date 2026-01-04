-- Add graph_context column to store knowledge graph context with each message
ALTER TABLE public.chat_messages 
ADD COLUMN graph_context jsonb DEFAULT NULL;