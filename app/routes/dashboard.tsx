import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { supabase } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth session

  // Fetch recent decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch patterns
  const { data: patterns } = await supabase
    .from('pattern_cache')
    .select('*')
    .eq('user_id', userId)
    .order('confidence', { ascending: false })
    .limit(5);

  // Calculate stats
  const totalDecisions = decisions?.length || 0;
  const avgConfidence = decisions?.length 
    ? decisions.reduce((acc, d) => acc + (d.confidence_score || 0), 0) / decisions.length
    : 0;
  const feedbackCount = decisions?.filter(d => d.user_feedback).length || 0;
  const avgFeedback = feedbackCount > 0
    ? decisions!.filter(d => d.user_feedback).reduce((acc, d) => acc + d.user_feedback!, 0) / feedbackCount
    : 0;

  return json({
    decisions: decisions || [],
    patterns: patterns || [],
    stats: {
      totalDecisions,
      avgConfidence: Math.round(avgConfidence * 100),
      avgFeedback: avgFeedback.toFixed(1),
      feedbackCount,
    },
  });
}

export default function Dashboard() {
  const { decisions, patterns, stats } = useLoaderData<typeof loader>();
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400 mt-1">Track your decisions and patterns</p>
            </div>
            <a href="/" className="btn-secondary">
              ← Back to AXIOM
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Total Decisions</div>
            <div className="text-3xl font-bold">{stats.totalDecisions}</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Avg Confidence</div>
            <div className="text-3xl font-bold text-axiom-purple">{stats.avgConfidence}%</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Avg Feedback</div>
            <div className="text-3xl font-bold text-aurelia-green">
              {stats.avgFeedback} / 5
            </div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Patterns Learned</div>
            <div className="text-3xl font-bold text-axiom-blue">{patterns.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Decisions */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Recent Decisions</h2>
              <div className="space-y-4">
                {decisions.map((decision: any) => (
                  <div
                    key={decision.id}
                    onClick={() => setSelectedDecision(decision)}
                    className="bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-200 flex-1">
                        {decision.question}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ml-4 ${
                        decision.confidence_score >= 0.7
                          ? 'bg-green-500/20 text-green-400'
                          : decision.confidence_score >= 0.5
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {Math.round(decision.confidence_score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="font-medium text-axiom-purple">
                        {decision.agent_used}
                      </span>
                      <span>•</span>
                      <span>{new Date(decision.created_at).toLocaleDateString()}</span>
                      {decision.user_feedback && (
                        <>
                          <span>•</span>
                          <span className="text-aurelia-green">
                            ⭐ {decision.user_feedback}/5
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {decisions.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No decisions yet. Start by asking AXIOM a question!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Learned Patterns */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Learned Patterns</h2>
              <div className="space-y-3">
                {patterns.map((pattern: any) => (
                  <div
                    key={pattern.id}
                    className="bg-gray-700/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold capitalize">
                        {pattern.pattern_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {pattern.sample_count} samples • Last seen{' '}
                      {new Date(pattern.last_seen).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {patterns.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    AURELIA is learning your patterns...
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <a href="/aurelia" className="block w-full btn-secondary text-center">
                  View Health Scores
                </a>
                <button className="block w-full btn-secondary">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Detail Modal */}
        {selectedDecision && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDecision(null)}
          >
            <div
              className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedDecision.question}</h3>
                <button
                  onClick={() => setSelectedDecision(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Recommendation</div>
                  <p className="text-gray-200">{selectedDecision.recommendation}</p>
                </div>
                {selectedDecision.rag_citations?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Sources</div>
                    <div className="space-y-2">
                      {selectedDecision.rag_citations.map((citation: any, i: number) => (
                        <div key={i} className="text-sm bg-gray-700/50 rounded p-2">
                          <div className="font-medium text-axiom-blue">{citation.title}</div>
                          <div className="text-gray-400 text-xs mt-1">{citation.excerpt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDecision.user_notes && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Your Notes</div>
                    <p className="text-gray-300">{selectedDecision.user_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
