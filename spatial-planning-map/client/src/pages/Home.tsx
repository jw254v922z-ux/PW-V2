import { useState, useEffect } from 'react';
import SpatialMap from '@/components/SpatialMap';
import FilterPanel from '@/components/FilterPanel';

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // Load UK planning zones data
  useEffect(() => {
    // UK planning zones with realistic coordinates
    const ukPlanningData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '1',
          properties: {
            id: '1',
            name: 'London City Centre',
            region: 'Greater London',
            useClass: 'Mixed-Use',
            density: 'Very High',
            status: 'Approved',
            council: 'City of London',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-0.1, 51.51],
                [-0.08, 51.51],
                [-0.08, 51.52],
                [-0.1, 51.52],
                [-0.1, 51.51],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '2',
          properties: {
            id: '2',
            name: 'Manchester Business District',
            region: 'Greater Manchester',
            useClass: 'Commercial',
            density: 'High',
            status: 'Approved',
            council: 'Manchester City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-2.25, 53.47],
                [-2.23, 53.47],
                [-2.23, 53.49],
                [-2.25, 53.49],
                [-2.25, 53.47],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '3',
          properties: {
            id: '3',
            name: 'Birmingham Residential',
            region: 'West Midlands',
            useClass: 'Residential',
            density: 'Medium',
            status: 'Approved',
            council: 'Birmingham City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.92, 52.5],
                [-1.9, 52.5],
                [-1.9, 52.52],
                [-1.92, 52.52],
                [-1.92, 52.5],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '4',
          properties: {
            id: '4',
            name: 'Leeds City Centre',
            region: 'West Yorkshire',
            useClass: 'Mixed-Use',
            density: 'High',
            status: 'Pending',
            council: 'Leeds City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.55, 53.8],
                [-1.53, 53.8],
                [-1.53, 53.82],
                [-1.55, 53.82],
                [-1.55, 53.8],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '5',
          properties: {
            id: '5',
            name: 'Bristol Waterfront',
            region: 'Bristol',
            useClass: 'Leisure & Culture',
            density: 'Medium',
            status: 'Approved',
            council: 'Bristol City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-2.6, 51.45],
                [-2.58, 51.45],
                [-2.58, 51.47],
                [-2.6, 51.47],
                [-2.6, 51.45],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '6',
          properties: {
            id: '6',
            name: 'Edinburgh New Town',
            region: 'Edinburgh',
            useClass: 'Residential',
            density: 'High',
            status: 'Pending',
            council: 'City of Edinburgh Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-3.2, 55.95],
                [-3.18, 55.95],
                [-3.18, 55.97],
                [-3.2, 55.97],
                [-3.2, 55.95],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '7',
          properties: {
            id: '7',
            name: 'Glasgow Industrial Quarter',
            region: 'Glasgow',
            useClass: 'Industrial',
            density: 'Medium',
            status: 'Approved',
            council: 'Glasgow City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-4.3, 55.85],
                [-4.28, 55.85],
                [-4.28, 55.87],
                [-4.3, 55.87],
                [-4.3, 55.85],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: '8',
          properties: {
            id: '8',
            name: 'Liverpool Docklands',
            region: 'Merseyside',
            useClass: 'Mixed-Use',
            density: 'High',
            status: 'Approved',
            council: 'Liverpool City Council',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-2.62, 53.4],
                [-2.6, 53.4],
                [-2.6, 53.42],
                [-2.62, 53.42],
                [-2.62, 53.4],
              ],
            ],
          },
        },
      ],
    };

    setGeoData(ukPlanningData);
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
          <h1 className="text-2xl font-bold text-foreground">UK Spatial Planning Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive map for viewing and filtering UK planning zones and development areas
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
