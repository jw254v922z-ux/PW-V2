import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  onMapReady?: (map: L.Map) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function LeafletMap({
  onMapReady,
  initialCenter = [52.52, -1.17], // UK Midlands
  initialZoom = 10,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView(initialCenter, initialZoom);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    setIsReady(true);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter, initialZoom]);

  // Call onMapReady only once when map is ready
  useEffect(() => {
    if (isReady && map.current && onMapReady) {
      onMapReady(map.current);
    }
  }, [isReady, onMapReady]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
      }}
    />
  );
}
