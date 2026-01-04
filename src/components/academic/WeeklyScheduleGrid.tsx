import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAcademicSchedule, AcademicSchedule } from "@/hooks/useAcademic";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}${suffix}`;
}

interface ScheduleBlockProps {
  item: AcademicSchedule;
  top: number;
  height: number;
}

function ScheduleBlock({ item, top, height }: ScheduleBlockProps) {
  const courseColor = item.course?.color || "#6366f1";
  
  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-xs overflow-hidden transition-all hover:z-10 hover:shadow-lg cursor-pointer"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        backgroundColor: courseColor,
        color: "white",
        minHeight: "24px",
      }}
    >
      <div className="font-semibold truncate">{item.course?.course_code}</div>
      {height > 8 && (
        <>
          <div className="truncate opacity-90">{item.location}</div>
          <div className="truncate opacity-75 text-[10px]">
            {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
          </div>
        </>
      )}
    </div>
  );
}

export function WeeklyScheduleGrid() {
  const { data: schedule, isLoading } = useAcademicSchedule();
  
  const scheduleByDay = useMemo(() => {
    if (!schedule) return {};
    
    const grouped: Record<number, AcademicSchedule[]> = {};
    for (const item of schedule) {
      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = [];
      }
      grouped[item.day_of_week].push(item);
    }
    return grouped;
  }, [schedule]);

  const today = new Date().getDay();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          Weekly Schedule
          <Badge variant="outline" className="text-xs">
            {schedule?.length || 0} classes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="bg-muted p-2 text-xs font-medium text-muted-foreground" />
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`bg-muted p-2 text-center text-xs font-medium ${
                i === today ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}

          {/* Time slots */}
          {HOURS.map((hour) => (
            <>
              <div
                key={`time-${hour}`}
                className="bg-background p-1 text-[10px] text-muted-foreground text-right pr-2 border-t border-border/50"
              >
                {formatHour(hour)}
              </div>
              {DAYS.map((_, dayIndex) => (
                <div
                  key={`${hour}-${dayIndex}`}
                  className={`bg-background border-t border-border/50 h-12 relative ${
                    dayIndex === today ? "bg-primary/5" : ""
                  }`}
                >
                  {hour === HOURS[0] &&
                    scheduleByDay[dayIndex]?.map((item) => {
                      const startHour = parseTime(item.start_time);
                      const endHour = parseTime(item.end_time);
                      const dayStartHour = HOURS[0];
                      const dayEndHour = HOURS[HOURS.length - 1] + 1;
                      const totalHours = dayEndHour - dayStartHour;
                      
                      const top = ((startHour - dayStartHour) / totalHours) * 100;
                      const height = ((endHour - startHour) / totalHours) * 100;
                      
                      return (
                        <ScheduleBlock
                          key={item.id}
                          item={item}
                          top={top}
                          height={height}
                        />
                      );
                    })}
                </div>
              ))}
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
