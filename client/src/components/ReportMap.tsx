import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ReportMapProps {
  pvAreaCoordinates?: [number, number][];
  cableRouteCoordinates?: [number, number][];
}

export function ReportMap({ pvAreaCoordinates, cableRouteCoordinates }: ReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([52.5, -1.5], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Fix for default marker icon
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }

    const map = mapInstanceRef.current;

    // Clear existing layers (except tiles)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Draw PV Area
    if (pvAreaCoordinates && pvAreaCoordinates.length >= 3) {
      L.polygon(pvAreaCoordinates, {
        color: "green",
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.3,
      }).addTo(map);

      // Add markers for PV area points
      pvAreaCoordinates.forEach((coord) => {
        L.circleMarker(coord, {
          radius: 4,
          fillColor: "green",
          color: "darkgreen",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);
      });
    }

    // Draw Cable Route
    if (cableRouteCoordinates && cableRouteCoordinates.length >= 2) {
      L.polyline(cableRouteCoordinates, {
        color: "blue",
        weight: 3,
        opacity: 0.7,
      }).addTo(map);

      // Add markers for cable route points
      cableRouteCoordinates.forEach((coord) => {
        L.circleMarker(coord, {
          radius: 4,
          fillColor: "blue",
          color: "darkblue",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);
      });
    }

    // Fit bounds to show all features
    if ((pvAreaCoordinates && pvAreaCoordinates.length > 0) || 
        (cableRouteCoordinates && cableRouteCoordinates.length > 0)) {
      const allCoords = [
        ...(pvAreaCoordinates || []),
        ...(cableRouteCoordinates || []),
      ];
      
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [pvAreaCoordinates, cableRouteCoordinates]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    />
  );
}
