import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ShieldX, ArrowRight, AlertTriangle } from "lucide-react";
import type { VetoResult } from "@/hooks/useAgentCouncil";

interface VetoAlertProps {
  veto: VetoResult;
  onOverride?: () => void;
  isOverriding?: boolean;
}

export function VetoAlert({ veto, onOverride, isOverriding }: VetoAlertProps) {
  const isCritical = veto.severity === "critical";
  
  return (
    <div className="space-y-4">
      <Alert 
        variant={isCritical ? "destructive" : "default"} 
        className={isCritical 
          ? "border-2 border-destructive bg-destructive/10" 
          : "border-2 border-amber-500 bg-amber-500/10"
        }
      >
        <div className="flex items-start gap-3">
          {isCritical ? (
            <ShieldX className="h-6 w-6 text-destructive mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className="text-lg font-bold mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              VETO: {veto.reason.replace(/_/g, " ")}
            </AlertTitle>
            <AlertDescription className="text-base">
              {veto.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Recovery Actions
          </p>
          <ul className="space-y-2">
            {veto.recoveryActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {veto.allowOverride && onOverride && (
        <div className="flex justify-center pt-2">
          <Button 
            variant="outline" 
            onClick={onOverride}
            disabled={isOverriding}
            className="text-muted-foreground hover:text-foreground"
          >
            {isOverriding ? "Processing..." : "I understand the risks, proceed anyway"}
          </Button>
        </div>
      )}

      {!veto.allowOverride && (
        <p className="text-center text-sm text-muted-foreground">
          This is a critical intervention that cannot be overridden. Please follow the recovery actions above.
        </p>
      )}
    </div>
  );
}
