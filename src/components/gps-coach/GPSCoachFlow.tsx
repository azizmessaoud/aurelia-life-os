import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useGPSCoach } from "@/hooks/useGPSCoach";
import { StepProgress } from "./StepProgress";
import { BlueprintDisplay } from "./BlueprintDisplay";
import { cn } from "@/lib/utils";

const COACHING_STEPS_INFO = [
  { phase: 'GOAL', stepNum: 1, title: 'The Goal', question: 'What is your goal? Be as specific as you can.' },
  { phase: 'GOAL', stepNum: 2, title: 'The Why', question: 'Why does this matter to you?' },
  { phase: 'GOAL', stepNum: 3, title: 'Excitement Level', question: 'How excited are you (1-10)?' },
  { phase: 'PLAN', stepNum: 4, title: 'Major Moves', question: 'What are the 3-5 major milestones?' },
  { phase: 'PLAN', stepNum: 5, title: 'Plan Confidence', question: 'What\'s your confidence level (%)?' },
  { phase: 'PLAN', stepNum: 6, title: 'Reality Check', question: 'What\'s your ACTUAL confidence?' },
  { phase: 'PLAN', stepNum: 7, title: 'Plan Refinement', question: 'What adjustments are needed?' },
  { phase: 'SYSTEM', stepNum: 8, title: 'Reminders & Cues', question: 'What reminders will you set?' },
  { phase: 'SYSTEM', stepNum: 9, title: 'Tracking Metrics', question: 'How will you track progress?' },
  { phase: 'SYSTEM', stepNum: 10, title: 'Potential Blockers', question: 'What are the 3 biggest obstacles?' },
  { phase: 'SYSTEM', stepNum: 11, title: 'Accountability', question: 'Who will hold you accountable?' },
  { phase: 'SYSTEM', stepNum: 12, title: 'Next Actions', question: 'What\'s the ONE thing this week?' },
];

export function GPSCoachFlow() {
  const {
    currentStep,
    coachingHistory,
    isStreaming,
    streamingContent,
    blueprint,
    goalTitle,
    startCoaching,
    submitResponse,
    resetCoaching,
  } = useGPSCoach();

  const [inputValue, setInputValue] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [coachingHistory, streamingContent]);

  const handleStart = async () => {
    setHasStarted(true);
    await startCoaching();
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const value = inputValue;
    setInputValue('');
    await submitResponse(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Show blueprint if completed
  if (blueprint) {
    return (
      <BlueprintDisplay
        blueprint={blueprint}
        goalTitle={goalTitle}
        onReset={resetCoaching}
      />
    );
  }

  // Show start screen
  if (!hasStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">GPS Goal Coach</h2>
            <p className="text-muted-foreground">
              Create your personalized goal achievement blueprint using Ali Abdaal's GPS framework
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-semibold text-emerald-500 mb-1">G - Goal</div>
              <div className="text-muted-foreground text-xs">What you want & why</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="font-semibold text-blue-500 mb-1">P - Plan</div>
              <div className="text-muted-foreground text-xs">Milestones & reality check</div>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="font-semibold text-purple-500 mb-1">S - System</div>
              <div className="text-muted-foreground text-xs">Habits & accountability</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Answer 12 coaching questions to generate your GPS Blueprint.
            <br />
            Takes about 10-15 minutes.
          </p>

          <Button onClick={handleStart} size="lg" className="w-full max-w-xs">
            Start Coaching Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStepInfo = COACHING_STEPS_INFO[currentStep] || COACHING_STEPS_INFO[0];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <StepProgress currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-col h-[500px]">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {/* Render coaching history */}
              {coachingHistory.map((entry, idx) => (
                <div key={idx} className="space-y-3">
                  {/* AI question/ack from previous step */}
                  {entry.question && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">AI</span>
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                        {entry.question}
                      </div>
                    </div>
                  )}
                  
                  {/* User answer */}
                  {entry.answer && (
                    <div className="flex gap-3 justify-end">
                      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg p-3 text-sm">
                        {entry.answer}
                      </div>
                    </div>
                  )}

                  {/* AI acknowledgment */}
                  {entry.aiAck && entry.aiAck !== 'Blueprint generated' && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">AI</span>
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                        {entry.aiAck}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming content */}
              {isStreaming && streamingContent && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">AI</span>
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                    {streamingContent}
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Current step indicator */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                "px-2 py-0.5 rounded font-medium",
                currentStepInfo.phase === 'GOAL' && "bg-emerald-500/20 text-emerald-500",
                currentStepInfo.phase === 'PLAN' && "bg-blue-500/20 text-blue-500",
                currentStepInfo.phase === 'SYSTEM' && "bg-purple-500/20 text-purple-500",
              )}>
                {currentStepInfo.phase}
              </span>
              <span className="text-muted-foreground">
                Step {currentStep + 1}: {currentStepInfo.title}
              </span>
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts..."
                disabled={isStreaming}
                className="min-h-[60px] resize-none"
                rows={2}
              />
              <Button
                onClick={handleSubmit}
                disabled={isStreaming || !inputValue.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
