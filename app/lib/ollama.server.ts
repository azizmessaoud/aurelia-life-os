// Ollama integration for local LLM inference

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export type OllamaModel = 'mistral:7b-instruct-q4_K_M' | 'llama3.1:8b-instruct-q4_K_M' | 'qwen2.5-coder:7b-instruct-q4_K_M' | 'nomic-embed-text';

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface OllamaEmbeddingResponse {
  embedding: number[];
}

// Generate text with Ollama
export async function generateWithOllama(
  model: OllamaModel,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data: OllamaResponse = await response.json();
  return data.response;
}

// Generate embeddings with Ollama (nomic-embed-text)
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${response.statusText}`);
  }

  const data: OllamaEmbeddingResponse = await response.json();
  return data.embedding;
}

// Agent-specific prompts
const AGENT_PROMPTS = {
  DEXTER: `You are DEXTER, a financial decision-making agent. You help with money management, budgeting, investment decisions, and financial planning. Be practical, risk-aware, and data-driven. Always consider the user's financial context and goals.`,
  
  MENTOR: `You are MENTOR, an academic and learning agent. You help with study planning, course selection, learning strategies, and academic decisions. Be encouraging, strategic, and focused on long-term learning outcomes. Consider the user's energy levels and deadlines.`,
  
  ARCHITECT: `You are ARCHITECT, a career and project planning agent. You help with career decisions, project prioritization, skill development, and professional growth. Be strategic, forward-thinking, and focused on building sustainable systems. Consider the user's long-term vision.`,
};

// Route to appropriate agent based on focus area
export function selectAgent(focusArea: string): { agent: string; model: OllamaModel; systemPrompt: string } {
  switch (focusArea) {
    case 'finance':
      return {
        agent: 'DEXTER',
        model: 'mistral:7b-instruct-q4_K_M',
        systemPrompt: AGENT_PROMPTS.DEXTER,
      };
    case 'study':
      return {
        agent: 'MENTOR',
        model: 'llama3.1:8b-instruct-q4_K_M',
        systemPrompt: AGENT_PROMPTS.MENTOR,
      };
    case 'career':
      return {
        agent: 'ARCHITECT',
        model: 'qwen2.5-coder:7b-instruct-q4_K_M',
        systemPrompt: AGENT_PROMPTS.ARCHITECT,
      };
    default:
      return {
        agent: 'GENERAL',
        model: 'llama3.1:8b-instruct-q4_K_M',
        systemPrompt: 'You are a helpful AI assistant. Provide thoughtful, practical advice.',
      };
  }
}

// Build RAG-enhanced prompt
export function buildRAGPrompt(
  question: string,
  notionContext: Array<{ page_title: string; chunk_text: string; similarity: number }>,
  pastDecisions: Array<{ question: string; recommendation: string; similarity: number }>
): string {
  let prompt = `Question: ${question}\n\n`;

  if (notionContext.length > 0) {
    prompt += `Relevant context from your Notion workspace:\n`;
    notionContext.forEach((ctx, i) => {
      prompt += `${i + 1}. [${ctx.page_title}] ${ctx.chunk_text}\n`;
    });
    prompt += `\n`;
  }

  if (pastDecisions.length > 0) {
    prompt += `Similar past decisions:\n`;
    pastDecisions.forEach((dec, i) => {
      prompt += `${i + 1}. Q: ${dec.question}\n   A: ${dec.recommendation}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Based on the above context, provide a concise, actionable recommendation for the question. Be specific and practical.`;

  return prompt;
}

// Calculate confidence score based on patterns
export function calculateConfidence(
  pastDecisions: Array<{ similarity: number; confidence_score: number | null }>,
  notionMatches: Array<{ similarity: number }>,
  userFeedbackHistory: Array<{ user_feedback: number | null }>
): number {
  let confidence = 0.5; // Base confidence

  // Boost from similar past decisions
  if (pastDecisions.length > 0) {
    const avgSimilarity = pastDecisions.reduce((acc, d) => acc + d.similarity, 0) / pastDecisions.length;
    confidence += avgSimilarity * 0.2;
  }

  // Boost from Notion context
  if (notionMatches.length >= 3) {
    confidence += 0.1;
  }

  // Boost from positive feedback history
  const recentFeedback = userFeedbackHistory.slice(0, 10);
  if (recentFeedback.length > 0) {
    const avgFeedback = recentFeedback.reduce((acc, f) => acc + (f.user_feedback || 3), 0) / recentFeedback.length;
    if (avgFeedback >= 4) {
      confidence += 0.15;
    } else if (avgFeedback <= 2) {
      confidence -= 0.1;
    }
  }

  return Math.max(0.1, Math.min(0.95, confidence));
}
