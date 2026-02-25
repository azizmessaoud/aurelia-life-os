-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge entities table (from Notion + other sources)
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'project', 'client', 'skill', 'person', 'goal', 'resource')),
    title TEXT NOT NULL,
    focus_area TEXT NOT NULL CHECK (focus_area IN ('study', 'career', 'finance', 'relationships', 'health')),
    metadata JSONB DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table (AXIOM outputs)
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    context JSONB NOT NULL,
    agent_used TEXT NOT NULL CHECK (agent_used IN ('DEXTER', 'MENTOR', 'ARCHITECT', 'GENERAL')),
    recommendation TEXT NOT NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    rag_citations JSONB DEFAULT '[]',
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    user_notes TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern cache table (AURELIA learning)
CREATE TABLE IF NOT EXISTS pattern_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('energy_time', 'decision_quality', 'focus_sequence', 'stress_trigger', 'success_factor')),
    pattern_data JSONB NOT NULL,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    sample_count INTEGER DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notion chunks table (RAG context)
CREATE TABLE IF NOT EXISTS notion_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_title TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, chunk_index)
);

-- Health scores table (AURELIA 5D tracking)
CREATE TABLE IF NOT EXISTS health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    emotion_score INTEGER CHECK (emotion_score BETWEEN 0 AND 100),
    mind_score INTEGER CHECK (mind_score BETWEEN 0 AND 100),
    body_score INTEGER CHECK (body_score BETWEEN 0 AND 100),
    soul_score INTEGER CHECK (soul_score BETWEEN 0 AND 100),
    hormones_score INTEGER CHECK (hormones_score BETWEEN 0 AND 100),
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Daily tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('learn', 'build', 'money')),
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 3),
    completed BOOLEAN DEFAULT FALSE,
    energy_cost INTEGER CHECK (energy_cost BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_embedding ON knowledge_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_decisions_embedding ON decisions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_notion_chunks_embedding ON notion_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decisions_user_created ON decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_focus ON knowledge_entities(user_id, focus_area);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_date ON health_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own knowledge" ON knowledge_entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own knowledge" ON knowledge_entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own knowledge" ON knowledge_entities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own knowledge" ON knowledge_entities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own decisions" ON decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decisions" ON decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decisions" ON decisions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own patterns" ON pattern_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON pattern_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON pattern_cache FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notion chunks" ON notion_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notion chunks" ON notion_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own health scores" ON health_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health scores" ON health_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health scores" ON health_scores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);

-- Helper function: Search similar decisions (RAG)
CREATE OR REPLACE FUNCTION search_similar_decisions(
    query_embedding vector(768),
    match_user_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    recommendation TEXT,
    confidence_score NUMERIC,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.question,
        d.recommendation,
        d.confidence_score,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM decisions d
    WHERE d.user_id = match_user_id
      AND d.embedding IS NOT NULL
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Helper function: Search Notion context (RAG)
CREATE OR REPLACE FUNCTION search_notion_context(
    query_embedding vector(768),
    match_user_id UUID,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    page_title TEXT,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        nc.page_title,
        nc.chunk_text,
        1 - (nc.embedding <=> query_embedding) AS similarity
    FROM notion_chunks nc
    WHERE nc.user_id = match_user_id
      AND nc.embedding IS NOT NULL
    ORDER BY nc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
