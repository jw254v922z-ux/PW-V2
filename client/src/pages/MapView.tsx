"use client";

import { useRef, useState, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, Zap, Maximize2, RotateCcw, Trash2, Check } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";

interface DrawingState {
  pvPoints: google.maps.LatLngLiteral[];
  cablePoints: google.maps.LatLngLiteral[];
  pvPolygon: google.maps.Polygon | null;
  cablePolyline: google.maps.Polyline | null;
  pvMarkers: google.maps.marker.AdvancedMarkerElement[];
  cableMarkers: google.maps.marker.AdvancedMarkerElement[];
}

export default function MapViewPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
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

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // Handle map clicks for drawing
  useEffect(() => {
    if (!mapRef.current || drawingMode === "view") return;

    const listener = mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      if (drawingMode === "pv") {
        addPVPoint(point);
      } else if (drawingMode === "cable") {
        addCablePoint(point);
      }
    });

    return () => listener.remove();
  }, [drawingMode]);

  const createMarker = async (
    position: google.maps.LatLngLiteral,
    color: string
  ): Promise<google.maps.marker.AdvancedMarkerElement | null> => {
    if (!mapRef.current || !window.google) return null;

    const pinElement = new google.maps.marker.PinElement({
      background: color,
      borderColor: "#fff",
      glyphColor: "#fff",
    });

    return new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position,
      content: pinElement.element,
    });
  };

  const addPVPoint = async (point: google.maps.LatLngLiteral) => {
    const newPoints = [...state.pvPoints, point];
    const marker = await createMarker(point, "#22c55e");

    const newMarkers = marker ? [...state.pvMarkers, marker] : state.pvMarkers;

    // Create or update polygon if we have 3+ points
    let newPolygon = state.pvPolygon;
    if (newPoints.length >= 3) {
      if (newPolygon) {
        newPolygon.setMap(null);
      }

      newPolygon = new google.maps.Polygon({
        paths: newPoints,
        strokeColor: "#22c55e",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.25,
        map: mapRef.current,
        editable: false,
      });

      // Calculate area and system size
      const areaM2 = calculatePolygonArea(newPoints);
      const hectares = areaM2 / 10000;
      const systemSize = hectares * 0.5; // 0.5 MW per hectare

      setPvAreaResults({
        area: areaM2,
        hectares: hectares,
        systemSize: systemSize,
      });
    }

    setState({
      ...state,
      pvPoints: newPoints,
      pvMarkers: newMarkers,
      pvPolygon: newPolygon,
    });
  };

  const addCablePoint = async (point: google.maps.LatLngLiteral) => {
    const newPoints = [...state.cablePoints, point];
    const marker = await createMarker(point, "#3b82f6");

    const newMarkers = marker ? [...state.cableMarkers, marker] : state.cableMarkers;

    // Create or update polyline if we have 2+ points
    let newPolyline = state.cablePolyline;
    if (newPoints.length >= 2) {
      if (newPolyline) {
        newPolyline.setMap(null);
      }

      newPolyline = new google.maps.Polyline({
        path: newPoints,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: mapRef.current,
      });

      // Calculate distance
      const distanceKm = calculatePolylineDistance(newPoints);
      setCableResults({
        distance: distanceKm,
      });
    }

    setState({
      ...state,
      cablePoints: newPoints,
      cableMarkers: newMarkers,
      cablePolyline: newPolyline,
    });
  };

  const undoLastPoint = () => {
    if (drawingMode === "pv" && state.pvPoints.length > 0) {
      const newPoints = state.pvPoints.slice(0, -1);
      const newMarkers = state.pvMarkers.slice(0, -1);

      // Remove last marker
      if (state.pvMarkers.length > 0) {
        state.pvMarkers[state.pvMarkers.length - 1].map = null;
      }

      // Update or remove polygon
      let newPolygon = state.pvPolygon;
      if (newPoints.length >= 3) {
        if (newPolygon) newPolygon.setMap(null);
        newPolygon = new google.maps.Polygon({
          paths: newPoints,
          strokeColor: "#22c55e",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#22c55e",
          fillOpacity: 0.25,
          map: mapRef.current,
        });
      } else if (newPolygon) {
        newPolygon.setMap(null);
        newPolygon = null;
      }

      setState({
        ...state,
        pvPoints: newPoints,
        pvMarkers: newMarkers,
        pvPolygon: newPolygon,
      });
    } else if (drawingMode === "cable" && state.cablePoints.length > 0) {
      const newPoints = state.cablePoints.slice(0, -1);
      const newMarkers = state.cableMarkers.slice(0, -1);

      // Remove last marker
      if (state.cableMarkers.length > 0) {
        state.cableMarkers[state.cableMarkers.length - 1].map = null;
      }

      // Update or remove polyline
      let newPolyline = state.cablePolyline;
      if (newPoints.length >= 2) {
        if (newPolyline) newPolyline.setMap(null);
        newPolyline = new google.maps.Polyline({
          path: newPoints,
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapRef.current,
        });
      } else if (newPolyline) {
        newPolyline.setMap(null);
        newPolyline = null;
      }

      setState({
        ...state,
        cablePoints: newPoints,
        cableMarkers: newMarkers,
        cablePolyline: newPolyline,
      });
    }
  };

  const clearAll = () => {
    // Remove polygon
    if (state.pvPolygon) {
      state.pvPolygon.setMap(null);
    }

    // Remove polyline
    if (state.cablePolyline) {
      state.cablePolyline.setMap(null);
    }

    // Remove all markers
    state.pvMarkers.forEach((m) => (m.map = null));
    state.cableMarkers.forEach((m) => (m.map = null));

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MapPin className="w-8 h-8 text-blue-600" />
                Site Mapping & Cable Routing
              </h1>
              <p className="text-muted-foreground mt-2">
                Draw your PV area and cable route to automatically calculate distance and sizing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>
                  {drawingMode === "view" && "Select a drawing mode to get started"}
                  {drawingMode === "pv" && "Click points on the map to draw your PV area polygon (minimum 3 points)"}
                  {drawingMode === "cable" && "Click points on the map to draw your cable route (minimum 2 points)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Drawing Mode Controls */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={drawingMode === "view" ? "default" : "outline"}
                      onClick={() => setDrawingMode("view")}
                      className="gap-2"
                    >
                      <Maximize2 className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant={drawingMode === "pv" ? "default" : "outline"}
                      onClick={() => setDrawingMode("pv")}
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Draw PV Area
                    </Button>
                    <Button
                      variant={drawingMode === "cable" ? "default" : "outline"}
                      onClick={() => setDrawingMode("cable")}
                      className="gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Draw Cable Route
                    </Button>
                    <Button
                      variant="outline"
                      onClick={undoLastPoint}
                      disabled={state.pvPoints.length === 0 && state.cablePoints.length === 0}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Undo Point
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={clearAll}
                      disabled={!state.pvPolygon && !state.cablePolyline}
                      className="gap-2 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </Button>
                  </div>

                  {/* Map Container */}
                  <div className="rounded-lg border overflow-hidden">
                    <MapView
                      initialCenter={{ lat: 52.5200, lng: -1.1743 }}
                      initialZoom={10}
                      onMapReady={handleMapReady}
                      className="w-full h-[600px]"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">How to use:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Select "Draw PV Area" and click on the map to place points (minimum 3 points)</li>
                        <li>A green polygon will appear as you place the 3rd point</li>
                        <li>Select "Draw Cable Route" and click to place points (minimum 2 points)</li>
                        <li>A blue polyline will appear as you place the 2nd point</li>
                        <li>Green markers = PV area, Blue markers = Cable route</li>
                        <li>Use "Undo Point" to remove the last point</li>
                        <li>Use "Clear All" to reset and start over</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4">
                {/* PV Area Results */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      PV Area
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.pvPoints.length > 0 ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Points Placed</p>
                          <p className="text-lg font-semibold">{state.pvPoints.length}</p>
                        </div>
                        {pvAreaResults && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Area (m²)</p>
                              <p className="text-lg font-semibold">
                                {pvAreaResults.area.toLocaleString("en-GB", {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Area (hectares)</p>
                              <p className="text-lg font-semibold">
                                {pvAreaResults.hectares.toFixed(2)}
                              </p>
                            </div>
                            <div className="border-t pt-3">
                              <p className="text-xs text-muted-foreground">Estimated System Size</p>
                              <p className="text-lg font-semibold text-green-600">
                                {pvAreaResults.systemSize.toFixed(2)} MW
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">@ 0.5 MW/hectare</p>
                              <Button size="sm" className="w-full mt-3" variant="default">
                                <Check className="w-4 h-4 mr-2" />
                                Apply to Calculator
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click on the map to place points (min 3)
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Cable Route Results */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Cable Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.cablePoints.length > 0 ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Points Placed</p>
                          <p className="text-lg font-semibold">{state.cablePoints.length}</p>
                        </div>
                        {cableResults && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Distance (km)</p>
                              <p className="text-lg font-semibold">
                                {cableResults.distance.toFixed(2)}
                              </p>
                            </div>
                            <div className="border-t pt-3">
                              <Button size="sm" className="w-full" variant="default">
                                <Check className="w-4 h-4 mr-2" />
                                Apply to Calculator
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click on the map to place points (min 2)
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PV Area:</span>
                      <span className={state.pvPolygon ? "text-green-600 font-semibold" : "text-gray-400"}>
                        {state.pvPolygon ? "✓ Drawn" : state.pvPoints.length > 0 ? `${state.pvPoints.length} pts` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cable Route:</span>
                      <span className={state.cablePolyline ? "text-green-600 font-semibold" : "text-gray-400"}>
                        {state.cablePolyline ? "✓ Drawn" : state.cablePoints.length > 0 ? `${state.cablePoints.length} pts` : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Map Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Map is centered on the UK Midlands. Use the map controls to zoom and pan to your site location.
                    </p>
                    <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                      <p>
                        <strong>Zoom:</strong> Use scroll wheel or zoom controls
                      </p>
                      <p>
                        <strong>Pan:</strong> Click and drag the map
                      </p>
                      <p>
                        <strong>Satellite:</strong> Toggle in top-right corner
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
