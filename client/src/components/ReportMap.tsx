import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ReportMapProps {
  className?: string;
}

export function ReportMap({ className }: ReportMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Load polygon data from sessionStorage
    const pvPolygonDataStr = sessionStorage.getItem("pvPolygonData");
    const cablePolylineDataStr = sessionStorage.getItem("cablePolylineData");

    if (!pvPolygonDataStr && !cablePolylineDataStr) {
      console.log("[ReportMap] No polygon data found in sessionStorage");
      return;
    }

    const pvPolygonData: { lat: number; lng: number }[] = pvPolygonDataStr
      ? JSON.parse(pvPolygonDataStr)
      : [];
    const cablePolylineData: { lat: number; lng: number }[] = cablePolylineDataStr
      ? JSON.parse(cablePolylineDataStr)
      : [];

    console.log("[ReportMap] Loaded polygon data:", {
      pvPoints: pvPolygonData.length,
      cablePoints: cablePolylineData.length,
    });

    // Calculate center and bounds
    const allPoints = [...pvPolygonData, ...cablePolylineData];
    if (allPoints.length === 0) return;

    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    mapRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Render PV polygon
    if (pvPolygonData.length >= 3) {
      L.polygon(pvPolygonData, {
        color: "#22c55e",
        weight: 2,
        opacity: 0.8,
        fillColor: "#22c55e",
        fillOpacity: 0.2,
      }).addTo(map);
    }

    // Render cable polyline
    if (cablePolylineData.length >= 2) {
      L.polyline(cablePolylineData, {
        color: "#ef4444",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
    }

    // Fit bounds to show all shapes
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
