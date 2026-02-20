import { useRef, useState, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, Zap, Maximize2, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";

interface MapDrawing {
  pvArea: google.maps.Polygon | null;
  cableRoute: google.maps.Polyline | null;
  pvPoints: google.maps.LatLngLiteral[];
  cablePoints: google.maps.LatLngLiteral[];
  pvMarkers: google.maps.marker.AdvancedMarkerElement[];
  cableMarkers: google.maps.marker.AdvancedMarkerElement[];
}

export default function MapViewPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<"view" | "pv" | "cable">("view");
  const [drawings, setDrawings] = useState<MapDrawing>({
    pvArea: null,
    cableRoute: null,
    pvPoints: [],
    cablePoints: [],
    pvMarkers: [],
    cableMarkers: [],
  });
  const [pvAreaResults, setPvAreaResults] = useState<{
    area: number; // m²
    hectares: number;
  } | null>(null);
  const [cableRouteResults, setCableRouteResults] = useState<{
    distance: number; // km
  } | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // Add click listener based on drawing mode
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous listener
    if (mapClickListenerRef.current) {
      mapClickListenerRef.current.remove();
      mapClickListenerRef.current = null;
    }

    if (drawingMode === "view") return;

    // Add new listener for drawing
    mapClickListenerRef.current = mapRef.current.addListener(
      "click",
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;

        const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };

        if (drawingMode === "pv") {
          addPVPoint(point);
        } else if (drawingMode === "cable") {
          addCablePoint(point);
        }
      }
    );

    return () => {
      if (mapClickListenerRef.current) {
        mapClickListenerRef.current.remove();
        mapClickListenerRef.current = null;
      }
    };
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
    const newPoints = [...drawings.pvPoints, point];
    const marker = await createMarker(point, "#22c55e"); // Green

    setDrawings((prev) => ({
      ...prev,
      pvPoints: newPoints,
      pvMarkers: marker ? [...prev.pvMarkers, marker] : prev.pvMarkers,
    }));

    // Redraw polygon if we have 3+ points
    if (newPoints.length >= 3) {
      redrawPVPolygon(newPoints);
      const areaM2 = calculatePolygonArea(newPoints);
      setPvAreaResults({
        area: areaM2,
        hectares: areaM2 / 10000,
      });
    }
  };

  const addCablePoint = async (point: google.maps.LatLngLiteral) => {
    const newPoints = [...drawings.cablePoints, point];
    const marker = await createMarker(point, "#3b82f6"); // Blue

    setDrawings((prev) => ({
      ...prev,
      cablePoints: newPoints,
      cableMarkers: marker ? [...prev.cableMarkers, marker] : prev.cableMarkers,
    }));

    // Redraw polyline if we have 2+ points
    if (newPoints.length >= 2) {
      redrawCablePolyline(newPoints);
      const distanceKm = calculatePolylineDistance(newPoints);
      setCableRouteResults({
        distance: distanceKm,
      });
    }
  };

  const redrawPVPolygon = (points: google.maps.LatLngLiteral[]) => {
    if (!mapRef.current) return;

    // Remove old polygon
    if (drawings.pvArea) {
      drawings.pvArea.setMap(null);
    }

    // Create new polygon
    const polygon = new google.maps.Polygon({
      paths: points,
      strokeColor: "#22c55e",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.2,
      map: mapRef.current,
      editable: false,
    });

    setDrawings((prev) => ({
      ...prev,
      pvArea: polygon,
    }));
  };

  const redrawCablePolyline = (points: google.maps.LatLngLiteral[]) => {
    if (!mapRef.current) return;

    // Remove old polyline
    if (drawings.cableRoute) {
      drawings.cableRoute.setMap(null);
    }

    // Create new polyline
    const polyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapRef.current,
    });

    setDrawings((prev) => ({
      ...prev,
      cableRoute: polyline,
    }));
  };

  const undoLastPoint = () => {
    if (drawingMode === "pv" && drawings.pvPoints.length > 0) {
      const newPoints = drawings.pvPoints.slice(0, -1);
      const newMarkers = drawings.pvMarkers.slice(0, -1);

      // Remove last marker from map
      if (drawings.pvMarkers.length > 0) {
        drawings.pvMarkers[drawings.pvMarkers.length - 1].map = null;
      }

      setDrawings((prev) => ({
        ...prev,
        pvPoints: newPoints,
        pvMarkers: newMarkers,
      }));

      if (newPoints.length >= 3) {
        redrawPVPolygon(newPoints);
      } else if (drawings.pvArea) {
        drawings.pvArea.setMap(null);
        setDrawings((prev) => ({
          ...prev,
          pvArea: null,
        }));
      }
    } else if (drawingMode === "cable" && drawings.cablePoints.length > 0) {
      const newPoints = drawings.cablePoints.slice(0, -1);
      const newMarkers = drawings.cableMarkers.slice(0, -1);

      // Remove last marker from map
      if (drawings.cableMarkers.length > 0) {
        drawings.cableMarkers[drawings.cableMarkers.length - 1].map = null;
      }

      setDrawings((prev) => ({
        ...prev,
        cablePoints: newPoints,
        cableMarkers: newMarkers,
      }));

      if (newPoints.length >= 2) {
        redrawCablePolyline(newPoints);
      } else if (drawings.cableRoute) {
        drawings.cableRoute.setMap(null);
        setDrawings((prev) => ({
          ...prev,
          cableRoute: null,
        }));
      }
    }
  };

  const clearDrawings = () => {
    // Clear polygons and polylines
    if (drawings.pvArea) {
      drawings.pvArea.setMap(null);
    }
    if (drawings.cableRoute) {
      drawings.cableRoute.setMap(null);
    }

    // Clear all markers
    drawings.pvMarkers.forEach((marker) => {
      marker.map = null;
    });
    drawings.cableMarkers.forEach((marker) => {
      marker.map = null;
    });

    setDrawings({
      pvArea: null,
      cableRoute: null,
      pvPoints: [],
      cablePoints: [],
      pvMarkers: [],
      cableMarkers: [],
    });
    setPvAreaResults(null);
    setCableRouteResults(null);
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
                  {drawingMode === "pv" && "Click points on the map to draw your PV area polygon"}
                  {drawingMode === "cable" && "Click points on the map to draw your cable route"}
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
                      disabled={drawings.pvPoints.length === 0 && drawings.cablePoints.length === 0}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Undo Point
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={clearDrawings}
                      disabled={!drawings.pvArea && !drawings.cableRoute}
                      className="gap-2 ml-auto"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear All
                    </Button>
                  </div>

                  {/* Map Container */}
                  <div className="rounded-lg border overflow-hidden">
                    <MapView
                      initialCenter={{ lat: 52.5200, lng: -1.1743 }} // UK center (Midlands)
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
                        <li>Select "Draw Cable Route" and click to place points (minimum 2 points)</li>
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
                    {drawings.pvPoints.length > 0 ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Points Placed</p>
                          <p className="text-lg font-semibold">{drawings.pvPoints.length}</p>
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
                    {drawings.cablePoints.length > 0 ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Points Placed</p>
                          <p className="text-lg font-semibold">{drawings.cablePoints.length}</p>
                        </div>
                        {cableRouteResults && (
                          <div>
                            <p className="text-xs text-muted-foreground">Distance (km)</p>
                            <p className="text-lg font-semibold">
                              {cableRouteResults.distance.toFixed(2)}
                            </p>
                          </div>
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
                      <span className={drawings.pvArea ? "text-green-600 font-semibold" : "text-gray-400"}>
                        {drawings.pvArea ? "✓ Drawn" : drawings.pvPoints.length > 0 ? `${drawings.pvPoints.length} pts` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cable Route:</span>
                      <span className={drawings.cableRoute ? "text-green-600 font-semibold" : "text-gray-400"}>
                        {drawings.cableRoute ? "✓ Drawn" : drawings.cablePoints.length > 0 ? `${drawings.cablePoints.length} pts` : "—"}
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
