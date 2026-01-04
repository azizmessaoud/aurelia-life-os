import { AppLayout } from "@/components/layout/AppLayout";
import { AgentCouncilView } from "@/components/council/AgentCouncilView";
import { useActiveProjects } from "@/hooks/useProjects";
import { useActiveOpportunities } from "@/hooks/useOpportunities";
import { useCurrentWeekCapacity } from "@/hooks/useWeeklyCapacity";
import { useTodaysDeepWorkMinutes, useDeepWorkSessions } from "@/hooks/useDeepWork";
import { useRecentMoodLogs } from "@/hooks/useMoodLogs";

export default function CouncilPage() {
  const { data: projects = [] } = useActiveProjects();
  const { data: incomeStreams = [] } = useActiveOpportunities("income");
  const { data: weeklyCapacity } = useCurrentWeekCapacity();
  const { data: todayMinutes = 0 } = useTodaysDeepWorkMinutes();
  const { data: recentSessions = [] } = useDeepWorkSessions();
  const { data: moodLogs = [] } = useRecentMoodLogs(7);

  // Get most recent mood/energy
  const latestMood = moodLogs[0];

  const context = {
    projects,
    incomeStreams,
    weeklyCapacity,
    todayMinutes,
    recentSessions: recentSessions.slice(0, 10),
    recentMood: latestMood?.mood,
    recentEnergy: latestMood?.energy_level,
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <AgentCouncilView context={context} />
      </div>
    </AppLayout>
  );
}
