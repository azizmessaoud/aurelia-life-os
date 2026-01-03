import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useCreateMoodLog } from "@/hooks/useMoodLogs";
import { 
  Battery, 
  Smile, 
  Flame, 
  ChevronDown, 
  ChevronUp,
  Zap,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const TRIGGERS = [
  "slept well",
  "coffee boost",
  "coffee crash",
  "good news",
  "feedback",
  "procrastinating",
  "exercise",
  "stressed",
] as const;

const LOCATIONS = [
  "home",
  "library",
  "cafe",
  "class",
  "office",
  "commute",
] as const;

function getEnergyLabel(value: number): string {
  if (value <= 2) return "Exhausted";
  if (value <= 4) return "Low";
  if (value <= 6) return "Okay";
  if (value <= 8) return "Good";
  return "Peak";
}

function getMoodLabel(value: number): string {
  if (value <= 2) return "Rough";
  if (value <= 4) return "Meh";
  if (value <= 6) return "Neutral";
  if (value <= 8) return "Good";
  return "Great";
}

function getStressLabel(value: number): string {
  if (value <= 2) return "Calm";
  if (value <= 4) return "Slight";
  if (value <= 6) return "Moderate";
  if (value <= 8) return "High";
  return "Overwhelmed";
}

export function MoodQuickLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  
  const createMoodLog = useCreateMoodLog();

  const handleSubmit = () => {
    createMoodLog.mutate({
      energy_level: energy,
      mood: mood,
      stress: stress,
      trigger: selectedTrigger || undefined,
      location: selectedLocation || undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        // Reset form
        setEnergy(5);
        setMood(5);
        setStress(5);
        setSelectedTrigger(null);
        setSelectedLocation(null);
        setNotes("");
        setIsOpen(false);
      }
    });
  };

  return (
    <Card className="gradient-border overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                Quick Check-In
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 animate-fade-in">
            {/* Energy Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Battery className="h-4 w-4 text-energy-high" />
                  Energy
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  energy <= 4 && "border-destructive text-destructive",
                  energy >= 7 && "border-success text-success"
                )}>
                  {energy}/10 • {getEnergyLabel(energy)}
                </Badge>
              </div>
              <Slider
                value={[energy]}
                onValueChange={(v) => setEnergy(v[0])}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
            </div>

            {/* Mood Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Smile className="h-4 w-4 text-chart-1" />
                  Mood
                </div>
                <Badge variant="outline" className="text-xs">
                  {mood}/10 • {getMoodLabel(mood)}
                </Badge>
              </div>
              <Slider
                value={[mood]}
                onValueChange={(v) => setMood(v[0])}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
            </div>

            {/* Stress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Flame className="h-4 w-4 text-destructive" />
                  Stress
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  stress >= 7 && "border-destructive text-destructive",
                  stress <= 3 && "border-success text-success"
                )}>
                  {stress}/10 • {getStressLabel(stress)}
                </Badge>
              </div>
              <Slider
                value={[stress]}
                onValueChange={(v) => setStress(v[0])}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
            </div>

            {/* Trigger Pills */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">What triggered this?</p>
              <div className="flex flex-wrap gap-1.5">
                {TRIGGERS.map((trigger) => (
                  <Badge
                    key={trigger}
                    variant={selectedTrigger === trigger ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs"
                    onClick={() => setSelectedTrigger(
                      selectedTrigger === trigger ? null : trigger
                    )}
                  >
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Location Pills */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOCATIONS.map((location) => (
                  <Badge
                    key={location}
                    variant={selectedLocation === location ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs"
                    onClick={() => setSelectedLocation(
                      selectedLocation === location ? null : location
                    )}
                  >
                    {location}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Quick note (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-16 text-sm"
            />

            {/* Submit */}
            <Button 
              onClick={handleSubmit} 
              className="w-full glow-primary"
              disabled={createMoodLog.isPending}
            >
              {createMoodLog.isPending ? "Logging..." : "Log Check-In"}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
