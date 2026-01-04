import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useAcademicCourses, 
  useAcademicAssignments, 
  useAcademicSchedule,
  AcademicCourse 
} from "@/hooks/useAcademic";
import { BookOpen, Calendar, ExternalLink, FileText, GraduationCap } from "lucide-react";
import { useMemo } from "react";

interface CourseCardProps {
  course: AcademicCourse;
  assignmentCount: number;
  scheduleCount: number;
  avgGrade?: number;
}

function CourseCard({ course, assignmentCount, scheduleCount, avgGrade }: CourseCardProps) {
  return (
    <Card 
      className="glass-card hover:shadow-lg transition-all cursor-pointer group"
      style={{ borderLeftColor: course.color, borderLeftWidth: 4 }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {course.course_code}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.course_name}
            </p>
          </div>
          {course.blackboard_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={course.blackboard_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        
        {course.instructor && (
          <p className="text-xs text-muted-foreground mb-3">
            {course.instructor}
          </p>
        )}
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>{assignmentCount} assignments</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{scheduleCount} classes/week</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            {course.credits} credits
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {course.semester}
          </Badge>
          {avgGrade !== undefined && (
            <Badge 
              className="text-xs ml-auto"
              variant={avgGrade >= 80 ? "default" : avgGrade >= 60 ? "secondary" : "destructive"}
            >
              Avg: {avgGrade.toFixed(0)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseList() {
  const { data: courses, isLoading: loadingCourses } = useAcademicCourses();
  const { data: assignments } = useAcademicAssignments();
  const { data: schedule } = useAcademicSchedule();

  const courseStats = useMemo(() => {
    const stats: Record<string, { assignments: number; schedule: number; avgGrade?: number }> = {};
    
    if (courses) {
      for (const course of courses) {
        const courseAssignments = assignments?.filter(a => a.course_id === course.id) || [];
        const courseSchedule = schedule?.filter(s => s.course_id === course.id) || [];
        const gradedAssignments = courseAssignments.filter(a => a.grade !== null);
        
        let avgGrade: number | undefined;
        if (gradedAssignments.length > 0) {
          avgGrade = gradedAssignments.reduce((sum, a) => sum + ((a.grade || 0) / a.max_grade) * 100, 0) / gradedAssignments.length;
        }
        
        stats[course.id] = {
          assignments: courseAssignments.length,
          schedule: courseSchedule.length,
          avgGrade,
        };
      }
    }
    
    return stats;
  }, [courses, assignments, schedule]);

  if (loadingCourses) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Courses
          </span>
          <Badge variant="outline">{courses?.length || 0} enrolled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courses?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No courses yet</p>
            <p className="text-sm">Sync from Blackboard to import your courses</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses?.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                assignmentCount={courseStats[course.id]?.assignments || 0}
                scheduleCount={courseStats[course.id]?.schedule || 0}
                avgGrade={courseStats[course.id]?.avgGrade}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
