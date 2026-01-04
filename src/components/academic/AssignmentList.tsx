import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcademicAssignments, useUpdateAssignmentStatus, AcademicAssignment } from "@/hooks/useAcademic";
import { AlertTriangle, CheckCircle, Clock, FileText, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignmentItemProps {
  assignment: AcademicAssignment;
  onStatusChange: (id: string, status: string) => void;
}

function AssignmentItem({ assignment, onStatusChange }: AssignmentItemProps) {
  const dueDate = new Date(assignment.due_date);
  const isOverdue = isPast(dueDate) && assignment.status === "pending";
  const isDueToday = isToday(dueDate);
  const isDueTomorrow = isTomorrow(dueDate);
  
  const getUrgencyBadge = () => {
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    if (isDueToday) return <Badge className="bg-orange-500">Due Today</Badge>;
    if (isDueTomorrow) return <Badge className="bg-amber-500">Tomorrow</Badge>;
    return null;
  };

  const getStatusIcon = () => {
    if (assignment.status === "graded") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (assignment.status === "submitted") return <Clock className="h-4 w-4 text-blue-500" />;
    return null;
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-accent/50",
        isOverdue && "border-destructive/50 bg-destructive/5",
        assignment.status === "graded" && "opacity-75"
      )}
    >
      <Checkbox
        checked={assignment.status !== "pending"}
        onCheckedChange={(checked) => {
          onStatusChange(assignment.id, checked ? "submitted" : "pending");
        }}
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {assignment.is_exam ? (
            <GraduationCap className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium truncate">{assignment.title}</span>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: assignment.course?.color, color: assignment.course?.color }}
          >
            {assignment.course?.course_code}
          </Badge>
          <span>•</span>
          <span className={cn(isOverdue && "text-destructive")}>
            {format(dueDate, "MMM d, h:mm a")}
          </span>
          {assignment.weight > 0 && (
            <>
              <span>•</span>
              <span>{assignment.weight}%</span>
            </>
          )}
        </div>
        
        {assignment.grade !== null && (
          <div className="mt-1 text-sm">
            <Badge variant="secondary">
              Grade: {assignment.grade}/{assignment.max_grade}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-end gap-1">
        {getUrgencyBadge()}
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(dueDate, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

export function AssignmentList() {
  const { data: assignments, isLoading } = useAcademicAssignments();
  const updateStatus = useUpdateAssignmentStatus();

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const pending = assignments?.filter((a) => a.status === "pending") || [];
  const submitted = assignments?.filter((a) => a.status === "submitted") || [];
  const graded = assignments?.filter((a) => a.status === "graded") || [];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          Assignments
          <div className="flex gap-2">
            <Badge variant="outline">{pending.length} pending</Badge>
            <Badge variant="secondary">{graded.length} graded</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
        {assignments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No assignments yet</p>
            <p className="text-sm">Sync from Blackboard to import assignments</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pending ({pending.length})
                </h4>
                {pending.map((assignment) => (
                  <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
            
            {submitted.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Submitted ({submitted.length})
                </h4>
                {submitted.map((assignment) => (
                  <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
            
            {graded.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Graded ({graded.length})
                </h4>
                {graded.slice(0, 5).map((assignment) => (
                  <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {graded.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    Show {graded.length - 5} more
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
