import { useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConstraintLayer {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  enabled: boolean;
}

interface LayerToggleProps {
  layers: ConstraintLayer[];
  onLayerToggle: (layerId: string) => void;
}

const CONSTRAINT_CATEGORIES = [
  'Landscape & Environmental',
  'Heritage & Archaeological',
  'Environmental & Ecological',
  'Agricultural',
  'Flood & Water',
  'Contamination & Hazard',
  'Infrastructure & Utility',
  'Traffic & Noise',
  'Planning-Specific',
  'Protected Views',
];

export default function LayerToggle({ layers, onLayerToggle }: LayerToggleProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    CONSTRAINT_CATEGORIES[0]
  );

  const groupedLayers = CONSTRAINT_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = layers.filter((layer) => layer.category === category);
      return acc;
    },
    {} as Record<string, ConstraintLayer[]>
  );

  const enabledCount = layers.filter((l) => l.enabled).length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-2">Planning Constraints</h2>
        <div className="text-sm text-muted-foreground">
          {enabledCount} of {layers.length} layers active
        </div>
      </div>

      {/* Layer Categories */}
      <div className="flex-1 overflow-y-auto">
        {CONSTRAINT_CATEGORIES.map((category) => {
          const categoryLayers = groupedLayers[category];
          if (categoryLayers.length === 0) return null;

          const isExpanded = expandedCategory === category;

          return (
            <div key={category} className="border-b border-border">
              {/* Category Header */}
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : category)
                }
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm text-foreground">{category}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Category Layers */}
              {isExpanded && (
                <div className="bg-muted/30 px-2 py-2 space-y-2">
                  {categoryLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors group"
                    >
                      {/* Color Indicator */}
                      <div
                        className="w-4 h-4 rounded mt-1 flex-shrink-0 border border-border"
                        style={{ backgroundColor: layer.color }}
                      />

                      {/* Layer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {layer.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {layer.description}
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => onLayerToggle(layer.id)}
                        className="flex-shrink-0 p-1.5 rounded hover:bg-accent transition-colors"
                        title={layer.enabled ? 'Hide layer' : 'Show layer'}
                      >
                        {layer.enabled ? (
                          <Eye className="w-4 h-4 text-primary" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            // Enable all layers
            layers.forEach((layer) => {
              if (!layer.enabled) {
                onLayerToggle(layer.id);
              }
            });
          }}
        >
          Show All
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            // Disable all layers
            layers.forEach((layer) => {
              if (layer.enabled) {
                onLayerToggle(layer.id);
              }
            });
          }}
        >
          Hide All
        </Button>
      </div>
    </div>
  );
}
