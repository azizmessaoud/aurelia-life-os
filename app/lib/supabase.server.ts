import { createClient } from '@supabase/supabase-js';
import type { Decision, Citation, PatternCache, KnowledgeEntity, NotionChunk, HealthScore, DailyTask } from '~/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Insert a new decision
export async function insertDecision(userId: string, decision: Omit<Decision, 'id' | 'userId' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      question: decision.question,
      context: decision.context,
      agent_used: decision.agentUsed,
      recommendation: decision.recommendation,
      confidence_score: decision.confidenceScore,
      rag_citations: decision.ragCitations,
      embedding: decision.embedding,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update decision with user feedback
export async function updateDecisionFeedback(decisionId: string, feedback: number, notes?: string) {
  const { data, error } = await supabase
    .from('decisions')
    .update({
      user_feedback: feedback,
      user_notes: notes,
    })
    .eq('id', decisionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// RAG: Search similar decisions
export async function searchSimilarDecisions(embedding: number[], userId: string, limit = 5) {
  const { data, error } = await supabase.rpc('search_similar_decisions', {
    query_embedding: embedding,
    match_user_id: userId,
    match_count: limit,
  });

  if (error) throw error;
  return data as Array<{
    id: string;
    question: string;
    recommendation: string;
    confidence_score: number;
    similarity: number;
  }>;
}

// RAG: Search Notion context
export async function searchNotionContext(embedding: number[], userId: string, limit = 10) {
  const { data, error } = await supabase.rpc('search_notion_context', {
    query_embedding: embedding,
    match_user_id: userId,
    match_count: limit,
  });

  if (error) throw error;
  return data as Array<{
    page_title: string;
    chunk_text: string;
    similarity: number;
  }>;
}

// Get user patterns (for confidence scoring)
export async function getUserPatterns(userId: string, patternType?: string) {
  let query = supabase
    .from('pattern_cache')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen', { ascending: false });

  if (patternType) {
    query = query.eq('pattern_type', patternType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as PatternCache[];
}

// Update or insert pattern
export async function upsertPattern(userId: string, pattern: Omit<PatternCache, 'id' | 'userId' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('pattern_cache')
    .upsert({
      user_id: userId,
      pattern_type: pattern.patternType,
      pattern_data: pattern.patternData,
      confidence: pattern.confidence,
      sample_count: pattern.sampleCount,
      last_seen: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get knowledge entities by focus area
export async function getKnowledgeEntities(userId: string, focusArea?: string) {
  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (focusArea) {
    query = query.eq('focus_area', focusArea);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as KnowledgeEntity[];
}

// Insert Notion chunk
export async function insertNotionChunk(userId: string, chunk: Omit<NotionChunk, 'id' | 'userId' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('notion_chunks')
    .upsert({
      user_id: userId,
      page_id: chunk.pageId,
      page_title: chunk.pageTitle,
      chunk_text: chunk.chunkText,
      chunk_index: chunk.chunkIndex,
      metadata: chunk.metadata,
      embedding: chunk.embedding,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get health scores for date range
export async function getHealthScores(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data as HealthScore[];
}

// Upsert daily health score
export async function upsertHealthScore(userId: string, score: Omit<HealthScore, 'id' | 'userId' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('health_scores')
    .upsert({
      user_id: userId,
      date: score.date,
      emotion_score: score.emotionScore,
      mind_score: score.mindScore,
      body_score: score.bodyScore,
      soul_score: score.soulScore,
      hormones_score: score.hormonesScore,
      overall_score: score.overallScore,
      metadata: score.metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get daily tasks for a date
export async function getDailyTasks(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('priority', { ascending: true });

  if (error) throw error;
  return data as DailyTask[];
}

// Insert daily task
export async function insertDailyTask(userId: string, task: Omit<DailyTask, 'id' | 'userId' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      user_id: userId,
      date: task.date,
      task_type: task.taskType,
      title: task.title,
      description: task.description,
      priority: task.priority,
      completed: task.completed,
      energy_cost: task.energyCost,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update task completion
export async function updateTaskCompletion(taskId: string, completed: boolean) {
  const { data, error } = await supabase
    .from('daily_tasks')
    .update({ completed })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
