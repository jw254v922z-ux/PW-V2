import { useState, useEffect } from 'react';
import SpatialMap from '@/components/SpatialMap';
import FilterPanel from '@/components/FilterPanel';

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // Load sample GeoJSON data
  useEffect(() => {
    // Sample GeoJSON with planning zones
    const sampleData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '1',
          properties: {
            id: '1',
            name: 'Downtown Core',
            zone: 'Commercial',
            density: 'High',
            status: 'Approved',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-74.0, 40.7],
                [-73.95, 40.7],
                [-73.95, 40.75],
                [-74.0, 40.75],
                [-74.0, 40.7],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '2',
          properties: {
            id: '2',
            name: 'Residential District A',
            zone: 'Residential',
            density: 'Medium',
            status: 'Approved',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-74.05, 40.65],
                [-74.0, 40.65],
                [-74.0, 40.7],
                [-74.05, 40.7],
                [-74.05, 40.65],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '3',
          properties: {
            id: '3',
            name: 'Industrial Zone',
            zone: 'Industrial',
            density: 'Low',
            status: 'Pending',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-73.9, 40.65],
                [-73.85, 40.65],
                [-73.85, 40.7],
                [-73.9, 40.7],
                [-73.9, 40.65],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '4',
          properties: {
            id: '4',
            name: 'Waterfront Development',
            zone: 'Mixed-Use',
            density: 'High',
            status: 'Approved',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-74.0, 40.6],
                [-73.95, 40.6],
                [-73.95, 40.65],
                [-74.0, 40.65],
                [-74.0, 40.6],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '5',
          properties: {
            id: '5',
            name: 'Green Space Reserve',
            zone: 'Parks',
            density: 'Low',
            status: 'Approved',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-73.85, 40.7],
                [-73.8, 40.7],
                [-73.8, 40.75],
                [-73.85, 40.75],
                [-73.85, 40.7],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '6',
          properties: {
            id: '6',
            name: 'Residential District B',
            zone: 'Residential',
            density: 'Medium',
            status: 'Pending',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-73.9, 40.7],
                [-73.85, 40.7],
                [-73.85, 40.75],
                [-73.9, 40.75],
                [-73.9, 40.7],
              ],
            ],
          },
        },
      ],
    };

    setGeoData(sampleData);
  }, []);

  // Get filtered features for map
  const filteredFeatureIds = (() => {
    if (!geoData || !geoData.features) return [];

    return geoData.features
      .filter((feature: any) => {
        const props = feature.properties || {};

        for (const [key, selectedValues] of Object.entries(selectedFilters)) {
          if (selectedValues.length > 0) {
            const featureValue = String(props[key] || '');
            if (!selectedValues.includes(featureValue)) {
              return false;
            }
          }
        }

        return true;
      })
      .map((feature: any) => feature.properties?.id || feature.id);
  })();

  return (
    <div className="flex h-screen bg-background">
      {/* Filter Panel */}
      <div className="w-80 flex-shrink-0 overflow-hidden">
        <FilterPanel
          geoData={geoData}
          selectedFilters={selectedFilters}
          onFilterChange={setSelectedFilters}
          selectedFeature={selectedFeature}
          onFeatureSelect={setSelectedFeature}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-border px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Spatial Planning Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive map for viewing and filtering spatial planning data
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            {geoData && (
              <SpatialMap
                geoData={geoData}
                filteredFeatures={filteredFeatureIds}
                onFeatureClick={setSelectedFeature}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
