import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { upsertHealthScore, getHealthScores, getDailyTasks } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth session
  
  // Get last 30 days of health scores
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const healthScores = await getHealthScores(userId, startDate, endDate);
  
  // Get today's tasks
  const today = new Date().toISOString().split('T')[0];
  const dailyTasks = await getDailyTasks(userId, today);

  // Get today's score
  const todayScore = healthScores.find(s => s.date === today);

  return json({
    healthScores,
    dailyTasks,
    todayScore: todayScore || null,
    today,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth session
  const formData = await request.formData();
  
  const emotion = parseInt(formData.get("emotion") as string);
  const mind = parseInt(formData.get("mind") as string);
  const body = parseInt(formData.get("body") as string);
  const soul = parseInt(formData.get("soul") as string);
  const hormones = parseInt(formData.get("hormones") as string);
  
  const overall = Math.round((emotion + mind + body + soul + hormones) / 5);
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await upsertHealthScore(userId, {
      date: today,
      emotionScore: emotion,
      mindScore: mind,
      bodyScore: body,
      soulScore: soul,
      hormonesScore: hormones,
      overallScore: overall,
      metadata: {},
    });

    return json({ success: true });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function Aurelia() {
  const { healthScores, dailyTasks, todayScore, today } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Prepare radar chart data for today
  const radarData = todayScore ? [
    { dimension: 'Emotion', score: todayScore.emotionScore },
    { dimension: 'Mind', score: todayScore.mindScore },
    { dimension: 'Body', score: todayScore.bodyScore },
    { dimension: 'Soul', score: todayScore.soulScore },
    { dimension: 'Hormones', score: todayScore.hormonesScore },
  ] : [];

  // Calculate 7-day average
  const last7Days = healthScores.slice(-7);
  const avg7Days = last7Days.length > 0
    ? Math.round(last7Days.reduce((acc, s) => acc + s.overallScore, 0) / last7Days.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-aurelia-green/20 to-aurelia-orange/20 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AURELIA Health Tracking</h1>
              <p className="text-gray-400 mt-1">5D Holistic Wellbeing System</p>
            </div>
            <a href="/" className="btn-secondary">
              ← Back to AXIOM
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Today's Scoring */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Today's Check-In</h2>
              
              {actionData?.success && (
                <div className="bg-green-500/20 text-green-400 rounded-lg p-3 mb-4 text-sm">
                  ✓ Health score saved!
                </div>
              )}

              <Form method="post" className="space-y-5">
                {/* Emotion */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    😊 Emotion
                  </label>
                  <input
                    type="range"
                    name="emotion"
                    min="0"
                    max="100"
                    defaultValue={todayScore?.emotionScore || 50}
                    className="w-full"
                  />
                </div>

                {/* Mind */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    🧠 Mind
                  </label>
                  <input
                    type="range"
                    name="mind"
                    min="0"
                    max="100"
                    defaultValue={todayScore?.mindScore || 50}
                    className="w-full"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    💪 Body
                  </label>
                  <input
                    type="range"
                    name="body"
                    min="0"
                    max="100"
                    defaultValue={todayScore?.bodyScore || 50}
                    className="w-full"
                  />
                </div>

                {/* Soul */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ✨ Soul
                  </label>
                  <input
                    type="range"
                    name="soul"
                    min="0"
                    max="100"
                    defaultValue={todayScore?.soulScore || 50}
                    className="w-full"
                  />
                </div>

                {/* Hormones */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ⚡ Hormones
                  </label>
                  <input
                    type="range"
                    name="hormones"
                    min="0"
                    max="100"
                    defaultValue={todayScore?.hormonesScore || 50}
                    className="w-full"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Save Today's Score
                </button>
              </Form>
            </div>

            {/* Overall Score */}
            {todayScore && (
              <div className="card mt-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Overall Score</div>
                <div className="text-5xl font-bold text-aurelia-green">
                  {todayScore.overallScore}
                </div>
                <div className="text-gray-400 text-sm mt-2">out of 100</div>
              </div>
            )}
          </div>

          {/* Center: Radar Chart */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">5D Health Radar</h2>
              
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      tick={{ fill: '#9CA3AF', fontSize: 14 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Radar
                      name="Today's Score"
                      dataKey="score"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.5}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p>Complete today's check-in to see your radar</p>
                  </div>
                </div>
              )}

              {/* 7-day trend */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">7-Day Average</div>
                    <div className="text-3xl font-bold text-axiom-purple mt-1">
                      {avg7Days}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {last7Days.length} days tracked
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Tasks */}
            <div className="card mt-6">
              <h2 className="text-xl font-bold mb-4">Today's Tasks</h2>
              <div className="space-y-3">
                {dailyTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="bg-gray-700/50 rounded-lg p-4 flex items-start gap-4"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={task.completed}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{task.title}</span>
                        <span className="text-xs px-2 py-1 bg-axiom-purple/20 text-axiom-purple rounded">
                          {task.task_type}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-400">{task.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Energy: {'⚡'.repeat(task.energy_cost)}
                      </div>
                    </div>
                  </div>
                ))}
                {dailyTasks.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No tasks for today. AURELIA will generate them based on your patterns.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
