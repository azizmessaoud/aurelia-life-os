import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { generateEmbedding, generateWithOllama, selectAgent, buildRAGPrompt, calculateConfidence } from "~/lib/ollama.server";
import { insertDecision, searchSimilarDecisions, searchNotionContext } from "~/lib/supabase.server";
import type { DecisionContext, Recommendation } from "~/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const question = formData.get("question") as string;
  const focusArea = formData.get("focusArea") as string;
  const energyLevel = parseInt(formData.get("energyLevel") as string) || 3;
  const userId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth session

  try {
    // Step 1: Generate embedding for the question
    const embedding = await generateEmbedding(question);

    // Step 2: RAG - Search for similar past decisions and Notion context
    const [pastDecisions, notionContext] = await Promise.all([
      searchSimilarDecisions(embedding, userId, 3),
      searchNotionContext(embedding, userId, 5),
    ]);

    // Step 3: Select appropriate agent
    const { agent, model, systemPrompt } = selectAgent(focusArea);

    // Step 4: Build RAG-enhanced prompt
    const ragPrompt = buildRAGPrompt(question, notionContext, pastDecisions);

    // Step 5: Generate recommendation with Ollama
    const recommendation = await generateWithOllama(model, ragPrompt, systemPrompt);

    // Step 6: Calculate confidence score
    const confidence = calculateConfidence(
      pastDecisions.map(d => ({ similarity: d.similarity, confidence_score: d.confidence_score })),
      notionContext,
      [] // TODO: Fetch user feedback history
    );

    // Step 7: Store decision in database
    const decision = await insertDecision(userId, {
      question,
      context: {
        question,
        focusArea: focusArea as any,
        energyLevel: energyLevel as any,
      },
      agentUsed: agent as any,
      recommendation,
      confidenceScore: confidence,
      ragCitations: [
        ...notionContext.slice(0, 3).map(c => ({
          source: 'notion',
          title: c.page_title,
          excerpt: c.chunk_text.substring(0, 150),
          similarity: c.similarity,
        })),
        ...pastDecisions.slice(0, 2).map(d => ({
          source: 'past_decision',
          title: d.question,
          excerpt: d.recommendation.substring(0, 150),
          similarity: d.similarity,
        })),
      ],
      embedding,
    });

    return json({
      success: true,
      recommendation: {
        answer: recommendation,
        confidence,
        agent: agent as any,
        reasoning: `Based on ${notionContext.length} Notion contexts and ${pastDecisions.length} similar past decisions.`,
        citations: [
          ...notionContext.slice(0, 3).map(c => ({
            source: 'notion',
            title: c.page_title,
            excerpt: c.chunk_text.substring(0, 150),
            similarity: c.similarity,
          })),
        ],
        nextSteps: [],
      } as Recommendation,
      decisionId: decision.id,
    });
  } catch (error: any) {
    console.error('Error processing decision:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to process your request. Make sure Ollama is running.' 
    }, { status: 500 });
  }
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [focusArea, setFocusArea] = useState("study");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-axiom-purple to-axiom-blue bg-clip-text text-transparent">
            AXIOM + AURELIA
          </h1>
          <p className="text-gray-400 text-lg">
            Your Personal AI Operating System
          </p>
        </div>

        {/* Decision Input Form */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Ask for a Decision</h2>
          
          <Form method="post" className="space-y-6">
            {/* Question Input */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium mb-2">
                What decision do you need help with?
              </label>
              <textarea
                id="question"
                name="question"
                rows={4}
                required
                placeholder="e.g., Should I focus on finishing my machine learning project or study for my database exam this weekend?"
                className="input w-full"
              />
            </div>

            {/* Focus Area */}
            <div>
              <label htmlFor="focusArea" className="block text-sm font-medium mb-2">
                Focus Area
              </label>
              <select
                id="focusArea"
                name="focusArea"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="input w-full"
              >
                <option value="study">📚 Study (MENTOR)</option>
                <option value="career">💼 Career (ARCHITECT)</option>
                <option value="finance">💰 Finance (DEXTER)</option>
                <option value="relationships">👥 Relationships</option>
                <option value="health">🏃 Health</option>
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label htmlFor="energyLevel" className="block text-sm font-medium mb-2">
                Current Energy Level
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="energyLevel"
                  name="energyLevel"
                  min="1"
                  max="5"
                  defaultValue="3"
                  className="flex-1"
                />
                <span className="text-gray-400 w-12 text-right">1-5</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Consulting Agent Council...
                </span>
              ) : (
                'Get Recommendation'
              )}
            </button>
          </Form>
        </div>

        {/* Recommendation Output */}
        {actionData && 'recommendation' in actionData && actionData.success && (
          <div className="card border-l-4 border-aurelia-green">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Recommendation</h3>
                <p className="text-sm text-gray-400">
                  by {actionData.recommendation.agent} • Confidence: {Math.round(actionData.recommendation.confidence * 100)}%
                </p>
              </div>
              {/* Confidence Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                actionData.recommendation.confidence >= 0.7 
                  ? 'bg-green-500/20 text-green-400' 
                  : actionData.recommendation.confidence >= 0.5
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {Math.round(actionData.recommendation.confidence * 100)}% Confident
              </div>
            </div>

            <p className="text-gray-200 leading-relaxed mb-6 whitespace-pre-wrap">
              {actionData.recommendation.answer}
            </p>

            {/* Citations */}
            {actionData.recommendation.citations.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-400">Sources</h4>
                <div className="space-y-2">
                  {actionData.recommendation.citations.map((citation: any, i: number) => (
                    <div key={i} className="text-sm bg-gray-700/50 rounded p-3">
                      <div className="font-medium text-axiom-blue mb-1">{citation.title}</div>
                      <div className="text-gray-400 text-xs">{citation.excerpt}...</div>
                      <div className="text-gray-500 text-xs mt-1">
                        Similarity: {Math.round(citation.similarity * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="border-t border-gray-700 pt-4 mt-6">
              <p className="text-sm text-gray-400 mb-3">How helpful was this?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className="px-4 py-2 bg-gray-700 hover:bg-axiom-purple rounded transition-colors"
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {actionData && 'error' in actionData && actionData.success === false && (
          <div className="card border-l-4 border-red-500">
            <h3 className="text-xl font-bold mb-2 text-red-400">Error</h3>
            <p className="text-gray-300">{actionData.error}</p>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <a href="/dashboard" className="card hover:border-axiom-purple transition-colors cursor-pointer">
            <h3 className="font-bold mb-2">📊 Dashboard</h3>
            <p className="text-sm text-gray-400">View past decisions & patterns</p>
          </a>
          <a href="/aurelia" className="card hover:border-aurelia-green transition-colors cursor-pointer">
            <h3 className="font-bold mb-2">🌟 AURELIA Health</h3>
            <p className="text-sm text-gray-400">5D health tracking</p>
          </a>
        </div>
      </div>
    </div>
  );
}
