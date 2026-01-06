import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, RotateCcw, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlueprintDisplayProps {
  blueprint: string;
  goalTitle: string;
  onReset: () => void;
}

export function BlueprintDisplay({ blueprint, goalTitle, onReset }: BlueprintDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(blueprint);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Blueprint copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually",
        variant: "destructive",
      });
    }
  };

  const downloadBlueprint = () => {
    const blob = new Blob([blueprint], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GPS-Blueprint-${goalTitle.replace(/[^a-z0-9]/gi, '-').slice(0, 50)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Blueprint saved as Markdown file",
    });
  };

  // Simple markdown rendering
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, i) => {
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-foreground">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold mt-5 mb-3 text-foreground border-b border-border pb-2">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium mt-4 mb-2 text-foreground">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 text-muted-foreground list-disc">
            {line.slice(2)}
          </li>
        );
      } else if (line.match(/^\d+\./)) {
        elements.push(
          <li key={i} className="ml-4 text-muted-foreground list-decimal">
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        );
      } else if (line.startsWith('*') && line.endsWith('*')) {
        elements.push(
          <p key={i} className="text-sm text-muted-foreground italic mt-4">
            {line.slice(1, -1)}
          </p>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} className="my-4 border-border" />);
      } else if (line.trim()) {
        elements.push(
          <p key={i} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      } else {
        elements.push(<div key={i} className="h-2" />);
      }
    });

    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Success header */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">GPS Blueprint Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Your goal achievement roadmap is ready. Save it and take action!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={copyToClipboard} variant="outline" className="flex-1">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button onClick={downloadBlueprint} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={onReset} variant="ghost">
          <RotateCcw className="h-4 w-4 mr-2" />
          New Blueprint
        </Button>
      </div>

      {/* Blueprint content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Blueprint</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderMarkdown(blueprint)}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
