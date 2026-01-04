import { AppLayout } from "@/components/layout/AppLayout";
import { KnowledgeGraphView } from "@/components/knowledge/KnowledgeGraphView";
import { AddEntityDialog, AddConnectionDialog } from "@/components/knowledge/AddEntityDialog";
import { useKnowledgeEntities, ENTITY_COLORS, EntityType } from "@/hooks/useKnowledgeGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Brain, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function KnowledgeGraph() {
  const [searchParams] = useSearchParams();
  const focusEntityName = searchParams.get('entity');
  const { data: entities = [] } = useKnowledgeEntities();

  // Count entities by type
  const typeCounts = entities.reduce((acc, e) => {
    acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
    return acc;
  }, {} as Record<EntityType, number>);

  // Top entities by frequency
  const topEntities = [...entities]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
              <Network className="h-8 w-8" />
              Knowledge Graph
            </h1>
            <p className="text-muted-foreground">
              Your personal mind map — connect ideas, patterns, and blockers
            </p>
          </div>
          <div className="flex gap-2">
            <AddConnectionDialog />
            <AddEntityDialog />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{entities.length}</p>
                  <p className="text-sm text-muted-foreground">Total Entities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type breakdown */}
          {Object.entries(typeCounts).slice(0, 3).map(([type, count]) => (
            <Card key={type} className="gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${ENTITY_COLORS[type as EntityType]}20` }}
                  >
                    <span 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: ENTITY_COLORS[type as EntityType] }}
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Graph View */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Mind Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeGraphView focusEntityName={focusEntityName} />
          </CardContent>
        </Card>

        {/* Most Referenced Entities */}
        {topEntities.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Referenced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topEntities.map((entity) => (
                  <Badge
                    key={entity.id}
                    variant="outline"
                    className="py-1.5 px-3"
                    style={{ 
                      borderColor: ENTITY_COLORS[entity.entity_type],
                      color: ENTITY_COLORS[entity.entity_type]
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: ENTITY_COLORS[entity.entity_type] }}
                    />
                    {entity.name}
                    <span className="ml-2 text-muted-foreground">
                      ×{entity.frequency}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
