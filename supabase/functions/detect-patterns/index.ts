import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MoodLog {
  energy_level: number;
  mood: number;
  stress: number;
  trigger: string | null;
  logged_at: string;
}

interface DailyLog {
  deep_work_minutes: number;
  hours_coded: number;
  workouts_done: number;
  log_date: string;
}

interface HealthScore {
  emotional: number;
  mental: number;
  physical: number;
  spiritual: number;
  hormonal: number;
  overall: number;
  calculated_at: string;
}

interface PatternResult {
  pattern_type: string;
  title: string;
  description: string;
  confidence: number;
  data: Record<string, unknown>;
  is_actionable: boolean;
  severity?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const { user, error: authError } = await authenticateRequest(req);
  if (authError || !user) {
    return unauthorizedResponse(authError || "Unauthorized", corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch last 14 days of data
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDate = fourteenDaysAgo.toISOString();

    const [moodResult, dailyResult, healthResult] = await Promise.all([
      supabase.from("mood_logs").select("*").gte("logged_at", startDate).order("logged_at", { ascending: true }),
      supabase.from("daily_logs").select("*").gte("log_date", startDate.split("T")[0]).order("log_date", { ascending: true }),
      supabase.from("health_scores").select("*").gte("calculated_at", startDate).order("calculated_at", { ascending: true }),
    ]);

    const moodLogs: MoodLog[] = moodResult.data || [];
    const dailyLogs: DailyLog[] = dailyResult.data || [];
    const healthScores: HealthScore[] = healthResult.data || [];

    const patterns: PatternResult[] = [];
    const burnoutIndicators: PatternResult[] = [];

    // Pattern 1: Energy decline trend
    if (moodLogs.length >= 5) {
      const recent5 = moodLogs.slice(-5);
      const older5 = moodLogs.slice(-10, -5);
      
      if (older5.length >= 3) {
        const recentAvg = recent5.reduce((sum, m) => sum + m.energy_level, 0) / recent5.length;
        const olderAvg = older5.reduce((sum, m) => sum + m.energy_level, 0) / older5.length;
        
        if (recentAvg < olderAvg - 1.5) {
          patterns.push({
            pattern_type: "energy_decline",
            title: "Energy Declining",
            description: `Your energy has dropped from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} over the past week. Consider reviewing sleep, nutrition, or workload.`,
            confidence: 0.8,
            data: { recentAvg, olderAvg, decline: olderAvg - recentAvg },
            is_actionable: true,
          });

          if (olderAvg - recentAvg > 2) {
            burnoutIndicators.push({
              pattern_type: "energy_crash",
              title: "Significant Energy Crash",
              description: `Energy dropped by ${(olderAvg - recentAvg).toFixed(1)} points - potential burnout signal`,
              confidence: 0.85,
              data: {},
              is_actionable: true,
              severity: 3,
            });
          }
        }
      }
    }

    // Pattern 2: High stress sustained
    if (moodLogs.length >= 3) {
      const recentLogs = moodLogs.slice(-7);
      const highStressDays = recentLogs.filter(m => m.stress >= 7).length;
      
      if (highStressDays >= 3) {
        patterns.push({
          pattern_type: "sustained_stress",
          title: "Sustained High Stress",
          description: `You've had ${highStressDays} high-stress entries in the past week. Your nervous system needs recovery time.`,
          confidence: 0.85,
          data: { highStressDays, avgStress: recentLogs.reduce((s, m) => s + m.stress, 0) / recentLogs.length },
          is_actionable: true,
        });

        burnoutIndicators.push({
          pattern_type: "chronic_stress",
          title: "Chronic Stress Pattern",
          description: `${highStressDays} days of high stress detected`,
          confidence: 0.9,
          data: {},
          is_actionable: true,
          severity: highStressDays >= 5 ? 4 : 3,
        });
      }
    }

    // Pattern 3: Low mood + low energy combo
    if (moodLogs.length >= 3) {
      const recentLogs = moodLogs.slice(-5);
      const lowMoodEnergy = recentLogs.filter(m => m.mood <= 4 && m.energy_level <= 4).length;
      
      if (lowMoodEnergy >= 2) {
        patterns.push({
          pattern_type: "low_mood_energy",
          title: "Low Mood & Energy Pattern",
          description: `${lowMoodEnergy} recent entries show both low mood and energy. This combination often precedes burnout.`,
          confidence: 0.8,
          data: { lowMoodEnergy },
          is_actionable: true,
        });

        burnoutIndicators.push({
          pattern_type: "depletion",
          title: "Emotional/Physical Depletion",
          description: `Combined low mood + energy detected ${lowMoodEnergy} times`,
          confidence: 0.85,
          data: {},
          is_actionable: true,
          severity: lowMoodEnergy >= 3 ? 4 : 2,
        });
      }
    }

    // Pattern 4: Deep work consistency
    if (dailyLogs.length >= 5) {
      const avgDeepWork = dailyLogs.reduce((sum, d) => sum + (d.deep_work_minutes || 0), 0) / dailyLogs.length;
      const zeroDays = dailyLogs.filter(d => (d.deep_work_minutes || 0) === 0).length;
      
      if (zeroDays >= 3) {
        patterns.push({
          pattern_type: "deep_work_gap",
          title: "Deep Work Consistency Gap",
          description: `${zeroDays} days with no deep work logged. Consistency matters more than intensity.`,
          confidence: 0.75,
          data: { zeroDays, avgDeepWork },
          is_actionable: true,
        });
      } else if (avgDeepWork > 120) {
        patterns.push({
          pattern_type: "deep_work_strength",
          title: "Strong Deep Work Habit",
          description: `Averaging ${Math.round(avgDeepWork)} minutes of deep work daily. This is building toward mastery!`,
          confidence: 0.9,
          data: { avgDeepWork },
          is_actionable: false,
        });
      }
    }

    // Pattern 5: Exercise and mood correlation
    if (dailyLogs.length >= 5 && moodLogs.length >= 5) {
      const exerciseDays = dailyLogs.filter(d => (d.workouts_done || 0) > 0).map(d => d.log_date);
      const moodOnExerciseDays = moodLogs.filter(m => 
        exerciseDays.some(ed => m.logged_at.startsWith(ed))
      );
      const moodOnRestDays = moodLogs.filter(m => 
        !exerciseDays.some(ed => m.logged_at.startsWith(ed))
      );
      
      if (moodOnExerciseDays.length >= 2 && moodOnRestDays.length >= 2) {
        const exerciseAvgMood = moodOnExerciseDays.reduce((s, m) => s + m.mood, 0) / moodOnExerciseDays.length;
        const restAvgMood = moodOnRestDays.reduce((s, m) => s + m.mood, 0) / moodOnRestDays.length;
        
        if (exerciseAvgMood > restAvgMood + 0.5) {
          patterns.push({
            pattern_type: "exercise_mood_boost",
            title: "Exercise Boosts Your Mood",
            description: `Your mood averages ${exerciseAvgMood.toFixed(1)} on workout days vs ${restAvgMood.toFixed(1)} on rest days. Exercise is medicine for you!`,
            confidence: 0.85,
            data: { exerciseAvgMood, restAvgMood },
            is_actionable: true,
          });
        }
      }
    }

    // Pattern 6: Trigger analysis
    if (moodLogs.length >= 5) {
      const triggers = moodLogs.filter(m => m.trigger).map(m => m.trigger);
      const triggerCounts: Record<string, { count: number; avgEnergy: number; avgMood: number }> = {};
      
      moodLogs.filter(m => m.trigger).forEach(m => {
        const t = m.trigger!;
        if (!triggerCounts[t]) {
          triggerCounts[t] = { count: 0, avgEnergy: 0, avgMood: 0 };
        }
        triggerCounts[t].count++;
        triggerCounts[t].avgEnergy += m.energy_level;
        triggerCounts[t].avgMood += m.mood;
      });

      Object.entries(triggerCounts).forEach(([trigger, stats]) => {
        stats.avgEnergy /= stats.count;
        stats.avgMood /= stats.count;
        
        if (stats.count >= 2) {
          if (stats.avgEnergy <= 4 || stats.avgMood <= 4) {
            patterns.push({
              pattern_type: "negative_trigger",
              title: `"${trigger}" Drains You`,
              description: `When "${trigger}" happens, your energy averages ${stats.avgEnergy.toFixed(1)} and mood ${stats.avgMood.toFixed(1)}. Consider strategies to manage this.`,
              confidence: 0.7,
              data: { trigger, ...stats },
              is_actionable: true,
            });
          } else if (stats.avgEnergy >= 7 && stats.avgMood >= 7) {
            patterns.push({
              pattern_type: "positive_trigger",
              title: `"${trigger}" Energizes You`,
              description: `"${trigger}" correlates with high energy (${stats.avgEnergy.toFixed(1)}) and mood (${stats.avgMood.toFixed(1)}). Do more of this!`,
              confidence: 0.7,
              data: { trigger, ...stats },
              is_actionable: true,
            });
          }
        }
      });
    }

    // Pattern 7: Health dimension imbalance
    if (healthScores.length >= 1) {
      const latest = healthScores[healthScores.length - 1];
      const dimensions = [
        { name: "emotional", value: latest.emotional },
        { name: "mental", value: latest.mental },
        { name: "physical", value: latest.physical },
        { name: "spiritual", value: latest.spiritual },
        { name: "hormonal", value: latest.hormonal },
      ];
      
      const lowest = dimensions.reduce((min, d) => d.value < min.value ? d : min);
      const highest = dimensions.reduce((max, d) => d.value > max.value ? d : max);
      
      if (highest.value - lowest.value >= 4) {
        patterns.push({
          pattern_type: "health_imbalance",
          title: "Health Dimension Imbalance",
          description: `Your ${lowest.name} health (${lowest.value}) is significantly lower than ${highest.name} (${highest.value}). Balance promotes resilience.`,
          confidence: 0.75,
          data: { lowest, highest, gap: highest.value - lowest.value },
          is_actionable: true,
        });
      }

      if (latest.overall <= 4) {
        burnoutIndicators.push({
          pattern_type: "low_overall_health",
          title: "Low Overall Health Score",
          description: `5D health score at ${latest.overall}/10`,
          confidence: 0.9,
          data: {},
          is_actionable: true,
          severity: latest.overall <= 3 ? 4 : 3,
        });
      }
    }

    // Store patterns in database
    if (patterns.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      
      const patternInserts = patterns.map(p => ({
        pattern_type: p.pattern_type,
        title: p.title,
        description: p.description,
        confidence: p.confidence,
        data: p.data,
        is_actionable: p.is_actionable,
        expires_at: expiresAt.toISOString(),
      }));

      await supabase.from("pattern_insights").insert(patternInserts);
    }

    // Store burnout indicators
    if (burnoutIndicators.length > 0) {
      const indicatorInserts = burnoutIndicators.map(b => ({
        indicator_type: b.pattern_type,
        severity: b.severity || 2,
        description: b.description,
      }));

      await supabase.from("burnout_indicators").insert(indicatorInserts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        patterns_detected: patterns.length,
        burnout_indicators_created: burnoutIndicators.length,
        patterns: patterns.map(p => ({ type: p.pattern_type, title: p.title })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pattern detection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
