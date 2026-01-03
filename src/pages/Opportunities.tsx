import { useState } from "react";
import { Plus, Search, DollarSign, GraduationCap, Heart, Award, Zap, Clock, Brain, Trash2, Edit2, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpportunities, useCreateOpportunity, useUpdateOpportunity, useDeleteOpportunity, type Opportunity, type NewOpportunity, type OpportunityType } from "@/hooks/useOpportunities";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";

const opportunityTypes: { value: OpportunityType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "income", label: "Income", icon: DollarSign, color: "bg-success/20 text-success border-success/30" },
  { value: "scholarship", label: "Scholarship", icon: GraduationCap, color: "bg-primary/20 text-primary border-primary/30" },
  { value: "volunteering", label: "Volunteering", icon: Heart, color: "bg-pink-500/20 text-pink-500 border-pink-500/30" },
  { value: "certification", label: "Certification", icon: Award, color: "bg-warning/20 text-warning border-warning/30" },
];

const adhdOptions = [
  { value: "hyperfocus_gold", label: "🏆 Hyperfocus Gold", color: "bg-adhd-gold/20 text-adhd-gold border-adhd-gold/30" },
  { value: "high", label: "✨ High", color: "bg-adhd-high/20 text-adhd-high border-adhd-high/30" },
  { value: "medium", label: "👍 Medium", color: "bg-adhd-medium/20 text-adhd-medium border-adhd-medium/30" },
  { value: "low", label: "😐 Low", color: "bg-adhd-low/20 text-adhd-low border-adhd-low/30" },
  { value: "hell_no", label: "🚫 Hell No", color: "bg-adhd-hell/20 text-adhd-hell border-adhd-hell/30" },
];

const dopamineOptions = [
  { value: "obsession_worthy", label: "🔥 Obsession-Worthy", color: "bg-dopamine-obsession/20 text-dopamine-obsession" },
  { value: "interesting", label: "💡 Interesting", color: "bg-dopamine-interesting/20 text-dopamine-interesting" },
  { value: "neutral", label: "😐 Neutral", color: "bg-dopamine-neutral/20 text-dopamine-neutral" },
  { value: "low", label: "😴 Low", color: "bg-dopamine-low/20 text-dopamine-low" },
  { value: "boring_af", label: "💀 Boring AF", color: "bg-dopamine-boring/20 text-dopamine-boring" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
];

function OpportunityForm({ 
  opportunity, 
  onSubmit, 
  onCancel,
  isLoading 
}: { 
  opportunity?: Opportunity; 
  onSubmit: (data: NewOpportunity) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<NewOpportunity>({
    name: opportunity?.name || "",
    description: opportunity?.description || "",
    opportunity_type: opportunity?.opportunity_type || "income",
    adhd_compatibility: opportunity?.adhd_compatibility || "medium",
    dopamine_level: opportunity?.dopamine_level || "neutral",
    context_switch_minutes: opportunity?.context_switch_minutes || 15,
    setup_energy: opportunity?.setup_energy || 5,
    maintenance_energy: opportunity?.maintenance_energy || 5,
    realistic_monthly_eur: opportunity?.realistic_monthly_eur || 0,
    optimistic_monthly_eur: opportunity?.optimistic_monthly_eur || 0,
    has_external_deadline: opportunity?.has_external_deadline || false,
    body_double_possible: opportunity?.body_double_possible || false,
    status: opportunity?.status || "active",
    last_worked_at: opportunity?.last_worked_at || null,
    application_deadline: opportunity?.application_deadline || null,
    requirements: opportunity?.requirements || null,
    url: opportunity?.url || null,
    estimated_hours: opportunity?.estimated_hours || null,
  });

  const isIncomeType = formData.opportunity_type === "income";

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="text-sm font-medium">Opportunity Type *</label>
        <Select value={formData.opportunity_type} onValueChange={(v) => setFormData({ ...formData, opportunity_type: v as OpportunityType })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opportunityTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={isIncomeType ? "e.g., Fiverr Data Cleaning" : "e.g., Google STEP Scholarship"}
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What's this opportunity about?"
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <label className="text-sm font-medium">URL (optional)</label>
        <Input
          value={formData.url || ""}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      {!isIncomeType && (
        <>
          <div>
            <label className="text-sm font-medium">Application Deadline</label>
            <Input
              type="datetime-local"
              value={formData.application_deadline ? formData.application_deadline.slice(0, 16) : ""}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Requirements</label>
            <Textarea
              value={formData.requirements || ""}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g., No GPA requirement, Essay required"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Estimated Hours to Complete</label>
            <Input
              type="number"
              value={formData.estimated_hours || ""}
              onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || null })}
              placeholder="e.g., 10"
              className="mt-1"
              min={0}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">ADHD Compatibility</label>
          <Select value={formData.adhd_compatibility} onValueChange={(v) => setFormData({ ...formData, adhd_compatibility: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {adhdOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Dopamine Level</label>
          <Select value={formData.dopamine_level} onValueChange={(v) => setFormData({ ...formData, dopamine_level: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dopamineOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Context Switch Tax (minutes to start)</label>
        <Input
          type="number"
          value={formData.context_switch_minutes}
          onChange={(e) => setFormData({ ...formData, context_switch_minutes: parseInt(e.target.value) || 0 })}
          className="mt-1"
          min={0}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Setup Energy (1-10)</label>
          <Input
            type="number"
            value={formData.setup_energy}
            onChange={(e) => setFormData({ ...formData, setup_energy: Math.min(10, Math.max(1, parseInt(e.target.value) || 5)) })}
            className="mt-1"
            min={1}
            max={10}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Maintenance Energy (1-10)</label>
          <Input
            type="number"
            value={formData.maintenance_energy}
            onChange={(e) => setFormData({ ...formData, maintenance_energy: Math.min(10, Math.max(1, parseInt(e.target.value) || 5)) })}
            className="mt-1"
            min={1}
            max={10}
          />
        </div>
      </div>

      {isIncomeType && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Realistic €/month</label>
            <Input
              type="number"
              value={formData.realistic_monthly_eur || ""}
              onChange={(e) => setFormData({ ...formData, realistic_monthly_eur: parseFloat(e.target.value) || 0 })}
              className="mt-1"
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Optimistic €/month</label>
            <Input
              type="number"
              value={formData.optimistic_monthly_eur || ""}
              onChange={(e) => setFormData({ ...formData, optimistic_monthly_eur: parseFloat(e.target.value) || 0 })}
              className="mt-1"
              min={0}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium text-sm">Has External Deadline?</p>
          <p className="text-xs text-muted-foreground">Client/application deadlines help with ADHD</p>
        </div>
        <Switch
          checked={formData.has_external_deadline}
          onCheckedChange={(v) => setFormData({ ...formData, has_external_deadline: v })}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium text-sm">Body Double Possible?</p>
          <p className="text-xs text-muted-foreground">Can you work on this with others?</p>
        </div>
        <Switch
          checked={formData.body_double_possible}
          onCheckedChange={(v) => setFormData({ ...formData, body_double_possible: v })}
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(formData)} disabled={!formData.name || isLoading}>
          {opportunity ? "Update" : "Add"} Opportunity
        </Button>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity, onEdit, onDelete }: { opportunity: Opportunity; onEdit: () => void; onDelete: () => void }) {
  const adhd = adhdOptions.find((o) => o.value === opportunity.adhd_compatibility);
  const dopamine = dopamineOptions.find((o) => o.value === opportunity.dopamine_level);
  const oppType = opportunityTypes.find((t) => t.value === opportunity.opportunity_type);
  
  const deadlineSoon = opportunity.application_deadline && 
    isWithinInterval(new Date(opportunity.application_deadline), { start: new Date(), end: addDays(new Date(), 7) });
  const deadlinePast = opportunity.application_deadline && isPast(new Date(opportunity.application_deadline));

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md",
      opportunity.status === "abandoned" && "opacity-60",
      deadlineSoon && !deadlinePast && "ring-2 ring-warning",
      deadlinePast && "ring-2 ring-destructive"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", oppType?.color)}>
              {oppType && <oppType.icon className="h-3 w-3 mr-1" />}
              {oppType?.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", adhd?.color)}>
              {adhd?.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {opportunity.url && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold mb-1">{opportunity.name}</h3>
        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{opportunity.description}</p>
        )}

        {opportunity.application_deadline && (
          <div className={cn(
            "flex items-center gap-2 text-xs mb-3 p-2 rounded",
            deadlinePast ? "bg-destructive/10 text-destructive" : 
            deadlineSoon ? "bg-warning/10 text-warning" : "bg-muted"
          )}>
            <Calendar className="h-3 w-3" />
            <span>
              {deadlinePast ? "Deadline passed: " : "Deadline: "}
              {format(new Date(opportunity.application_deadline), "MMM d, yyyy")}
              {!deadlinePast && ` (${formatDistanceToNow(new Date(opportunity.application_deadline), { addSuffix: true })})`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{opportunity.context_switch_minutes}m to start</span>
          </div>
          <div className={cn("flex items-center gap-1", dopamine?.color)}>
            <Brain className="h-3 w-3" />
            <span>{dopamine?.label.split(" ")[1]}</span>
          </div>
        </div>

        {opportunity.opportunity_type === "income" && (
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <p className="text-lg font-bold">€{opportunity.realistic_monthly_eur || 0}</p>
              <p className="text-xs text-muted-foreground">realistic/mo</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">€{opportunity.optimistic_monthly_eur || 0}</p>
              <p className="text-xs text-muted-foreground">optimistic</p>
            </div>
          </div>
        )}

        {opportunity.estimated_hours && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>~{opportunity.estimated_hours}h to complete</span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {opportunity.has_external_deadline && (
            <Badge variant="secondary" className="text-xs">📅 Deadline</Badge>
          )}
          {opportunity.body_double_possible && (
            <Badge variant="secondary" className="text-xs">👥 Body Double</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpportunitiesPage() {
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all");
  const { data: opportunities = [], isLoading } = useOpportunities(typeFilter);
  const createOpportunity = useCreateOpportunity();
  const updateOpportunity = useUpdateOpportunity();
  const deleteOpportunity = useDeleteOpportunity();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const activeOpportunities = opportunities.filter((o) => o.status === "active");
  const quickWins = activeOpportunities.filter((o) => 
    ["high", "hyperfocus_gold"].includes(o.adhd_compatibility) && o.context_switch_minutes < 20
  );
  const upcomingDeadlines = activeOpportunities.filter((o) => 
    o.application_deadline && !isPast(new Date(o.application_deadline))
  ).sort((a, b) => new Date(a.application_deadline!).getTime() - new Date(b.application_deadline!).getTime());
  const inactiveOpportunities = opportunities.filter((o) => o.status !== "active");

  const incomeOpportunities = activeOpportunities.filter((o) => o.opportunity_type === "income");
  const totalRealistic = incomeOpportunities.reduce((sum, o) => sum + (o.realistic_monthly_eur || 0), 0);
  const totalOptimistic = incomeOpportunities.reduce((sum, o) => sum + (o.optimistic_monthly_eur || 0), 0);

  const handleSubmit = async (data: NewOpportunity) => {
    if (editingOpportunity) {
      await updateOpportunity.mutateAsync({ id: editingOpportunity.id, ...data });
    } else {
      await createOpportunity.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingOpportunity(null);
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this opportunity?")) {
      deleteOpportunity.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Search className="h-8 w-8 text-primary" />
              Opportunity Finder
            </h1>
            <p className="text-muted-foreground">
              Income, Scholarships, Volunteering & Certifications
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingOpportunity(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingOpportunity ? "Edit" : "Add"} Opportunity</DialogTitle>
              </DialogHeader>
              <OpportunityForm
                opportunity={editingOpportunity || undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setDialogOpen(false); setEditingOpportunity(null); }}
                isLoading={createOpportunity.isPending || updateOpportunity.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            All
          </Button>
          {opportunityTypes.map((t) => (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t.value)}
              className="gap-1"
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Realistic Monthly</p>
              <p className="text-2xl font-bold">€{totalRealistic.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Active Opportunities</p>
              <p className="text-2xl font-bold">{activeOpportunities.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Upcoming Deadlines</p>
              <p className="text-2xl font-bold">{upcomingDeadlines.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-adhd-gold/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Quick Wins</p>
              <p className="text-2xl font-bold">{quickWins.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Active ({activeOpportunities.length})</TabsTrigger>
            <TabsTrigger value="quick">Quick Wins ({quickWins.length})</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines ({upcomingDeadlines.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveOpportunities.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {activeOpportunities.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No opportunities yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                    Add your first opportunity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onEdit={() => handleEdit(opp)}
                    onDelete={() => handleDelete(opp.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quick" className="mt-4">
            <Card className="mb-4 border-success/30 bg-success/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Zap className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium">Quick Wins</p>
                  <p className="text-sm text-muted-foreground">High ADHD compatibility + low context switch time</p>
                </div>
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickWins.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onEdit={() => handleEdit(opp)}
                  onDelete={() => handleDelete(opp.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deadlines" className="mt-4">
            <Card className="mb-4 border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-medium">Upcoming Deadlines</p>
                  <p className="text-sm text-muted-foreground">Opportunities sorted by deadline</p>
                </div>
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingDeadlines.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onEdit={() => handleEdit(opp)}
                  onDelete={() => handleDelete(opp.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onEdit={() => handleEdit(opp)}
                  onDelete={() => handleDelete(opp.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
