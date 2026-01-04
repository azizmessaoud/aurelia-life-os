import { useMemo, useState, useRef, useEffect } from "react";
import { 
  useKnowledgeGraph, 
  ENTITY_COLORS, 
  RELATIONSHIP_LABELS,
  KnowledgeEntity,
  EntityType,
} from "@/hooks/useKnowledgeGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  User, 
  Wrench, 
  Brain,
  Trophy,
  Heart,
  Repeat,
  Eye,
  Focus,
  type LucideIcon 
} from "lucide-react";

// Backbone view thresholds
const BACKBONE_IMPORTANCE_THRESHOLD = 7;
const BACKBONE_STRENGTH_THRESHOLD = 6;

// Icon mapping for entity types
const ENTITY_ICONS: Record<EntityType, LucideIcon> = {
  pattern: Lightbulb,
  project: Target,
  blocker: AlertTriangle,
  person: User,
  tool: Wrench,
  skill: Brain,
  win: Trophy,
  emotion: Heart,
  habit: Repeat,
};

// Color mapping for relationship types
const RELATIONSHIP_COLORS: Record<string, string> = {
  BLOCKS: '#EF4444',        // Red - negative/blocking
  CONFLICTS_WITH: '#F97316', // Orange - conflict
  TRIGGERS: '#F59E0B',       // Amber - causal trigger
  REQUIRES: '#8B5CF6',       // Purple - dependency
  LEADS_TO: '#06B6D4',       // Cyan - consequence
  ENABLES: '#10B981',        // Green - positive/enabling
  IMPROVES: '#22C55E',       // Light green - enhancement
  USES: '#3B82F6',           // Blue - utilization
  PART_OF: '#6366F1',        // Indigo - composition
  RELATED_TO: '#94A3B8',     // Slate - generic relation
};

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface KnowledgeGraphViewProps {
  className?: string;
  focusEntityName?: string | null;
}

export function KnowledgeGraphView({ className, focusEntityName }: KnowledgeGraphViewProps) {
  const { entities, relationships, isLoading } = useKnowledgeGraph();
  const [selectedNode, setSelectedNode] = useState<KnowledgeEntity | null>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'backbone'>('full');
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();

  // Determine which nodes are "backbone" (high importance)
  const backboneNodeIds = useMemo(() => {
    return new Set(
      entities
        .filter(e => (e.importance || 5) >= BACKBONE_IMPORTANCE_THRESHOLD)
        .map(e => e.id)
    );
  }, [entities]);

  // Auto-select entity when focusEntityName is provided
  useEffect(() => {
    if (focusEntityName && entities.length > 0) {
      const matchedEntity = entities.find(
        e => e.name.toLowerCase() === focusEntityName.toLowerCase()
      );
      if (matchedEntity) {
        setSelectedNode(matchedEntity);
      }
    }
  }, [focusEntityName, entities]);

  // Filter relationships for backbone view
  const filteredRelationships = useMemo(() => {
    if (viewMode === 'full') return relationships;
    return relationships.filter(r => 
      (r.strength || 5) >= BACKBONE_STRENGTH_THRESHOLD &&
      backboneNodeIds.has(r.source_id) &&
      backboneNodeIds.has(r.target_id)
    );
  }, [relationships, viewMode, backboneNodeIds]);

  // Initialize positions
  useEffect(() => {
    if (entities.length === 0) return;

    const centerX = 400;
    const centerY = 250;
    const radius = 180;

    const newPositions: Record<string, NodePosition> = {};
    entities.forEach((entity, i) => {
      const angle = (2 * Math.PI * i) / entities.length;
      newPositions[entity.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });
    setPositions(newPositions);
  }, [entities.length]);

  // Simple force simulation
  useEffect(() => {
    if (entities.length === 0 || dragging) return;

    const simulate = () => {
      setPositions(prev => {
        const newPos = { ...prev };
        const centerX = 400;
        const centerY = 250;

        // Apply forces
        entities.forEach(entity => {
          if (!newPos[entity.id]) return;
          const pos = newPos[entity.id];

          // Repulsion between all nodes
          entities.forEach(other => {
            if (entity.id === other.id || !newPos[other.id]) return;
            const otherPos = newPos[other.id];
            const dx = pos.x - otherPos.x;
            const dy = pos.y - otherPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (dist * dist);
            pos.vx += (dx / dist) * force * 0.1;
            pos.vy += (dy / dist) * force * 0.1;
          });

          // Attraction to center
          pos.vx += (centerX - pos.x) * 0.001;
          pos.vy += (centerY - pos.y) * 0.001;

          // Edge attraction
          relationships.forEach(rel => {
            if (rel.source_id === entity.id && newPos[rel.target_id]) {
              const target = newPos[rel.target_id];
              pos.vx += (target.x - pos.x) * 0.01;
              pos.vy += (target.y - pos.y) * 0.01;
            }
            if (rel.target_id === entity.id && newPos[rel.source_id]) {
              const source = newPos[rel.source_id];
              pos.vx += (source.x - pos.x) * 0.01;
              pos.vy += (source.y - pos.y) * 0.01;
            }
          });

          // Apply velocity with damping
          pos.x += pos.vx;
          pos.y += pos.vy;
          pos.vx *= 0.9;
          pos.vy *= 0.9;

          // Keep in bounds
          pos.x = Math.max(50, Math.min(750, pos.x));
          pos.y = Math.max(50, Math.min(450, pos.y));

          newPos[entity.id] = pos;
        });

        return newPos;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    // Run for initial positioning then slow down
    let frameCount = 0;
    const slowSimulate = () => {
      if (frameCount < 100) {
        simulate();
        frameCount++;
      }
    };

    animationRef.current = requestAnimationFrame(slowSimulate);
    const interval = setInterval(slowSimulate, 50);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearInterval(interval);
    };
  }, [entities, relationships, dragging]);

  // Get connections for selected node
  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return relationships.filter(
      r => r.source_id === selectedNode.id || r.target_id === selectedNode.id
    ).map(rel => {
      const otherId = rel.source_id === selectedNode.id ? rel.target_id : rel.source_id;
      const otherEntity = entities.find(e => e.id === otherId);
      const isOutgoing = rel.source_id === selectedNode.id;
      return {
        ...rel,
        otherEntity,
        direction: isOutgoing ? 'outgoing' : 'incoming' as const,
        label: isOutgoing 
          ? `${RELATIONSHIP_LABELS[rel.relationship_type]} ${otherEntity?.name}`
          : `${otherEntity?.name} ${RELATIONSHIP_LABELS[rel.relationship_type]} this`
      };
    });
  }, [selectedNode, relationships, entities]);

  const handleMouseDown = (entityId: string) => {
    setDragging(entityId);
    const entity = entities.find(e => e.id === entityId);
    if (entity) setSelectedNode(entity);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPositions(prev => ({
      ...prev,
      [dragging]: { ...prev[dragging], x, y, vx: 0, vy: 0 }
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const getNodeSize = (entity: KnowledgeEntity) => {
    return Math.max(15, Math.min(35, entity.frequency * 4 + entity.importance));
  };

  if (isLoading) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center", className)}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className={cn(
        "w-full h-[500px] flex items-center justify-center border border-dashed rounded-lg",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No entities yet</p>
          <p className="text-sm">Add your first entity to start building your knowledge graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('full')}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Full View
          </Button>
          <Button
            variant={viewMode === 'backbone' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('backbone')}
          >
            <Focus className="h-4 w-4 mr-1.5" />
            Backbone
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'backbone' && (
            <Badge variant="secondary" className="text-xs">
              {backboneNodeIds.size} of {entities.length} entities • importance ≥ 7, strength ≥ 6
            </Badge>
          )}
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border bg-card">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 800 500"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Edges */}
          {filteredRelationships.map(rel => {
            const source = positions[rel.source_id];
            const target = positions[rel.target_id];
            if (!source || !target) return null;

            const edgeColor = RELATIONSHIP_COLORS[rel.relationship_type] || '#94A3B8';
            const label = RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type;
            const isBackboneEdge = viewMode === 'backbone';
            
            // Calculate midpoint for label
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            return (
              <g key={rel.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={edgeColor}
                  strokeWidth={isBackboneEdge ? Math.max(2, (rel.strength || 5) / 2) : Math.max(1.5, (rel.strength || 5) / 2.5)}
                  strokeOpacity={isBackboneEdge ? 0.85 : 0.6}
                  markerEnd={`url(#arrowhead-${rel.relationship_type})`}
                />
                {/* Edge label */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-label.length * 3.2}
                    y={-8}
                    width={label.length * 6.4}
                    height={14}
                    rx={3}
                    fill="hsl(var(--background))"
                    fillOpacity={0.9}
                    stroke={edgeColor}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <text
                    textAnchor="middle"
                    dy={3}
                    fontSize={9}
                    fontWeight={500}
                    fill={edgeColor}
                  >
                    {label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Arrow markers for each relationship type */}
          <defs>
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <marker
                key={type}
                id={`arrowhead-${type}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 4, 0 8"
                  fill={color}
                  fillOpacity={0.8}
                />
              </marker>
            ))}
          </defs>

          {/* Nodes */}
          {entities.map(entity => {
            const pos = positions[entity.id];
            if (!pos) return null;
            const size = getNodeSize(entity);
            const isSelected = selectedNode?.id === entity.id;
            const isBackboneNode = backboneNodeIds.has(entity.id);
            const IconComponent = ENTITY_ICONS[entity.entity_type as EntityType];
            const iconSize = Math.max(10, size * 0.7);
            
            // Apply opacity for non-backbone nodes in backbone view
            const nodeOpacity = viewMode === 'backbone' && !isBackboneNode ? 0.2 : 1;

            return (
              <g
                key={entity.id}
                onMouseDown={() => handleMouseDown(entity.id)}
                style={{ cursor: 'pointer', opacity: nodeOpacity }}
                className="transition-opacity duration-300"
              >
                {/* Backbone glow effect */}
                {viewMode === 'backbone' && isBackboneNode && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 6}
                    fill="none"
                    stroke={ENTITY_COLORS[entity.entity_type as EntityType]}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    className="animate-pulse"
                  />
                )}
                {/* Glow effect for selected */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 8}
                    fill={ENTITY_COLORS[entity.entity_type as EntityType]}
                    fillOpacity={0.2}
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={entity.color || ENTITY_COLORS[entity.entity_type as EntityType]}
                  stroke={isSelected ? "white" : viewMode === 'backbone' && isBackboneNode ? "white" : "none"}
                  strokeWidth={isSelected ? 3 : viewMode === 'backbone' && isBackboneNode ? 2 : 0}
                  className="transition-all duration-150"
                />
                {/* Entity type icon */}
                {IconComponent && (
                  <foreignObject
                    x={pos.x - iconSize / 2}
                    y={pos.y - iconSize / 2}
                    width={iconSize}
                    height={iconSize}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <IconComponent 
                        size={iconSize * 0.8} 
                        className="text-white drop-shadow-sm"
                        strokeWidth={2.5}
                      />
                    </div>
                  </foreignObject>
                )}
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + size + 14}
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={11}
                  fontWeight={isSelected || (viewMode === 'backbone' && isBackboneNode) ? 600 : 400}
                >
                  {entity.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(ENTITY_COLORS).map(([type, color]) => {
          const IconComponent = ENTITY_ICONS[type as EntityType];
          return (
            <Badge 
              key={type} 
              variant="outline" 
              className="text-xs capitalize"
              style={{ borderColor: color, color }}
            >
              {IconComponent && <IconComponent size={12} className="mr-1.5" />}
              {type}
            </Badge>
          );
        })}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-72 shadow-lg animate-fade-in z-10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <Badge 
                  className="mb-1 capitalize"
                  style={{ 
                    backgroundColor: ENTITY_COLORS[selectedNode.entity_type],
                    color: 'white'
                  }}
                >
                  {selectedNode.entity_type}
                </Badge>
                <h3 className="font-semibold">{selectedNode.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            {selectedNode.description && (
              <p className="text-sm text-muted-foreground">
                {selectedNode.description}
              </p>
            )}

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Mentioned {selectedNode.frequency}x</span>
              <span>Importance: {selectedNode.importance}/10</span>
            </div>

            {selectedConnections.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium mb-2">Connections:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedConnections.map((conn) => (
                    <div 
                      key={conn.id}
                      className="text-xs p-1.5 rounded bg-muted/50 flex items-center gap-1"
                    >
                      <span className={conn.direction === 'outgoing' ? 'text-primary' : 'text-muted-foreground'}>
                        {conn.direction === 'outgoing' ? '→' : '←'}
                      </span>
                      <span>{conn.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
