import L from "leaflet";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { LeafletMap } from "@/components/LeafletMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Trash2, Check, ArrowRight } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface DrawingState {
  pvPoints: L.LatLngExpression[];
  cablePoints: L.LatLngExpression[];
  pvPolygon: L.Polygon | null;
  cablePolyline: L.Polyline | null;
  pvMarkers: L.CircleMarker[];
  cableMarkers: L.CircleMarker[];
}

export default function MapViewPage() {
  const mapRef = useRef<L.Map | null>(null);
  const [, setLocation] = useLocation();
  const [drawingMode, setDrawingMode] = useState<"view" | "pv" | "cable">("view");
  const [state, setState] = useState<DrawingState>({
    pvPoints: [],
    cablePoints: [],
    pvPolygon: null,
    cablePolyline: null,
    pvMarkers: [],
    cableMarkers: [],
  });

  const [pvAreaResults, setPvAreaResults] = useState<{
    area: number;
    hectares: number;
    systemSize: number;
  } | null>(null);

  const [cableResults, setCableResults] = useState<{
    distance: number;
  } | null>(null);

  // Define drawing functions that update state
  const addPVPoint = (point: L.LatLng) => {
    setState((prev) => {
      const newPoints = [...prev.pvPoints, point];

      // Add marker to map
      if (mapRef.current) {
        const marker = L.circleMarker(point, {
          radius: 5,
          fillColor: "#22c55e",
          color: "#16a34a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapRef.current);

        const newMarkers = [...prev.pvMarkers, marker];

        // Create or update polygon
        let newPolygon = prev.pvPolygon;
        if (newPoints.length >= 3) {
          if (prev.pvPolygon) {
            mapRef.current.removeLayer(prev.pvPolygon);
          }
          newPolygon = L.polygon(newPoints, {
            color: "#22c55e",
            weight: 2,
            opacity: 0.8,
            fillColor: "#22c55e",
            fillOpacity: 0.2,
          }).addTo(mapRef.current);

          // Calculate area
          const area = calculatePolygonArea(newPoints);
          const hectares = area / 10000;
          const systemSize = hectares * 10;
          setPvAreaResults({ area, hectares, systemSize });
        }

        return {
          ...prev,
          pvPoints: newPoints,
          pvMarkers: newMarkers,
          pvPolygon: newPolygon,
        };
      }

      return prev;
    });
  };

  const addCablePoint = (point: L.LatLng) => {
    setState((prev) => {
      const newPoints = [...prev.cablePoints, point];

      // Add marker to map
      if (mapRef.current) {
        const marker = L.circleMarker(point, {
          radius: 5,
          fillColor: "#3b82f6",
          color: "#1d4ed8",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapRef.current);

        const newMarkers = [...prev.cableMarkers, marker];

        // Create or update polyline
        let newPolyline = prev.cablePolyline;
        if (newPoints.length >= 2) {
          if (prev.cablePolyline) {
            mapRef.current.removeLayer(prev.cablePolyline);
          }
          newPolyline = L.polyline(newPoints, {
            color: "#3b82f6",
            weight: 3,
            opacity: 0.8,
          }).addTo(mapRef.current);

          // Calculate distance
          const distance = calculatePolylineDistance(newPoints);
          setCableResults({ distance });
        }

        return {
          ...prev,
          cablePoints: newPoints,
          cableMarkers: newMarkers,
          cablePolyline: newPolyline,
        };
      }

      return prev;
    });
  };

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;

    // Attach click listener
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (drawingMode === "view") return;

      const point = e.latlng;

      if (drawingMode === "pv") {
        addPVPoint(point);
      } else if (drawingMode === "cable") {
        addCablePoint(point);
      }
    });
  };

  const clearPVArea = () => {
    setState((prev) => {
      prev.pvMarkers.forEach((m) => mapRef.current?.removeLayer(m));
      if (prev.pvPolygon) mapRef.current?.removeLayer(prev.pvPolygon);
      return {
        ...prev,
        pvPoints: [],
        pvMarkers: [],
        pvPolygon: null,
      };
    });
    setPvAreaResults(null);
    toast.success("PV area cleared");
  };

  const clearCableRoute = () => {
    setState((prev) => {
      prev.cableMarkers.forEach((m) => mapRef.current?.removeLayer(m));
      if (prev.cablePolyline) mapRef.current?.removeLayer(prev.cablePolyline);
      return {
        ...prev,
        cablePoints: [],
        cableMarkers: [],
        cablePolyline: null,
      };
    });
    setCableResults(null);
    toast.success("Cable route cleared");
  };

  const applyPVAreaToCalculator = async () => {
    if (!pvAreaResults) {
      toast.error("No PV area drawn yet");
      return;
    }

    // Capture map screenshot
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const canvas = await html2canvas(mapContainer, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
      }
    } catch (e) {
      console.error("Map screenshot capture failed:", e);
    }

    // Store map results
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults.systemSize,
        cableDistance: cableResults?.distance || null,
      })
    );

    toast.success(`Applied PV area: ${pvAreaResults.systemSize.toFixed(2)} MW`);
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  const applyCableDistanceToCalculator = async () => {
    if (!cableResults) {
      toast.error("No cable route drawn yet");
      return;
    }

    // Capture map screenshot
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const canvas = await html2canvas(mapContainer, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
      }
    } catch (e) {
      console.error("Map screenshot capture failed:", e);
    }

    // Store map results
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults?.systemSize || null,
        cableDistance: cableResults.distance,
      })
    );

    toast.success(`Applied cable distance: ${cableResults.distance.toFixed(2)} km`);
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  const applyBothToCalculator = async () => {
    if (!pvAreaResults || !cableResults) {
      toast.error("Please draw both PV area and cable route");
      return;
    }

    // Capture map screenshot
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const canvas = await html2canvas(mapContainer, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
      }
    } catch (e) {
      console.error("Map screenshot capture failed:", e);
    }

    // Store map results
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults.systemSize,
        cableDistance: cableResults.distance,
      })
    );

    toast.success("Applied both PV area and cable distance to calculator");
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  return (
    <div className="flex h-screen gap-4 p-4 bg-background">
      {/* Map Container */}
      <div className="flex-1 rounded-lg border border-border overflow-hidden" data-map-container>
        <LeafletMap onMapReady={handleMapReady} initialCenter={[52.52, -1.17]} initialZoom={10} />
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Drawing Tools</CardTitle>
            <CardDescription>Click on map to place points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={drawingMode === "view" ? "default" : "outline"}
              className="w-full"
              onClick={() => setDrawingMode("view")}
            >
              View
            </Button>
            <Button
              variant={drawingMode === "pv" ? "default" : "outline"}
              className="w-full"
              onClick={() => setDrawingMode("pv")}
            >
              Draw PV Area
            </Button>
            <Button
              variant={drawingMode === "cable" ? "default" : "outline"}
              className="w-full"
              onClick={() => setDrawingMode("cable")}
            >
              Draw Cable Route
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="flex-1 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PV Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">PV Area</span>
                </div>
                {pvAreaResults && <Badge variant="secondary">✓ Drawn</Badge>}
              </div>
              {pvAreaResults ? (
                <div className="text-sm space-y-1 bg-green-50 p-2 rounded">
                  <p>Area: {pvAreaResults.area.toFixed(0)} m²</p>
                  <p>Hectares: {pvAreaResults.hectares.toFixed(2)} ha</p>
                  <p className="font-semibold">System Size: {pvAreaResults.systemSize.toFixed(2)} MW</p>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={clearPVArea}>
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Draw a polygon with 3+ points</p>
              )}
            </div>

            {/* Cable Route */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">Cable Route</span>
                </div>
                {cableResults && <Badge variant="secondary">✓ Drawn</Badge>}
              </div>
              {cableResults ? (
                <div className="text-sm space-y-1 bg-blue-50 p-2 rounded">
                  <p className="font-semibold">Distance: {cableResults.distance.toFixed(2)} km</p>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={clearCableRoute}>
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Draw a line with 2+ points</p>
              )}
            </div>

            {/* Apply Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {pvAreaResults && (
                <Button className="w-full" onClick={applyPVAreaToCalculator}>
                  <Check className="w-4 h-4 mr-2" /> Apply PV Area
                </Button>
              )}
              {cableResults && (
                <Button className="w-full" onClick={applyCableDistanceToCalculator}>
                  <Check className="w-4 h-4 mr-2" /> Apply Cable Distance
                </Button>
              )}
              {pvAreaResults && cableResults && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={applyBothToCalculator}>
                  <Check className="w-4 h-4 mr-2" /> Apply Both
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
              >
                <ArrowRight className="w-4 h-4 mr-2" /> Back to Calculator
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
