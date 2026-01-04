import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { HealthScoreCard } from "@/components/intelligence/HealthScoreCard";
import { HealthScoreForm } from "@/components/intelligence/HealthScoreForm";
import { BurnoutTracker } from "@/components/intelligence/BurnoutTracker";
import { PatternInsightsCard } from "@/components/intelligence/PatternInsightsCard";
import { MoodTrendsCard } from "@/components/mood/MoodTrendsCard";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Intelligence() {
  const [healthFormOpen, setHealthFormOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const runFullAnalysis = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-patterns");
      if (error) throw error;
      
      toast.success("Intelligence analysis complete", {
        description: `Found ${data.patterns_detected} patterns and ${data.burnout_indicators_created} burnout signals`,
      });
    } catch (err: any) {
      toast.error("Analysis failed", {
        description: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <Brain className="h-8 w-8" />
              Intelligence Layer
            </h1>
            <p className="text-muted-foreground">
              Pattern detection, health tracking & burnout prevention
            </p>
          </div>
          <Button 
            onClick={runFullAnalysis}
            disabled={isRunning}
            className="glow-primary"
          >
            <Sparkles className={cn("h-4 w-4 mr-2", isRunning && "animate-spin")} />
            {isRunning ? "Analyzing..." : "Run Full Analysis"}
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <HealthScoreCard onLogHealth={() => setHealthFormOpen(true)} />
            <BurnoutTracker />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PatternInsightsCard limit={6} />
            <MoodTrendsCard />
          </div>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-sm">Data Collection</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Mood logs, health scores, and daily metrics feed the system
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-semibold text-sm">Pattern Detection</h3>
            <p className="text-xs text-muted-foreground mt-1">
              AI identifies trends, correlations, and warning signs
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="font-semibold text-sm">Actionable Insights</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Personalized recommendations to optimize your life
            </p>
          </div>
        </div>
      </div>

      <HealthScoreForm open={healthFormOpen} onOpenChange={setHealthFormOpen} />
    </AppLayout>
  );
}
