import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GraphContext } from "@/hooks/useChat";

interface HighlightedContentProps {
  content: string;
  graphContext?: GraphContext | null;
}

// Extract entity names from graph context string
function extractEntityNames(context: string): string[] {
  const entities: string[] = [];
  
  // Match patterns like "Entity: Name (type)" or entity names in relationships
  const entityPattern = /Entity:\s*([^(]+)\s*\(/gi;
  const relationPattern = /([^→\n]+)\s*→/g;
  const targetPattern = /→\s*([^\n(]+)/g;
  
  let match;
  while ((match = entityPattern.exec(context)) !== null) {
    entities.push(match[1].trim());
  }
  while ((match = relationPattern.exec(context)) !== null) {
    const name = match[1].trim();
    if (name && !name.includes(':') && name.length > 2) {
      entities.push(name);
    }
  }
  while ((match = targetPattern.exec(context)) !== null) {
    const name = match[1].trim();
    if (name && !name.includes(':') && name.length > 2) {
      entities.push(name);
    }
  }
  
  // Deduplicate and filter out common words
  const uniqueEntities = [...new Set(entities)].filter(e => e.length > 2);
  return uniqueEntities;
}

export function HighlightedContent({ content, graphContext }: HighlightedContentProps) {
  if (!graphContext?.context) {
    return <>{content}</>;
  }

  const entityNames = extractEntityNames(graphContext.context);
  
  if (entityNames.length === 0) {
    return <>{content}</>;
  }

  // Create a regex pattern to match any of the entity names (case-insensitive, word boundaries)
  const escapedNames = entityNames.map(name => 
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');
  
  // Split content by the pattern while keeping matched parts
  const parts = content.split(pattern);
  
  return (
    <TooltipProvider delayDuration={300}>
      {parts.map((part, index) => {
        // Check if this part matches any entity (case-insensitive)
        const isEntity = entityNames.some(
          name => name.toLowerCase() === part.toLowerCase()
        );
        
        if (isEntity) {
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <span className="bg-primary/20 text-primary font-medium px-0.5 rounded cursor-help border-b border-primary/40 border-dashed">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    Knowledge Graph
                  </Badge>
                  <span>Entity from context</span>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </TooltipProvider>
  );
}
