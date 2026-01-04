import { AppSidebar } from "@/components/layout/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyScheduleGrid } from "@/components/academic/WeeklyScheduleGrid";
import { AssignmentList } from "@/components/academic/AssignmentList";
import { CourseList } from "@/components/academic/CourseList";
import { MaterialsList } from "@/components/academic/MaterialsList";
import { BlackboardSyncButton } from "@/components/academic/BlackboardSyncButton";
import { useUpcomingAssignments, useTodaySchedule } from "@/hooks/useAcademic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen, 
  GraduationCap,
  AlertTriangle
} from "lucide-react";

function QuickStats() {
  const { data: upcoming } = useUpcomingAssignments(7);
  const { data: todayClasses } = useTodaySchedule();
  
  const urgentDeadlines = upcoming?.filter(a => {
    const daysUntil = Math.ceil((new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3;
  }) || [];

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {/* Today's Classes */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes today</p>
          ) : (
            <div className="space-y-2">
              {todayClasses?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.course?.color }}
                    />
                    <span className="font-medium">{item.course?.course_code}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            Upcoming Deadlines
            {urgentDeadlines.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentDeadlines.length} urgent
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {upcoming?.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{assignment.title}</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assignments due</span>
              <span className="font-medium">{upcoming?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Classes today</span>
              <span className="font-medium">{todayClasses?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exams this week</span>
              <span className="font-medium">
                {upcoming?.filter(a => a.is_exam).length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcademicHub() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 ml-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                <GraduationCap className="h-8 w-8" />
                Academic Hub
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your courses, schedule, and assignments
              </p>
            </div>
            <BlackboardSyncButton />
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Main Content Tabs */}
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="materials" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Materials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-4">
              <WeeklyScheduleGrid />
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <AssignmentList />
            </TabsContent>

            <TabsContent value="courses" className="mt-4">
              <CourseList />
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <MaterialsList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
