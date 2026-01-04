import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Brain, 
  Dumbbell, 
  Sparkles, 
  Flame 
} from "lucide-react";
import { useCreateHealthScore } from "@/hooks/useHealthScores";
import { cn } from "@/lib/utils";

const dimensions = [
  { 
    key: "emotional", 
    label: "Emotional", 
    icon: Heart, 
    color: "text-chart-1",
    description: "Ability to process feelings, emotional resilience",
  },
  { 
    key: "mental", 
    label: "Mental", 
    icon: Brain, 
    color: "text-chart-2",
    description: "Focus, clarity, cognitive sharpness",
  },
  { 
    key: "physical", 
    label: "Physical", 
    icon: Dumbbell, 
    color: "text-chart-3",
    description: "Energy, sleep quality, body wellness",
  },
  { 
    key: "spiritual", 
    label: "Spiritual", 
    icon: Sparkles, 
    color: "text-chart-4",
    description: "Sense of purpose, meaning, connection",
  },
  { 
    key: "hormonal", 
    label: "Hormonal", 
    icon: Flame, 
    color: "text-chart-5",
    description: "Stress response, mood stability, vitality",
  },
] as const;

function getScoreLabel(score: number): string {
  if (score <= 2) return "Critical";
  if (score <= 4) return "Low";
  if (score <= 6) return "Moderate";
  if (score <= 8) return "Good";
  return "Excellent";
}

interface HealthScoreFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HealthScoreForm({ open, onOpenChange }: HealthScoreFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    emotional: 5,
    mental: 5,
    physical: 5,
    spiritual: 5,
    hormonal: 5,
  });
  const [notes, setNotes] = useState("");
  
  const createHealthScore = useCreateHealthScore();

  const handleSubmit = () => {
    createHealthScore.mutate({
      emotional: scores.emotional,
      mental: scores.mental,
      physical: scores.physical,
      spiritual: scores.spiritual,
      hormonal: scores.hormonal,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setScores({
          emotional: 5,
          mental: 5,
          physical: 5,
          spiritual: 5,
          hormonal: 5,
        });
        setNotes("");
        onOpenChange(false);
      },
    });
  };

  const overallScore = Math.round(
    Object.values(scores).reduce((sum, v) => sum + v, 0) / 5
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            5D Health Check
          </DialogTitle>
          <DialogDescription>
            Rate each dimension of your wellbeing from 1-10
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {dimensions.map(({ key, label, icon: Icon, color, description }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {scores[key]}/10 • {getScoreLabel(scores[key])}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
              <Slider
                value={[scores[key]]}
                onValueChange={(v) => setScores(prev => ({ ...prev, [key]: v[0] }))}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
            </div>
          ))}

          {/* Overall Preview */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
            <p className="text-3xl font-bold">{overallScore}/10</p>
            <p className="text-sm text-muted-foreground">
              {getScoreLabel(overallScore)}
            </p>
          </div>

          {/* Notes */}
          <Textarea
            placeholder="Any notes about your current state..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none h-20"
          />

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={createHealthScore.isPending}
          >
            {createHealthScore.isPending ? "Saving..." : "Log Health Score"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
