import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useBlackboardSync, useBlackboardSyncLogs } from "@/hooks/useAcademic";
import { formatDistanceToNow } from "date-fns";
import { Cloud, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

export function BlackboardSyncButton() {
  const [open, setOpen] = useState(false);
  const [blackboardUrl, setBlackboardUrl] = useState("");
  const [syncType, setSyncType] = useState<"full" | "schedule" | "assignments" | "materials">("full");
  
  const { mutate: sync, isPending } = useBlackboardSync();
  const { data: syncLogs } = useBlackboardSyncLogs();
  
  const lastSync = syncLogs?.[0];
  
  const handleSync = () => {
    if (!blackboardUrl) return;
    
    sync(
      { blackboardUrl, syncType },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Cloud className="h-4 w-4" />
          Sync from Blackboard
          {lastSync && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {formatDistanceToNow(new Date(lastSync.completed_at || lastSync.started_at), { addSuffix: true })}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sync from Blackboard
          </DialogTitle>
          <DialogDescription>
            Enter your Blackboard URL to sync courses, schedule, assignments, and materials.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="blackboard-url">Blackboard URL</Label>
            <Input
              id="blackboard-url"
              placeholder="https://esprit.blackboard.com/webapps/portal/execute/tabs/tabAction?tab_tab_group_id=_1_1"
              value={blackboardUrl}
              onChange={(e) => setBlackboardUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste the URL of your Blackboard course list page
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sync-type">Sync Type</Label>
            <Select value={syncType} onValueChange={(v) => setSyncType(v as typeof syncType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Sync (All data)</SelectItem>
                <SelectItem value="schedule">Schedule Only</SelectItem>
                <SelectItem value="assignments">Assignments Only</SelectItem>
                <SelectItem value="materials">Materials Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {syncLogs && syncLogs.length > 0 && (
            <div className="space-y-2">
              <Label>Recent Syncs</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {syncLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="capitalize">{log.sync_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {log.items_synced > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {log.items_synced} items
                        </Badge>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={isPending || !blackboardUrl}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
