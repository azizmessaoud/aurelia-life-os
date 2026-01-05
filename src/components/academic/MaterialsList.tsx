import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAcademicMaterials, useAcademicCourses, AcademicMaterial } from "@/hooks/useAcademic";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  ChevronDown, 
  ExternalLink, 
  FileText, 
  Film, 
  Presentation, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  lecture: <Presentation className="h-4 w-4" />,
  slides: <Presentation className="h-4 w-4" />,
  reading: <BookOpen className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
};

interface MaterialItemProps {
  material: AcademicMaterial;
}

function MaterialItem({ material }: MaterialItemProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      if (material.file_url) {
        // Check if it's already an external URL (not a storage path)
        if (material.file_url.startsWith('http://') || material.file_url.startsWith('https://')) {
          setSignedUrl(material.file_url);
          return;
        }
        
        // Get signed URL for storage files
        const { data } = await supabase.storage
          .from('academic-materials')
          .createSignedUrl(material.file_url, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      }
    }
    getSignedUrl();
  }, [material.file_url]);
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-all">
      <div className="mt-0.5 text-muted-foreground">
        {MATERIAL_ICONS[material.material_type] || <FileText className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{material.title}</span>
          {signedUrl && (
            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {material.material_type}
          </Badge>
          {material.week_number && (
            <span>Week {material.week_number}</span>
          )}
          {material.is_processed && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              AI Summary
            </Badge>
          )}
        </div>
        
        {material.ai_summary && (
          <Collapsible open={showSummary} onOpenChange={setShowSummary}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 mt-1 text-xs">
                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", showSummary && "rotate-180")} />
                {showSummary ? "Hide" : "Show"} Summary
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                {material.ai_summary}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export function MaterialsList() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const { data: courses } = useAcademicCourses();
  const { data: materials, isLoading } = useAcademicMaterials(
    selectedCourse !== "all" ? selectedCourse : undefined
  );

  const materialsByWeek = useMemo(() => {
    if (!materials) return {} as Record<string, AcademicMaterial[]>;
    
    const grouped: Record<string, AcademicMaterial[]> = {};
    for (const material of materials) {
      const week = material.week_number !== null ? String(material.week_number) : "unassigned";
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(material);
    }
    return grouped;
  }, [materials]);

  const weeks = Object.keys(materialsByWeek)
    .sort((a, b) => {
      if (a === "unassigned") return 1;
      if (b === "unassigned") return -1;
      return parseInt(a) - parseInt(b);
    });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Course Materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Materials
          </CardTitle>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses?.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.course_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {materials?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No materials yet</p>
            <p className="text-sm">Sync from Blackboard to import course materials</p>
          </div>
        ) : (
          weeks.map((weekKey) => (
            <Collapsible key={weekKey} defaultOpen={weekKey !== "unassigned"}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-auto py-2">
                  <span className="font-medium">
                    {weekKey === "unassigned" ? "Other Materials" : `Week ${weekKey}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {materialsByWeek[weekKey]?.length || 0} items
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {materialsByWeek[weekKey]?.map((material) => (
                  <MaterialItem key={material.id} material={material} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}
