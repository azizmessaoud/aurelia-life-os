import { useState } from "react";
import { Plus, DollarSign, Zap, Clock, Brain, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncomeStreams, useCreateIncomeStream, useUpdateIncomeStream, useDeleteIncomeStream, type IncomeStream, type NewIncomeStream } from "@/hooks/useIncomeStreams";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

function IncomeStreamForm({ 
  stream, 
  onSubmit, 
  onCancel,
  isLoading 
}: { 
  stream?: IncomeStream; 
  onSubmit: (data: NewIncomeStream) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<NewIncomeStream>({
    name: stream?.name || "",
    description: stream?.description || "",
    adhd_compatibility: stream?.adhd_compatibility || "medium",
    dopamine_level: stream?.dopamine_level || "neutral",
    context_switch_minutes: stream?.context_switch_minutes || 15,
    setup_energy: stream?.setup_energy || 5,
    maintenance_energy: stream?.maintenance_energy || 5,
    realistic_monthly_eur: stream?.realistic_monthly_eur || 0,
    optimistic_monthly_eur: stream?.optimistic_monthly_eur || 0,
    has_external_deadline: stream?.has_external_deadline || false,
    body_double_possible: stream?.body_double_possible || false,
    status: stream?.status || "active",
    last_worked_at: stream?.last_worked_at || null,
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Fiverr Data Cleaning"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What's this income stream about?"
          className="mt-1"
          rows={2}
        />
      </div>

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

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium text-sm">Has External Deadline?</p>
          <p className="text-xs text-muted-foreground">Client deadlines help with ADHD</p>
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
          {stream ? "Update" : "Add"} Stream
        </Button>
      </div>
    </div>
  );
}

function StreamCard({ stream, onEdit, onDelete }: { stream: IncomeStream; onEdit: () => void; onDelete: () => void }) {
  const adhd = adhdOptions.find((o) => o.value === stream.adhd_compatibility);
  const dopamine = dopamineOptions.find((o) => o.value === stream.dopamine_level);

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md",
      stream.status === "abandoned" && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={cn("text-xs", adhd?.color)}>
            {adhd?.label}
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

        <h3 className="font-semibold mb-1">{stream.name}</h3>
        {stream.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{stream.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{stream.context_switch_minutes}m to start</span>
          </div>
          <div className={cn("flex items-center gap-1", dopamine?.color)}>
            <Brain className="h-3 w-3" />
            <span>{dopamine?.label.split(" ")[1]}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="text-lg font-bold">€{stream.realistic_monthly_eur || 0}</p>
            <p className="text-xs text-muted-foreground">realistic/mo</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">€{stream.optimistic_monthly_eur || 0}</p>
            <p className="text-xs text-muted-foreground">optimistic</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {stream.has_external_deadline && (
            <Badge variant="secondary" className="text-xs">📅 Deadline</Badge>
          )}
          {stream.body_double_possible && (
            <Badge variant="secondary" className="text-xs">👥 Body Double</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IncomePage() {
  const { data: streams = [], isLoading } = useIncomeStreams();
  const createStream = useCreateIncomeStream();
  const updateStream = useUpdateIncomeStream();
  const deleteStream = useDeleteIncomeStream();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);

  const activeStreams = streams.filter((s) => s.status === "active");
  const quickWins = activeStreams.filter((s) => 
    ["high", "hyperfocus_gold"].includes(s.adhd_compatibility) && s.context_switch_minutes < 20
  );
  const dangerZone = activeStreams.filter((s) => 
    !s.has_external_deadline && ["obsession_worthy", "interesting"].includes(s.dopamine_level) && s.context_switch_minutes > 25
  );
  const inactiveStreams = streams.filter((s) => s.status !== "active");

  const totalRealistic = activeStreams.reduce((sum, s) => sum + (s.realistic_monthly_eur || 0), 0);
  const totalOptimistic = activeStreams.reduce((sum, s) => sum + (s.optimistic_monthly_eur || 0), 0);

  const handleSubmit = async (data: NewIncomeStream) => {
    if (editingStream) {
      await updateStream.mutateAsync({ id: editingStream.id, ...data });
    } else {
      await createStream.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingStream(null);
  };

  const handleEdit = (stream: IncomeStream) => {
    setEditingStream(stream);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this income stream?")) {
      deleteStream.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-success" />
              Income Streams
            </h1>
            <p className="text-muted-foreground">
              ADHD-adjusted income opportunities
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingStream(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingStream ? "Edit" : "Add"} Income Stream</DialogTitle>
              </DialogHeader>
              <IncomeStreamForm
                stream={editingStream || undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setDialogOpen(false); setEditingStream(null); }}
                isLoading={createStream.isPending || updateStream.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Realistic Monthly</p>
              <p className="text-3xl font-bold">€{totalRealistic.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Optimistic Monthly</p>
              <p className="text-3xl font-bold">€{totalOptimistic.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Active ({activeStreams.length})</TabsTrigger>
            <TabsTrigger value="quick">Quick Wins ({quickWins.length})</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone ({dangerZone.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveStreams.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {activeStreams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No income streams yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                    Add your first income stream
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStreams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    onEdit={() => handleEdit(stream)}
                    onDelete={() => handleDelete(stream.id)}
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
              {quickWins.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  onEdit={() => handleEdit(stream)}
                  onDelete={() => handleDelete(stream.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="danger" className="mt-4">
            <Card className="mb-4 border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-medium">Danger Zone</p>
                  <p className="text-sm text-muted-foreground">High dopamine + no deadline + high context switch = procrastination trap</p>
                </div>
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dangerZone.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  onEdit={() => handleEdit(stream)}
                  onDelete={() => handleDelete(stream.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveStreams.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  onEdit={() => handleEdit(stream)}
                  onDelete={() => handleDelete(stream.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
