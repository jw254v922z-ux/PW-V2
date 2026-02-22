"use client";
import L from "leaflet";
import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { LeafletMap } from "@/components/LeafletMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Zap, RotateCcw, Trash2, Check, ArrowRight } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";
import { toast } from "sonner";

interface DrawingState {
  pvPoints: L.LatLngExpression[];
  cablePoints: L.LatLngExpression[];
  pvPolygon: L.Polygon | null;
  cablePolyline: L.Polyline | null;
  pvMarkers: (L.Marker | L.CircleMarker)[];
  cableMarkers: (L.Marker | L.CircleMarker)[];
}

interface MapResults {
  pvArea?: { area: number; hectares: number; systemSize: number };
  cableDistance?: { distance: number };
}

export default function MapViewPage() {
  const mapRef = useRef<L.Map | null>(null);
  const [, setLocation] = useLocation();
  const [drawingMode, setDrawingMode] = useState<"view" | "pv" | "cable">("view");
  const [mapReady, setMapReady] = useState(false);
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

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    setMapReady(true);
  };

  // Handle map clicks for drawing
  useEffect(() => {
    if (!mapRef.current) return;

    const listener = (e: L.LeafletMouseEvent) => {
      if (drawingMode === "view") return;
      const point = e.latlng;

      if (drawingMode === "pv") {
        addPVPoint(point);
      } else if (drawingMode === "cable") {
        addCablePoint(point);
      }
    };

    mapRef.current.on("click", listener);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", listener);
      }
    };
  }, [drawingMode, mapReady]);

  const addPVPoint = useCallback((point: L.LatLng) => {
    setState((prev) => {
      const newPoints = [...prev.pvPoints, point];
      const marker = L.circleMarker(point, {
        radius: 5,
        fillColor: "#22c55e",
        color: "#16a34a",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapRef.current!);

      const newMarkers = [...prev.pvMarkers, marker];

      // Create or update polygon if 3+ points
      if (newPoints.length >= 3) {
        if (prev.pvPolygon) {
          mapRef.current!.removeLayer(prev.pvPolygon);
        }

        const polygon = L.polygon(newPoints, {
          color: "#22c55e",
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
        }).addTo(mapRef.current!);

        const area = calculatePolygonArea(
          newPoints.map((p) => ({ lat: (p as L.LatLng).lat, lng: (p as L.LatLng).lng }))
        );
        const hectares = area / 10000;
        const systemSize = hectares * 0.5;

        setPvAreaResults({ area, hectares, systemSize });

        return { ...prev, pvPoints: newPoints, pvMarkers: newMarkers, pvPolygon: polygon };
      }

      return { ...prev, pvPoints: newPoints, pvMarkers: newMarkers };
    });
  }, []);

  const addCablePoint = useCallback((point: L.LatLng) => {
    setState((prev) => {
      const newPoints = [...prev.cablePoints, point];
      const marker = L.circleMarker(point, {
        radius: 5,
        fillColor: "#3683f2",
        color: "#1e40af",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapRef.current!);

      const newMarkers = [...prev.cableMarkers, marker];

      // Create or update polyline if 2+ points
      if (newPoints.length >= 2) {
        if (prev.cablePolyline) {
          mapRef.current!.removeLayer(prev.cablePolyline);
        }

        const polyline = L.polyline(newPoints, {
          color: "#3683f2",
          weight: 3,
          opacity: 0.8,
        }).addTo(mapRef.current!);

        let distance = 0;
        for (let i = 0; i < newPoints.length - 1; i++) {
          const p1 = newPoints[i] as L.LatLng;
          const p2 = newPoints[i + 1] as L.LatLng;
          distance += p1.distanceTo(p2) / 1000;
        }

        setCableResults({ distance });

        return { ...prev, cablePoints: newPoints, cableMarkers: newMarkers, cablePolyline: polyline };
      }

      return { ...prev, cablePoints: newPoints, cableMarkers: newMarkers };
    });
  }, []);

  const undoPoint = () => {
    setState((prev) => {
      if (drawingMode === "pv" && prev.pvPoints.length > 0) {
        const newPoints = prev.pvPoints.slice(0, -1);
        const newMarkers = prev.pvMarkers.slice(0, -1);

        // Remove last marker
        if (prev.pvMarkers.length > 0) {
          mapRef.current!.removeLayer(prev.pvMarkers[prev.pvMarkers.length - 1]);
        }

        // Remove polygon if exists
        if (prev.pvPolygon) {
          mapRef.current!.removeLayer(prev.pvPolygon);
        }

        // Redraw polygon if 3+ points remain
        if (newPoints.length >= 3) {
          const polygon = L.polygon(newPoints, {
            color: "#22c55e",
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          }).addTo(mapRef.current!);

          const area = calculatePolygonArea(
            newPoints.map((p) => ({ lat: (p as L.LatLng).lat, lng: (p as L.LatLng).lng }))
          );
          const hectares = area / 10000;
          const systemSize = hectares * 0.5;

          setPvAreaResults({ area, hectares, systemSize });

          return { ...prev, pvPoints: newPoints, pvMarkers: newMarkers, pvPolygon: polygon };
        } else {
          setPvAreaResults(null);
          return { ...prev, pvPoints: newPoints, pvMarkers: newMarkers, pvPolygon: null };
        }
      } else if (drawingMode === "cable" && prev.cablePoints.length > 0) {
        const newPoints = prev.cablePoints.slice(0, -1);
        const newMarkers = prev.cableMarkers.slice(0, -1);

        // Remove last marker
        if (prev.cableMarkers.length > 0) {
          mapRef.current!.removeLayer(prev.cableMarkers[prev.cableMarkers.length - 1]);
        }

        // Remove polyline if exists
        if (prev.cablePolyline) {
          mapRef.current!.removeLayer(prev.cablePolyline);
        }

        // Redraw polyline if 2+ points remain
        if (newPoints.length >= 2) {
          const polyline = L.polyline(newPoints, {
            color: "#3683f2",
            weight: 3,
            opacity: 0.8,
          }).addTo(mapRef.current!);

          let distance = 0;
          for (let i = 0; i < newPoints.length - 1; i++) {
            const p1 = newPoints[i] as L.LatLng;
            const p2 = newPoints[i + 1] as L.LatLng;
            distance += p1.distanceTo(p2) / 1000;
          }

          setCableResults({ distance });

          return { ...prev, cablePoints: newPoints, cableMarkers: newMarkers, cablePolyline: polyline };
        } else {
          setCableResults(null);
          return { ...prev, cablePoints: newPoints, cableMarkers: newMarkers, cablePolyline: null };
        }
      }

      return prev;
    });
  };

  const clearAll = () => {
    // Remove all markers and shapes from map
    state.pvMarkers.forEach((marker) => mapRef.current!.removeLayer(marker));
    state.cableMarkers.forEach((marker) => mapRef.current!.removeLayer(marker));
    if (state.pvPolygon) mapRef.current!.removeLayer(state.pvPolygon);
    if (state.cablePolyline) mapRef.current!.removeLayer(state.cablePolyline);

    setState({
      pvPoints: [],
      cablePoints: [],
      pvPolygon: null,
      cablePolyline: null,
      pvMarkers: [],
      cableMarkers: [],
    });

    setPvAreaResults(null);
    setCableResults(null);
    setDrawingMode("view");
  };

  const applyPVAreaToCalculator = async () => {
    if (!pvAreaResults) {
      toast.error("No PV area drawn yet");
      return;
    }

    // Store map results in sessionStorage for Dashboard to pick up
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults.systemSize,
        cableDistance: cableResults?.distance || null,
      })
    );

    toast.success(`Applied PV area: ${pvAreaResults.systemSize.toFixed(2)} MW`);
    
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(mapContainer, { backgroundColor: '#ffffff', scale: 2 });
        sessionStorage.setItem('mapScreenshot', canvas.toDataURL('image/png'));
      }
    } catch (e) {
      console.error('Map screenshot capture failed:', e);
    }
    
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  const applyCableDistanceToCalculator = async () => {
    if (!cableResults) {
      toast.error("No cable route drawn yet");
      return;
    }

    // Store map results in sessionStorage for Dashboard to pick up
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults?.systemSize || null,
        cableDistance: cableResults.distance,
      })
    );

    toast.success(`Applied cable distance: ${cableResults.distance.toFixed(2)} km`);
    
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(mapContainer, { backgroundColor: '#ffffff', scale: 2 });
        sessionStorage.setItem('mapScreenshot', canvas.toDataURL('image/png'));
      }
    } catch (e) {
      console.error('Map screenshot capture failed:', e);
    }
    
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  const applyBothToCalculator = async () => {
    if (!pvAreaResults || !cableResults) {
      toast.error("Please draw both PV area and cable route");
      return;
    }

    // Store map results in sessionStorage for Dashboard to pick up
    sessionStorage.setItem(
      "mapResults",
      JSON.stringify({
        systemSize: pvAreaResults.systemSize,
        cableDistance: cableResults.distance,
      })
    );

    toast.success("Applied both PV area and cable distance to calculator");
    
    try {
      if (mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(mapContainer, { backgroundColor: '#ffffff', scale: 2 });
        sessionStorage.setItem('mapScreenshot', canvas.toDataURL('image/png'));
      }
    } catch (e) {
      console.error('Map screenshot capture failed:', e);
    }
    
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
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  PV Area
                </h3>
                {pvAreaResults && <Badge variant="secondary" className="text-xs">From Map</Badge>}
              </div>
              {pvAreaResults ? (
                <div className="text-sm space-y-2 bg-green-50 p-3 rounded border border-green-200">
                  <div>
                    <span className="text-gray-600">Area:</span>
                    <span className="font-mono ml-2">
                      {pvAreaResults.area.toFixed(0)} m² ({pvAreaResults.hectares.toFixed(2)} ha)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">System Size:</span>
                    <span className="font-mono ml-2 font-bold text-green-700">{pvAreaResults.systemSize.toFixed(2)} MW</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ✓ Drawn ({state.pvPoints.length} pts)
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-green-600 hover:bg-green-700"
                    onClick={applyPVAreaToCalculator}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Apply to Calculator
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {state.pvPoints.length === 0
                    ? "Click 3+ points on map to draw PV area"
                    : `${state.pvPoints.length} pts (need 3+)`}
                </div>
              )}
            </div>

            {/* Cable Route */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Cable Route
                </h3>
                {cableResults && <Badge variant="secondary" className="text-xs">From Map</Badge>}
              </div>
              {cableResults ? (
                <div className="text-sm space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
                  <div>
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-mono ml-2 font-bold text-blue-700">{cableResults.distance.toFixed(2)} km</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ✓ Drawn ({state.cablePoints.length} pts)
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                    onClick={applyCableDistanceToCalculator}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Apply to Calculator
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {state.cablePoints.length === 0
                    ? "Click 2+ points on map to draw cable route"
                    : `${state.cablePoints.length} pts (need 2+)`}
                </div>
              )}
            </div>

            {/* Apply Both Button */}
            {pvAreaResults && cableResults && (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={applyBothToCalculator}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Apply Both to Calculator
              </Button>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {(state.pvPoints.length > 0 || state.cablePoints.length > 0) && (
                <>
                  <Button variant="outline" size="sm" onClick={undoPoint} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} className="flex-1">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Help</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-gray-600">
            <p>
              <strong>Draw PV Area:</strong> Click 3+ points to create a polygon
            </p>
            <p>
              <strong>Draw Cable Route:</strong> Click 2+ points to create a polyline
            </p>
            <p>
              <strong>Apply:</strong> Send results to calculator with "From Map" badge
            </p>
            <p>
              <strong>Undo:</strong> Remove the last point
            </p>
            <p>
              <strong>Clear:</strong> Reset all drawings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
