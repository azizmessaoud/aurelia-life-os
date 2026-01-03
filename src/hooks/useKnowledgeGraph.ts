import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EntityType = 'project' | 'blocker' | 'emotion' | 'pattern' | 'win' | 'skill' | 'person' | 'tool' | 'habit';
export type RelationshipType = 'BLOCKS' | 'ENABLES' | 'REQUIRES' | 'TRIGGERS' | 'LEADS_TO' | 'RELATED_TO' | 'PART_OF' | 'USES' | 'IMPROVES' | 'CONFLICTS_WITH';

export interface KnowledgeEntity {
  id: string;
  entity_type: EntityType;
  name: string;
  description: string | null;
  frequency: number;
  importance: number;
  color: string | null;
  last_mentioned: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRelationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  strength: number;
  notes: string | null;
  created_at: string;
}

export interface CreateEntityInput {
  entity_type: EntityType;
  name: string;
  description?: string;
  importance?: number;
  color?: string;
}

export interface CreateRelationshipInput {
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  strength?: number;
  notes?: string;
}

// Entity type colors for visualization
export const ENTITY_COLORS: Record<EntityType, string> = {
  project: '#8B5CF6',    // Purple
  blocker: '#EF4444',    // Red
  emotion: '#F59E0B',    // Amber
  pattern: '#06B6D4',    // Cyan
  win: '#10B981',        // Green
  skill: '#3B82F6',      // Blue
  person: '#EC4899',     // Pink
  tool: '#6366F1',       // Indigo
  habit: '#14B8A6',      // Teal
};

// Relationship labels for display
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  BLOCKS: 'blocks',
  ENABLES: 'enables',
  REQUIRES: 'requires',
  TRIGGERS: 'triggers',
  LEADS_TO: 'leads to',
  RELATED_TO: 'related to',
  PART_OF: 'part of',
  USES: 'uses',
  IMPROVES: 'improves',
  CONFLICTS_WITH: 'conflicts with',
};

// Fetch all entities
export function useKnowledgeEntities() {
  return useQuery({
    queryKey: ["knowledge_entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entities")
        .select("*")
        .order("frequency", { ascending: false });

      if (error) throw error;
      return data as KnowledgeEntity[];
    },
  });
}

// Fetch all relationships
export function useKnowledgeRelationships() {
  return useQuery({
    queryKey: ["knowledge_relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_relationships")
        .select("*");

      if (error) throw error;
      return data as KnowledgeRelationship[];
    },
  });
}

// Fetch full graph (entities + relationships)
export function useKnowledgeGraph() {
  const entities = useKnowledgeEntities();
  const relationships = useKnowledgeRelationships();

  return {
    entities: entities.data || [],
    relationships: relationships.data || [],
    isLoading: entities.isLoading || relationships.isLoading,
    error: entities.error || relationships.error,
  };
}

// Create entity
export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      const { data, error } = await supabase
        .from("knowledge_entities")
        .insert([{
          ...input,
          color: input.color || ENTITY_COLORS[input.entity_type],
        }])
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeEntity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_entities"] });
      toast.success("Entity added to knowledge graph");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Entity already exists");
      } else {
        toast.error("Failed to add entity", { description: error.message });
      }
    },
  });
}

// Update entity
export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeEntity> & { id: string }) => {
      const { data, error } = await supabase
        .from("knowledge_entities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeEntity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_entities"] });
    },
  });
}

// Delete entity
export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_entities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_entities"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge_relationships"] });
      toast.success("Entity removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove entity", { description: error.message });
    },
  });
}

// Create relationship
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      const { data, error } = await supabase
        .from("knowledge_relationships")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeRelationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_relationships"] });
      toast.success("Connection created");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Connection already exists");
      } else {
        toast.error("Failed to create connection", { description: error.message });
      }
    },
  });
}

// Delete relationship
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_relationships")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_relationships"] });
      toast.success("Connection removed");
    },
  });
}

// Increment entity frequency (when mentioned)
export function useIncrementEntityFrequency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from("knowledge_entities")
        .select("frequency")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("knowledge_entities")
        .update({ 
          frequency: (current?.frequency || 0) + 1,
          last_mentioned: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeEntity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge_entities"] });
    },
  });
}
