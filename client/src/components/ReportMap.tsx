import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ReportMapProps {
  pvAreaCoordinates?: [number, number][];
  cableRouteCoordinates?: [number, number][];
}

// Fix for default marker icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function ReportMap({ pvAreaCoordinates, cableRouteCoordinates }: ReportMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([52.52, -1.17], 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setIsReady(true);

    return () => {
      // Don't destroy map on unmount to preserve state
    };
  }, []);

  // Draw PV Area polygon
  useEffect(() => {
    if (!isReady || !mapRef.current || !pvAreaCoordinates || pvAreaCoordinates.length === 0) return;

    // Create polygon
    const polygon = L.polygon(pvAreaCoordinates, {
      color: '#4CAF50',
      weight: 2,
      opacity: 0.7,
      fillColor: '#4CAF50',
      fillOpacity: 0.2,
    }).addTo(mapRef.current);

    // Fit bounds
    const bounds = polygon.getBounds();
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      mapRef.current?.removeLayer(polygon);
    };
  }, [isReady, pvAreaCoordinates]);

  // Draw Cable Route polyline
  useEffect(() => {
    if (!isReady || !mapRef.current || !cableRouteCoordinates || cableRouteCoordinates.length === 0) return;

    // Create polyline
    const polyline = L.polyline(cableRouteCoordinates, {
      color: '#2196F3',
      weight: 3,
      opacity: 0.8,
    }).addTo(mapRef.current);

    // Fit bounds if we don't have PV area
    if (!pvAreaCoordinates || pvAreaCoordinates.length === 0) {
      const bounds = polyline.getBounds();
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      mapRef.current?.removeLayer(polyline);
    };
  }, [isReady, cableRouteCoordinates, pvAreaCoordinates]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        overflow: 'hidden',
      }}
    />
  );
}
