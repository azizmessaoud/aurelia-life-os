import { useState } from "react";
import { Plus, Calendar, Trash2, Edit2, Check, X, FolderKanban, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, type Project, type NewProject } from "@/hooks/useProjects";
import { useGoals, GOAL_AREAS } from "@/hooks/useGoals";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const domainOptions = [
  { value: "exam", label: "📚 Exam", color: "bg-chart-5/10 text-chart-5 border-chart-5/30" },
  { value: "freelance", label: "💼 Freelance", color: "bg-chart-3/10 text-chart-3 border-chart-3/30" },
  { value: "learning", label: "🎓 Learning", color: "bg-chart-1/10 text-chart-1 border-chart-1/30" },
  { value: "health", label: "💪 Health", color: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
  { value: "startup", label: "🚀 Startup", color: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  { value: "personal", label: "🏠 Personal", color: "bg-muted text-muted-foreground border-border" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

function ProjectForm({ 
  project, 
  onSubmit, 
  onCancel,
  isLoading 
}: { 
  project?: Project; 
  onSubmit: (data: NewProject) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { data: goals = [] } = useGoals();
  
  const [formData, setFormData] = useState<NewProject>({
    title: project?.title || "",
    description: project?.description || "",
    domain: project?.domain || "freelance",
    deadline: project?.deadline || null,
    priority: project?.priority || 3,
    status: project?.status || "active",
    progress: project?.progress || 0,
    goal_id: project?.goal_id || null,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Project title"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What's this project about?"
          className="mt-1"
          rows={3}
        />
      </div>

      {/* Link to Goal */}
      <div>
        <label className="text-sm font-medium flex items-center gap-2">
          <Target className="h-3.5 w-3.5" />
          Link to Goal
        </label>
        <Select 
          value={formData.goal_id || "none"} 
          onValueChange={(v) => setFormData({ ...formData, goal_id: v === "none" ? null : v })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a goal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No goal linked</SelectItem>
            {goals.map((goal) => {
              const area = GOAL_AREAS.find(a => a.value === goal.area);
              return (
                <SelectItem key={goal.id} value={goal.id}>
                  {area?.emoji} {goal.title}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Domain</label>
          <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {domainOptions.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Priority (1-5)</label>
          <Select value={String(formData.priority)} onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {"⭐".repeat(p)} {p === 5 ? "Critical" : p === 4 ? "High" : p === 3 ? "Medium" : p === 2 ? "Low" : "Minimal"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Deadline</label>
          <Input
            type="datetime-local"
            value={formData.deadline ? format(new Date(formData.deadline), "yyyy-MM-dd'T'HH:mm") : ""}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Progress: {formData.progress}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={formData.progress}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          className="w-full mt-2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(formData)} disabled={!formData.title || isLoading}>
          {project ? "Update" : "Create"} Project
        </Button>
      </div>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const domain = domainOptions.find((d) => d.value === project.domain);
  const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md",
      project.status === "completed" && "opacity-60",
      isUrgent && "border-warning/50",
      isOverdue && "border-destructive/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={cn("text-xs", domain?.color)}>
            {domain?.label || project.domain}
          </Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold mb-1 line-clamp-1">{project.title}</h3>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {"⭐".repeat(project.priority)}
          </div>
          {project.deadline && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : isUrgent ? "text-warning" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              {isOverdue ? `${Math.abs(daysLeft!)} days overdue` : daysLeft === 0 ? "Due today" : `${daysLeft} days`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const activeProjects = projects.filter((p) => p.status === "active");
  const otherProjects = projects.filter((p) => p.status !== "active");

  const handleSubmit = async (data: NewProject) => {
    if (editingProject) {
      await updateProject.mutateAsync({ id: editingProject.id, ...data });
    } else {
      await createProject.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this project?")) {
      deleteProject.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-primary" />
              Projects
            </h1>
            <p className="text-muted-foreground">
              {activeProjects.length} active • WIP limit: 3
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProject(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit" : "New"} Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                project={editingProject || undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setDialogOpen(false); setEditingProject(null); }}
                isLoading={createProject.isPending || updateProject.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {activeProjects.length > 3 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium">WIP Limit Exceeded</p>
                <p className="text-sm text-muted-foreground">You have {activeProjects.length} active projects. Consider pausing some to improve focus.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Projects */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
          {activeProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active projects yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                  Create your first project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => handleEdit(project)}
                  onDelete={() => handleDelete(project.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Paused / Completed / Archived</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => handleEdit(project)}
                  onDelete={() => handleDelete(project.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
