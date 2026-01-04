import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GraphContext } from "@/hooks/useChat";

interface HighlightedContentProps {
  content: string;
  graphContext?: GraphContext | null;
}

interface EntityInfo {
  name: string;
  type: string;
}

// Color mapping for entity types
const entityTypeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  project: { bg: "bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/40", label: "Project" },
  blocker: { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-500/40", label: "Blocker" },
  skill: { bg: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/40", label: "Skill" },
  pattern: { bg: "bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/40", label: "Pattern" },
  emotion: { bg: "bg-pink-500/20", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500/40", label: "Emotion" },
  tool: { bg: "bg-violet-500/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/40", label: "Tool" },
  person: { bg: "bg-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/40", label: "Person" },
  goal: { bg: "bg-lime-500/20", text: "text-lime-600 dark:text-lime-400", border: "border-lime-500/40", label: "Goal" },
  default: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/40", label: "Entity" },
};

// Extract entity names and types from graph context string
function extractEntities(context: string): EntityInfo[] {
  const entities: EntityInfo[] = [];
  
  // Match patterns like "Entity: Name (type)" 
  const entityPattern = /Entity:\s*([^(]+)\s*\(([^)]+)\)/gi;
  
  let match;
  while ((match = entityPattern.exec(context)) !== null) {
    entities.push({
      name: match[1].trim(),
      type: match[2].trim().toLowerCase(),
    });
  }
  
  // Also try to extract from relationship lines like "Name → RELATIONSHIP → Target"
  const lines = context.split('\n');
  for (const line of lines) {
    const relMatch = line.match(/^([^→]+)\s*→\s*([A-Z_]+)\s*→\s*([^(]+)/);
    if (relMatch) {
      const sourceName = relMatch[1].trim();
      const targetName = relMatch[3].trim();
      
      // Only add if not already present
      if (sourceName.length > 2 && !entities.some(e => e.name.toLowerCase() === sourceName.toLowerCase())) {
        entities.push({ name: sourceName, type: 'default' });
      }
      if (targetName.length > 2 && !entities.some(e => e.name.toLowerCase() === targetName.toLowerCase())) {
        entities.push({ name: targetName, type: 'default' });
      }
    }
  }
  
  return entities;
}

function getEntityColors(type: string) {
  return entityTypeColors[type] || entityTypeColors.default;
}

export function HighlightedContent({ content, graphContext }: HighlightedContentProps) {
  if (!graphContext?.context) {
    return <>{content}</>;
  }

  const entities = extractEntities(graphContext.context);
  
  if (entities.length === 0) {
    return <>{content}</>;
  }

  // Create a regex pattern to match any of the entity names (case-insensitive, word boundaries)
  const escapedNames = entities.map(e => 
    e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');
  
  // Split content by the pattern while keeping matched parts
  const parts = content.split(pattern);
  
  return (
    <TooltipProvider delayDuration={300}>
      {parts.map((part, index) => {
        // Check if this part matches any entity (case-insensitive)
        const matchedEntity = entities.find(
          e => e.name.toLowerCase() === part.toLowerCase()
        );
        
        if (matchedEntity) {
          const colors = getEntityColors(matchedEntity.type);
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <span className={`${colors.bg} ${colors.text} font-medium px-0.5 rounded cursor-help border-b ${colors.border} border-dashed`}>
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className={`h-4 px-1.5 text-[10px] ${colors.bg} ${colors.text}`}>
                    {colors.label}
                  </Badge>
                  <span className="text-muted-foreground">from Knowledge Graph</span>
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
