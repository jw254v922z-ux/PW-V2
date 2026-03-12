import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SpatialMapProps {
  geoData: any;
  filteredFeatures: string[];
  onFeatureClick?: (feature: any) => void;
}

export default function SpatialMap({ geoData, filteredFeatures, onFeatureClick }: SpatialMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([40, -95], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, []);

  // Update GeoJSON layer when data or filters change
  useEffect(() => {
    if (!mapRef.current || !geoData) return;

    // Remove old GeoJSON layer
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    // Create new GeoJSON layer
    geoJsonLayerRef.current = L.geoJSON(geoData, {
      style: (feature: any) => {
        const isFiltered = filteredFeatures.includes(feature?.properties?.id || '');
        return {
          color: isFiltered ? '#10B981' : '#D1D5DB',
          weight: isFiltered ? 3 : 1,
          opacity: isFiltered ? 1 : 0.5,
          fillOpacity: isFiltered ? 0.3 : 0.1,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        layer.on('click', () => {
          if (onFeatureClick) {
            onFeatureClick(feature);
          }
        });

        // Create popup
        const props = feature.properties || {};
        let popupContent = '<div class="text-sm p-2">';
        for (const [key, value] of Object.entries(props)) {
          popupContent += `<p class="mb-1"><strong>${key}:</strong> ${value}</p>`;
        }
        popupContent += '</div>';

        layer.bindPopup(popupContent);
      },
    }).addTo(mapRef.current);

    // Fit bounds to features
    const bounds = geoJsonLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geoData, filteredFeatures, onFeatureClick]);

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
