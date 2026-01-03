import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  useCreateEntity, 
  useCreateRelationship,
  useKnowledgeEntities,
  EntityType,
  RelationshipType,
  ENTITY_COLORS 
} from "@/hooks/useKnowledgeGraph";
import { Plus, Link2 } from "lucide-react";

const ENTITY_TYPES: EntityType[] = [
  'project', 'blocker', 'emotion', 'pattern', 'win', 'skill', 'person', 'tool', 'habit'
];

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'BLOCKS', label: 'Blocks' },
  { value: 'ENABLES', label: 'Enables' },
  { value: 'REQUIRES', label: 'Requires' },
  { value: 'TRIGGERS', label: 'Triggers' },
  { value: 'LEADS_TO', label: 'Leads to' },
  { value: 'RELATED_TO', label: 'Related to' },
  { value: 'PART_OF', label: 'Part of' },
  { value: 'USES', label: 'Uses' },
  { value: 'IMPROVES', label: 'Improves' },
  { value: 'CONFLICTS_WITH', label: 'Conflicts with' },
];

export function AddEntityDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("project");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState(5);
  
  const createEntity = useCreateEntity();

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    createEntity.mutate({
      name: name.trim(),
      entity_type: type,
      description: description.trim() || undefined,
      importance,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setImportance(5);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Entity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Knowledge Entity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Entity Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {ENTITY_TYPES.map((t) => (
                <Badge
                  key={t}
                  variant={type === t ? "default" : "outline"}
                  className="cursor-pointer capitalize transition-colors"
                  style={type === t ? { 
                    backgroundColor: ENTITY_COLORS[t],
                    borderColor: ENTITY_COLORS[t]
                  } : {
                    borderColor: ENTITY_COLORS[t],
                    color: ENTITY_COLORS[t]
                  }}
                  onClick={() => setType(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AWS Certification, Procrastination, Focus Mode"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="resize-none h-20"
            />
          </div>

          {/* Importance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Importance</Label>
              <span className="text-sm text-muted-foreground">{importance}/10</span>
            </div>
            <Slider
              value={[importance]}
              onValueChange={(v) => setImportance(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name.trim() || createEntity.isPending}
          >
            {createEntity.isPending ? "Adding..." : "Add Entity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddConnectionDialog() {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState<RelationshipType>("RELATED_TO");
  const [strength, setStrength] = useState(5);
  const [notes, setNotes] = useState("");
  
  const { data: entities = [] } = useKnowledgeEntities();
  const createRelationship = useCreateRelationship();

  const handleSubmit = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    
    createRelationship.mutate({
      source_id: sourceId,
      target_id: targetId,
      relationship_type: relationType,
      strength,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setSourceId("");
        setTargetId("");
        setStrength(5);
        setNotes("");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Entities</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Source Entity */}
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ENTITY_COLORS[e.entity_type] }}
                      />
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={relationType} onValueChange={(v) => setRelationType(v as RelationshipType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Entity */}
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.filter(e => e.id !== sourceId).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ENTITY_COLORS[e.entity_type] }}
                      />
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strength */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Connection Strength</Label>
              <span className="text-sm text-muted-foreground">{strength}/10</span>
            </div>
            <Slider
              value={[strength]}
              onValueChange={(v) => setStrength(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are these connected?"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!sourceId || !targetId || sourceId === targetId || createRelationship.isPending}
          >
            {createRelationship.isPending ? "Connecting..." : "Create Connection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
