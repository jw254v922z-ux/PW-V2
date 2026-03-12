import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ConstraintLayer {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  enabled: boolean;
  geoData?: any;
}

interface SpatialMapProps {
  layers: ConstraintLayer[];
  onFeatureClick?: (feature: any, layerId: string) => void;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function SpatialMap({ layers, onFeatureClick }: SpatialMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([54.5, -3.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, []);

  // Update layers when enabled/disabled or data changes
  useEffect(() => {
    if (!mapRef.current) return;

    layers.forEach((layer) => {
      const existingLayer = geoJsonLayersRef.current.get(layer.id);

      if (layer.enabled && layer.geoData) {
        // Add or update layer
        if (existingLayer) {
          mapRef.current!.removeLayer(existingLayer);
        }

        const geoJsonLayer = L.geoJSON(layer.geoData, {
          style: () => ({
            color: layer.color,
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.3,
          }),
          onEachFeature: (feature: any, leafletLayer: any) => {
            leafletLayer.on('click', () => {
              if (onFeatureClick) {
                onFeatureClick(feature, layer.id);
              }
            });

            // Create popup
            const props = feature.properties || {};
            let popupContent = `<div class="text-sm p-2"><strong>${layer.name}</strong>`;
            for (const [key, value] of Object.entries(props)) {
              popupContent += `<p class="mb-1"><strong>${key}:</strong> ${value}</p>`;
            }
            popupContent += '</div>';

            leafletLayer.bindPopup(popupContent);
          },
        }).addTo(mapRef.current as L.Map);

        geoJsonLayersRef.current.set(layer.id, geoJsonLayer);
      } else if (!layer.enabled && existingLayer) {
        // Remove layer
        mapRef.current?.removeLayer(existingLayer);
        geoJsonLayersRef.current.delete(layer.id);
      }
    });

    // Fit bounds to all visible layers
    const allLayers = Array.from(geoJsonLayersRef.current.values());
    if (allLayers.length > 0 && mapRef.current) {
      const group = new L.FeatureGroup(allLayers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        mapRef.current!.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });     }
    }
  }, [layers, onFeatureClick]);

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
