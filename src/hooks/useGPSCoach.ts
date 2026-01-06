import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoachingEntry {
  stepNum: number;
  phase: string;
  question: string;
  answer: string;
  aiAck: string;
}

interface GPSBlueprint {
  id: string;
  goal_title: string;
  blueprint_markdown: string | null;
  coaching_history: CoachingEntry[];
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const COACHING_STEPS = [
  { phase: 'GOAL', stepNum: 1, title: 'The Goal' },
  { phase: 'GOAL', stepNum: 2, title: 'The Why' },
  { phase: 'GOAL', stepNum: 3, title: 'Excitement Level' },
  { phase: 'PLAN', stepNum: 4, title: 'Major Moves' },
  { phase: 'PLAN', stepNum: 5, title: 'Plan Confidence' },
  { phase: 'PLAN', stepNum: 6, title: 'Reality Check' },
  { phase: 'PLAN', stepNum: 7, title: 'Plan Refinement' },
  { phase: 'SYSTEM', stepNum: 8, title: 'Reminders & Cues' },
  { phase: 'SYSTEM', stepNum: 9, title: 'Tracking Metrics' },
  { phase: 'SYSTEM', stepNum: 10, title: 'Potential Blockers' },
  { phase: 'SYSTEM', stepNum: 11, title: 'Accountability' },
  { phase: 'SYSTEM', stepNum: 12, title: 'Next Actions' },
];

export function useGPSCoach() {
  const [currentStep, setCurrentStep] = useState(0);
  const [coachingHistory, setCoachingHistory] = useState<CoachingEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const { toast } = useToast();

  const parseSSEStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
      onDone();
    } catch (error) {
      console.error('Stream parsing error:', error);
      onDone();
    }
  };

  const startCoaching = useCallback(async () => {
    setIsStreaming(true);
    setStreamingContent('');
    setCurrentStep(0);
    setCoachingHistory([]);
    setBlueprint(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use GPS Coach",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gps-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'start', currentStep: 0, coachingHistory: [] }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start coaching');
      }

      let fullResponse = '';
      await parseSSEStream(
        response.body.getReader(),
        (text) => {
          fullResponse += text;
          setStreamingContent(fullResponse);
        },
        () => {
          setIsStreaming(false);
          setCoachingHistory([{
            stepNum: 1,
            phase: 'GOAL',
            question: fullResponse,
            answer: '',
            aiAck: '',
          }]);
        }
      );
    } catch (error) {
      console.error('Start coaching error:', error);
      setIsStreaming(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start coaching",
        variant: "destructive",
      });
    }
  }, [toast]);

  const submitResponse = useCallback(async (answer: string) => {
    if (isStreaming || !answer.trim()) return;

    setIsStreaming(true);
    setStreamingContent('');

    // Extract goal title from first answer
    if (currentStep === 0 && !goalTitle) {
      const title = answer.length > 100 ? answer.substring(0, 100) + '...' : answer;
      setGoalTitle(title);
    }

    // Update history with the user's answer
    const updatedHistory = [...coachingHistory];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1].answer = answer;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const nextStep = currentStep + 1;
      const isGeneratingBlueprint = nextStep >= 12;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gps-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: answer,
            currentStep: nextStep,
            coachingHistory: updatedHistory,
            action: isGeneratingBlueprint ? 'generate_blueprint' : 'continue',
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      let fullResponse = '';
      await parseSSEStream(
        response.body.getReader(),
        (text) => {
          fullResponse += text;
          setStreamingContent(fullResponse);
        },
        () => {
          setIsStreaming(false);

          if (isGeneratingBlueprint) {
            // Save the blueprint
            setBlueprint(fullResponse);
            updatedHistory[updatedHistory.length - 1].aiAck = 'Blueprint generated';
            setCoachingHistory(updatedHistory);
            setCurrentStep(12);
            
            // Save to database
            saveBlueprint(fullResponse, updatedHistory);
          } else {
            // Update history with AI acknowledgment and next question
            updatedHistory[updatedHistory.length - 1].aiAck = fullResponse;
            
            // Add next step placeholder
            const nextStepInfo = COACHING_STEPS[nextStep];
            updatedHistory.push({
              stepNum: nextStep + 1,
              phase: nextStepInfo?.phase || 'SYSTEM',
              question: '', // Will be part of aiAck
              answer: '',
              aiAck: '',
            });
            
            setCoachingHistory(updatedHistory);
            setCurrentStep(nextStep);
          }
        }
      );
    } catch (error) {
      console.error('Submit response error:', error);
      setIsStreaming(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit response",
        variant: "destructive",
      });
    }
  }, [currentStep, coachingHistory, goalTitle, isStreaming, toast]);

  const saveBlueprint = async (blueprintMarkdown: string, history: CoachingEntry[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('gps_blueprints')
        .insert([{
          user_id: session.user.id,
          goal_title: goalTitle || 'GPS Blueprint',
          blueprint_markdown: blueprintMarkdown,
          coaching_history: JSON.parse(JSON.stringify(history)),
          current_step: 12,
          status: 'completed',
        }])
        .select()
        .single();

      if (error) throw error;
      setBlueprintId(data.id);
      
      toast({
        title: "Blueprint saved!",
        description: "Your GPS Blueprint has been saved to your account.",
      });
    } catch (error) {
      console.error('Save blueprint error:', error);
      toast({
        title: "Warning",
        description: "Blueprint generated but could not be saved. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const resetCoaching = useCallback(() => {
    setCurrentStep(0);
    setCoachingHistory([]);
    setStreamingContent('');
    setBlueprint(null);
    setBlueprintId(null);
    setGoalTitle('');
    setIsStreaming(false);
  }, []);

  return {
    currentStep,
    coachingHistory,
    isStreaming,
    streamingContent,
    blueprint,
    blueprintId,
    goalTitle,
    startCoaching,
    submitResponse,
    resetCoaching,
    COACHING_STEPS,
  };
}
