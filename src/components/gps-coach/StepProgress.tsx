import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
}

const PHASES = [
  { name: 'GOAL', steps: [1, 2, 3], color: 'bg-emerald-500' },
  { name: 'PLAN', steps: [4, 5, 6, 7], color: 'bg-blue-500' },
  { name: 'SYSTEM', steps: [8, 9, 10, 11, 12], color: 'bg-purple-500' },
];

export function StepProgress({ currentStep, totalSteps = 12 }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  const getCurrentPhase = () => {
    if (currentStep <= 3) return 'GOAL';
    if (currentStep <= 7) return 'PLAN';
    return 'SYSTEM';
  };

  const currentPhase = getCurrentPhase();

  return (
    <div className="space-y-3">
      {/* Phase indicators */}
      <div className="flex justify-between text-xs font-medium">
        {PHASES.map((phase) => (
          <div
            key={phase.name}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              currentPhase === phase.name ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                phase.steps.includes(currentStep + 1) ? phase.color : "bg-muted"
              )}
            />
            <span>{phase.name}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress value={progress} className="h-2" />
        <div className="absolute -top-0.5 right-0 text-xs text-muted-foreground">
          {currentStep}/{totalSteps}
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-between px-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const phase = PHASES.find(p => p.steps.includes(stepNum));
          const isCompleted = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep + 1;

          return (
            <div
              key={stepNum}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                isCompleted ? phase?.color : isCurrent ? "bg-primary ring-2 ring-primary/30" : "bg-muted"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
