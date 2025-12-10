-- Add ai_profile column to client_extended_info table
ALTER TABLE client_extended_info 
ADD COLUMN IF NOT EXISTS ai_profile JSONB DEFAULT '{}'::jsonb;

-- Comment on column to explain usage
COMMENT ON COLUMN client_extended_info.ai_profile IS 'Stores AI-learned user preferences, tone, and historical context for the chatbot.';
