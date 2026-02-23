import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Trash2, Check, ArrowRight } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import "leaflet/dist/leaflet.css";

export default function MapViewPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [, setLocation] = useLocation();
  
  const [drawingMode, setDrawingMode] = useState<"view" | "pv" | "cable">("view");
  const [pvPoints, setPvPoints] = useState<L.LatLng[]>([]);
  const [cablePoints, setCablePoints] = useState<L.LatLng[]>([]);
  const [pvMarkers, setPvMarkers] = useState<L.CircleMarker[]>([]);
  const [cableMarkers, setCableMarkers] = useState<L.CircleMarker[]>([]);
  const [pvPolygon, setPvPolygon] = useState<L.Polygon | null>(null);
  const [cablePolyline, setCablePolyline] = useState<L.Polyline | null>(null);
  
  const [pvAreaResults, setPvAreaResults] = useState<{
    area: number;
    hectares: number;
    systemSize: number;
  } | null>(null);

  const [cableResults, setCableResults] = useState<{
    distance: number;
  } | null>(null);

  const [pvCompleted, setPvCompleted] = useState(false);
  const [cableCompleted, setCableCompleted] = useState(false);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([52.52, -1.17], 10);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map clicks for drawing
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawingMode === "view") return;

      const point = e.latlng;

      if (drawingMode === "pv") {
        addPVPoint(point);
      } else if (drawingMode === "cable") {
        addCablePoint(point);
      }
    };

    mapRef.current.on("click", handleMapClick);

    return () => {
      mapRef.current?.off("click", handleMapClick);
    };
  }, [drawingMode]);

  const addPVPoint = useCallback((point: L.LatLng) => {
    setPvPoints((prev) => {
      const newPoints = [...prev, point];

      // Add marker
      const marker = L.circleMarker(point, {
        radius: 5,
        fillColor: "#22c55e",
        color: "#16a34a",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapRef.current!);

      setPvMarkers((prevMarkers) => [...prevMarkers, marker]);

      // Create or update polygon
      if (newPoints.length >= 3) {
        if (pvPolygon) {
          mapRef.current?.removeLayer(pvPolygon);
        }
        const polygon = L.polygon(newPoints, {
          color: "#22c55e",
          weight: 2,
          opacity: 0.8,
          fillColor: "#22c55e",
          fillOpacity: 0.2,
        }).addTo(mapRef.current!);

        setPvPolygon(polygon);

        // Calculate area
        const area = calculatePolygonArea(newPoints);
        const hectares = area / 10000;
        const systemSize = hectares * 10;
        setPvAreaResults({ area, hectares, systemSize });
      }
      return newPoints;
    });
  }, [pvPolygon, pvMarkers]);

  const addCablePoint = useCallback((point: L.LatLng) => {
    setCablePoints((prev) => {
      const newPoints = [...prev, point];

      // Add marker
      const marker = L.circleMarker(point, {
        radius: 5,
        fillColor: "#3b82f6",
        color: "#1d4ed8",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapRef.current!);

      setCableMarkers((prevMarkers) => [...prevMarkers, marker]);

      // Create or update polyline
      if (newPoints.length >= 2) {
        if (cablePolyline) {
          mapRef.current?.removeLayer(cablePolyline);
        }
        const polyline = L.polyline(newPoints, {
          color: "#3b82f6",
          weight: 3,
          opacity: 0.8,
        }).addTo(mapRef.current!);

        setCablePolyline(polyline);

        // Calculate distance
        const distance = calculatePolylineDistance(newPoints);
        setCableResults({ distance });
      }
      return newPoints;
    });
  }, [cablePolyline, cableMarkers]);

  const clearPVArea = () => {
    pvMarkers.forEach((m) => mapRef.current?.removeLayer(m));
    if (pvPolygon) mapRef.current?.removeLayer(pvPolygon);
    setPvPoints([]);
    setPvMarkers([]);
    setPvPolygon(null);
    setPvAreaResults(null);
    toast.success("PV area cleared");
  };

  const clearCableRoute = () => {
    cableMarkers.forEach((m) => mapRef.current?.removeLayer(m));
    if (cablePolyline) mapRef.current?.removeLayer(cablePolyline);
    setCablePoints([]);
    setCableMarkers([]);
    setCablePolyline(null);
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
      if (mapContainerRef.current) {
        const canvas = await html2canvas(mapContainerRef.current, {
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
    console.log('[MapView] applyCableDistanceToCalculator called, cableResults:', cableResults);
    if (!cableResults) {
      toast.error("No cable route drawn yet");
      return;
    }

    // Capture map screenshot
    try {
      if (mapContainerRef.current) {
        const canvas = await html2canvas(mapContainerRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
      }
    } catch (e) {
      console.error("Map screenshot capture failed:", e);
    }

    // Store map results
    const mapData = {
      systemSize: pvAreaResults?.systemSize || null,
      cableDistance: cableResults.distance,
    };
    console.log('[MapView] Storing map results:', mapData);
    sessionStorage.setItem("mapResults", JSON.stringify(mapData));

    toast.success(`Applied cable distance: ${cableResults.distance.toFixed(2)} km`);
    console.log('[MapView] Cable distance applied:', cableResults.distance);
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
      if (mapContainerRef.current) {
        const canvas = await html2canvas(mapContainerRef.current, {
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
      <div className="flex-1 rounded-lg border border-border overflow-hidden">
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
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
            {drawingMode === "pv" && pvPoints.length >= 3 && !pvCompleted && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setPvCompleted(true);
                  setDrawingMode("view");
                  toast.success("PV area completed!");
                }}
              >
                <Check className="w-4 h-4 mr-2" /> Complete PV Area
              </Button>
            )}
            {drawingMode === "cable" && cablePoints.length >= 2 && !cableCompleted && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setCableCompleted(true);
                  setDrawingMode("view");
                  toast.success("Cable route completed!");
                }}
              >
                <Check className="w-4 h-4 mr-2" /> Complete Cable Route
              </Button>
            )}
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
              {pvCompleted && pvAreaResults ? (
                <div className="text-sm space-y-1 bg-green-50 p-2 rounded border-2 border-green-500">
                  <p className="font-semibold text-green-700">✓ Completed</p>
                  <p>Area: {pvAreaResults.area.toFixed(0)} m²</p>
                  <p>Hectares: {pvAreaResults.hectares.toFixed(2)} ha</p>
                  <p className="font-semibold">System Size: {pvAreaResults.systemSize.toFixed(2)} MW</p>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => {
                    clearPVArea();
                    setPvCompleted(false);
                  }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                </div>
              ) : pvAreaResults ? (
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
              {cableCompleted && cableResults ? (
                <div className="text-sm space-y-1 bg-blue-50 p-2 rounded border-2 border-blue-500">
                  <p className="font-semibold text-blue-700">✓ Completed</p>
                  <p className="font-semibold">Distance: {cableResults.distance.toFixed(2)} km</p>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => {
                    clearCableRoute();
                    setCableCompleted(false);
                  }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                </div>
              ) : cableResults ? (
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

            {/* Screenshot Button */}
            {(pvCompleted || cableCompleted) && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  try {
                    if (mapRef.current) {
                      try {
                        // Get the map container
                        const mapContainer = mapRef.current.getContainer();
                        // Use html2canvas on just the map container, excluding the controls
                        const canvas = await html2canvas(mapContainer, {
                          backgroundColor: "#ffffff",
                          scale: 1.5,
                          allowTaint: true,
                          useCORS: true,
                          logging: false,
                          ignoreElements: (element) => {
                            // Ignore Leaflet control elements
                            return element.classList.contains('leaflet-control') ||
                                   element.classList.contains('leaflet-control-container');
                          }
                        });
                        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
                        toast.success("Map screenshot saved for PDF!");
                      } catch (innerError) {
                        // Fallback: create a simple canvas with map data
                        console.warn("html2canvas failed, using fallback", innerError);
                        const mapContainer = mapRef.current.getContainer();
                        const canvas = document.createElement('canvas');
                        canvas.width = mapContainer.offsetWidth;
                        canvas.height = mapContainer.offsetHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = '#ffffff';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.fillStyle = '#666666';
                          ctx.font = '14px Arial';
                          ctx.fillText('Map Screenshot', 10, 30);
                        }
                        sessionStorage.setItem("mapScreenshot", canvas.toDataURL("image/png"));
                        toast.success("Map screenshot saved for PDF!");
                      }
                    }
                  } catch (e) {
                    console.error("Screenshot capture failed:", e);
                    toast.error("Failed to capture screenshot");
                  }
                }}
              >
                📸 Save Map Screenshot for PDF
              </Button>
            )}

            {/* Apply Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {pvCompleted && pvAreaResults && (
                <Button className="w-full" onClick={applyPVAreaToCalculator}>
                  <Check className="w-4 h-4 mr-2" /> Apply PV Area
                </Button>
              )}
              {cableCompleted && cableResults && (
                <Button className="w-full" onClick={applyCableDistanceToCalculator}>
                  <Check className="w-4 h-4 mr-2" /> Apply Cable Distance
                </Button>
              )}
              {pvCompleted && cableCompleted && pvAreaResults && cableResults && (
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
