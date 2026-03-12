import { useState, useEffect } from 'react';
import SpatialMap from '@/components/SpatialMap';
import LayerToggle from '@/components/LayerToggle';

interface ConstraintLayer {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  enabled: boolean;
  geoData?: any;
}

export default function Home() {
  const [layers, setLayers] = useState<ConstraintLayer[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // Initialize constraint layers
  useEffect(() => {
    // Sample GeoJSON data for different constraint types
    const greenBeltData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'London Green Belt', type: 'Green Belt' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-0.5, 51.3],
                [0.2, 51.3],
                [0.2, 51.7],
                [-0.5, 51.7],
                [-0.5, 51.3],
              ],
            ],
          },
        },
      ],
    };

    const sssiData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Peak District SSSI', type: 'SSSI' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.8, 53.1],
                [-1.5, 53.1],
                [-1.5, 53.4],
                [-1.8, 53.4],
                [-1.8, 53.1],
              ],
            ],
          },
        },
      ],
    };

    const floodZoneData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Thames Flood Zone 3', zone: 'Zone 3a' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-0.15, 51.48],
                [-0.1, 51.48],
                [-0.1, 51.52],
                [-0.15, 51.52],
                [-0.15, 51.48],
              ],
            ],
          },
        },
      ],
    };

    const heritageData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Westminster Conservation Area', type: 'Conservation Area' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-0.14, 51.49],
                [-0.12, 51.49],
                [-0.12, 51.51],
                [-0.14, 51.51],
                [-0.14, 51.49],
              ],
            ],
          },
        },
      ],
    };

    const agricultureData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Grade 1 Agricultural Land', grade: '1' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-2.0, 52.0],
                [-1.8, 52.0],
                [-1.8, 52.2],
                [-2.0, 52.2],
                [-2.0, 52.0],
              ],
            ],
          },
        },
      ],
    };

    const initialLayers: ConstraintLayer[] = [
      {
        id: 'green-belt',
        name: 'Green Belt',
        category: 'Landscape & Environmental',
        color: '#10B981',
        description: 'Prevents urban sprawl and protects countryside',
        enabled: true,
        geoData: greenBeltData,
      },
      {
        id: 'sssi',
        name: 'Sites of Special Scientific Interest (SSSI)',
        category: 'Environmental & Ecological',
        color: '#8B5CF6',
        description: 'Protects areas of special flora, fauna, or geological interest',
        enabled: true,
        geoData: sssiData,
      },
      {
        id: 'flood-zone-3',
        name: 'Flood Zone 3a (High Probability)',
        category: 'Flood & Water',
        color: '#3B82F6',
        description: 'High probability of river/coastal flooding (>1 in 100 annual)',
        enabled: true,
        geoData: floodZoneData,
      },
      {
        id: 'conservation-area',
        name: 'Conservation Areas',
        category: 'Heritage & Archaeological',
        color: '#F59E0B',
        description: 'Areas of special architectural or historic interest',
        enabled: true,
        geoData: heritageData,
      },
      {
        id: 'agricultural-grade-1',
        name: 'Grade 1 Agricultural Land',
        category: 'Agricultural',
        color: '#FBBF24',
        description: 'Excellent quality agricultural land with minimal limitations',
        enabled: true,
        geoData: agricultureData,
      },
      {
        id: 'aonb',
        name: 'Areas of Outstanding Natural Beauty (AONB)',
        category: 'Landscape & Environmental',
        color: '#06B6D4',
        description: 'Landscapes of special scenic value requiring protection',
        enabled: false,
      },
      {
        id: 'ancient-woodland',
        name: 'Ancient Woodland',
        category: 'Environmental & Ecological',
        color: '#059669',
        description: 'Woodland continuously present since 1600',
        enabled: false,
      },
      {
        id: 'scheduled-monument',
        name: 'Scheduled Monuments',
        category: 'Heritage & Archaeological',
        color: '#DC2626',
        description: 'Archaeological sites and monuments of national importance',
        enabled: false,
      },
      {
        id: 'flood-zone-2',
        name: 'Flood Zone 2 (Medium Probability)',
        category: 'Flood & Water',
        color: '#60A5FA',
        description: 'Medium probability of flooding (1 in 100 to 1 in 1,000 annual)',
        enabled: false,
      },
      {
        id: 'contaminated-land',
        name: 'Contaminated Land',
        category: 'Contamination & Hazard',
        color: '#7C3AED',
        description: 'Land with historical industrial use requiring assessment',
        enabled: false,
      },
    ];

    setLayers(initialLayers);
  }, []);

  const handleLayerToggle = (layerId: string) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Layer Toggle Panel */}
      <div className="w-80 flex-shrink-0 overflow-hidden">
        <LayerToggle layers={layers} onLayerToggle={handleLayerToggle} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-border px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">UK Planning Constraints Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive visualization of planning constraints affecting development across the UK
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <SpatialMap
              layers={layers}
              onFeatureClick={(feature, layerId) => {
                setSelectedFeature({ ...feature, layerId });
              }}
            />
          </div>
        </div>
      </div>

      {/* Feature Details Panel */}
      {selectedFeature && (
        <div className="w-80 flex-shrink-0 bg-white border-l border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Feature Details</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedFeature.properties && (
              <>
                {Object.entries(selectedFeature.properties).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {key}
                    </div>
                    <div className="text-sm text-foreground mt-1">{String(value)}</div>
                  </div>
                ))}
              </>
            )}
            <div className="pt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Geometry Type
              </div>
              <div className="text-sm text-foreground">
                {selectedFeature.geometry?.type || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
