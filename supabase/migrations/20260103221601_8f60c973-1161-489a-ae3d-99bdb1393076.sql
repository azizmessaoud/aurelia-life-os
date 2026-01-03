-- Knowledge Graph Tables for AURELIA Memory Layer

-- Store entities (projects, blockers, emotions, patterns, wins)
CREATE TABLE public.knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'blocker', 'emotion', 'pattern', 'win', 'skill', 'person', 'tool', 'habit')),
  name TEXT NOT NULL,
  description TEXT,
  frequency INT DEFAULT 1, -- How many times mentioned
  importance INT DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  color TEXT, -- For visualization
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, name)
);

-- Store relationships between entities
CREATE TABLE public.knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'BLOCKS', 'ENABLES', 'REQUIRES', 'TRIGGERS', 
    'LEADS_TO', 'RELATED_TO', 'PART_OF', 'USES', 
    'IMPROVES', 'CONFLICTS_WITH'
  )),
  strength INT DEFAULT 5 CHECK (strength >= 1 AND strength <= 10), -- Connection strength
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_id, target_id, relationship_type)
);

-- Enable RLS
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_relationships ENABLE ROW LEVEL SECURITY;

-- Allow all access (single user app)
CREATE POLICY "Allow all access to knowledge_entities"
ON public.knowledge_entities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to knowledge_relationships"
ON public.knowledge_relationships FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_knowledge_entities_type ON knowledge_entities(entity_type);
CREATE INDEX idx_knowledge_entities_frequency ON knowledge_entities(frequency DESC);
CREATE INDEX idx_knowledge_relationships_source ON knowledge_relationships(source_id);
CREATE INDEX idx_knowledge_relationships_target ON knowledge_relationships(target_id);

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_entities_updated_at
  BEFORE UPDATE ON public.knowledge_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();