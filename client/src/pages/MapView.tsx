import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Trash2, Check, ArrowRight } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
      // Don't destroy map on unmount to preserve state
    };
  }, []);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (drawingMode === "view") return;

      const latlng = e.latlng;

      if (drawingMode === "pv") {
        // Check if close to first point to close polygon
        if (pvPoints.length >= 3) {
          const firstPoint = pvPoints[0];
          const distance = firstPoint.distanceTo(latlng);
          if (distance < 20) {
            // Close the polygon
            completePVArea();
            return;
          }
        }

        setPvPoints([...pvPoints, latlng]);

        // Add marker
        if (mapRef.current) {
          const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: "#4CAF50",
            color: "#2E7D32",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(mapRef.current);

          setPvMarkers([...pvMarkers, marker]);

          // Draw line from last point to this point
          if (pvPoints.length > 0) {
            L.polyline([pvPoints[pvPoints.length - 1], latlng], {
              color: "#4CAF50",
              weight: 2,
              opacity: 0.7,
            }).addTo(mapRef.current);
          }
        }
      } else if (drawingMode === "cable") {
        // Check if close to first point to close polyline
        if (cablePoints.length >= 2) {
          const firstPoint = cablePoints[0];
          const distance = firstPoint.distanceTo(latlng);
          if (distance < 20) {
            // Close the polyline
            completeCableRoute();
            return;
          }
        }

        setCablePoints([...cablePoints, latlng]);

        // Add marker
        if (mapRef.current) {
          const marker = L.circleMarker(latlng, {
            radius: 5,
            fillColor: "#2196F3",
            color: "#1565C0",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(mapRef.current);

          setCableMarkers([...cableMarkers, marker]);

          // Draw line from last point to this point
          if (cablePoints.length > 0) {
            L.polyline([cablePoints[cablePoints.length - 1], latlng], {
              color: "#2196F3",
              weight: 2,
              opacity: 0.7,
            }).addTo(mapRef.current);
          }
        }
      }
    },
    [drawingMode, pvPoints, cablePoints, pvMarkers, cableMarkers]
  );

  const completePVArea = useCallback(() => {
    if (pvPoints.length < 3 || !mapRef.current) return;

    // Create polygon
    const polygon = L.polygon(pvPoints, {
      color: "#4CAF50",
      weight: 2,
      opacity: 0.7,
      fillColor: "#4CAF50",
      fillOpacity: 0.2,
    }).addTo(mapRef.current);

    setPvPolygon(polygon);

    // Calculate area
    const area = calculatePolygonArea(pvPoints);
    const hectares = area / 10000;
    const systemSize = (area / 10000) * 0.6; // 0.6 MW per hectare

    setPvAreaResults({
      area,
      hectares,
      systemSize,
    });

    setPvCompleted(true);
    setDrawingMode("view");
    toast.success("PV Area completed!");
  }, [pvPoints]);

  const completeCableRoute = useCallback(() => {
    if (cablePoints.length < 2 || !mapRef.current) return;

    // Create polyline
    const polyline = L.polyline(cablePoints, {
      color: "#2196F3",
      weight: 3,
      opacity: 0.8,
    }).addTo(mapRef.current);

    setCablePolyline(polyline);

    // Calculate distance
    const distance = calculatePolylineDistance(cablePoints);

    setCableResults({
      distance,
    });

    setCableCompleted(true);
    setDrawingMode("view");
    toast.success("Cable Route completed!");
  }, [cablePoints]);

  const resetPVArea = useCallback(() => {
    if (mapRef.current && pvPolygon) {
      mapRef.current.removeLayer(pvPolygon);
    }
    pvMarkers.forEach((marker) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    setPvPoints([]);
    setPvMarkers([]);
    setPvPolygon(null);
    setPvAreaResults(null);
    setPvCompleted(false);
    setDrawingMode("view");
    toast.info("PV Area reset");
  }, [pvPolygon, pvMarkers]);

  const resetCableRoute = useCallback(() => {
    if (mapRef.current && cablePolyline) {
      mapRef.current.removeLayer(cablePolyline);
    }
    cableMarkers.forEach((marker) => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    setCablePoints([]);
    setCableMarkers([]);
    setCablePolyline(null);
    setCableResults(null);
    setCableCompleted(false);
    setDrawingMode("view");
    toast.info("Cable Route reset");
  }, [cablePolyline, cableMarkers]);

  const applyPVAreaToCalculator = useCallback(() => {
    if (!pvAreaResults) return;
    sessionStorage.setItem(
      "pvAreaData",
      JSON.stringify({
        area: pvAreaResults.area,
        hectares: pvAreaResults.hectares,
        systemSize: pvAreaResults.systemSize,
      })
    );
    setLocation("/");
    toast.success("PV Area applied to calculator!");
  }, [pvAreaResults, setLocation]);

  const applyCableRouteToCalculator = useCallback(() => {
    if (!cableResults) return;
    sessionStorage.setItem(
      "cableRouteData",
      JSON.stringify({
        distance: cableResults.distance,
      })
    );
    setLocation("/");
    toast.success("Cable Route applied to calculator!");
  }, [cableResults, setLocation]);

  // Attach click handler to map
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.on("click", handleMapClick);
    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [handleMapClick]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Site Mapping</h1>
          <p className="text-slate-600">Draw PV area and cable route on the map</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <div
                ref={mapContainerRef}
                data-map-container
                className="w-full h-full"
                style={{ position: "relative" }}
              />
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Drawing Mode Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Drawing Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={drawingMode === "pv" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    if (pvCompleted) {
                      toast.info("PV Area already completed. Reset to draw again.");
                    } else {
                      setDrawingMode("pv");
                      toast.info("Click on map to draw PV area (min 3 points)");
                    }
                  }}
                >
                  🟢 Draw PV Area
                </Button>
                <Button
                  variant={drawingMode === "cable" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    if (cableCompleted) {
                      toast.info("Cable Route already completed. Reset to draw again.");
                    } else {
                      setDrawingMode("cable");
                      toast.info("Click on map to draw cable route (min 2 points)");
                    }
                  }}
                >
                  🔵 Draw Cable Route
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDrawingMode("view")}
                >
                  👁️ View Mode
                </Button>
              </CardContent>
            </Card>

            {/* PV Area Results */}
            {pvAreaResults && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-900">PV Area</CardTitle>
                    <Badge className="bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-green-700 font-semibold">
                      {pvAreaResults.hectares.toFixed(2)} hectares
                    </p>
                    <p className="text-green-600 text-xs">Area</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-semibold">
                      {pvAreaResults.systemSize.toFixed(2)} MW
                    </p>
                    <p className="text-green-600 text-xs">System Size</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cable Route Results */}
            {cableResults && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-blue-900">Cable Route</CardTitle>
                    <Badge className="bg-blue-600">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-blue-700 font-semibold">
                      {cableResults.distance.toFixed(3)} km
                    </p>
                    <p className="text-blue-600 text-xs">Distance</p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                          scale: 2,
                          allowTaint: true,
                          useCORS: true,
                          logging: false,
                          ignoreElements: (element) => {
                            // Ignore Leaflet control elements
                            return element.classList.contains('leaflet-control') ||
                                   element.classList.contains('leaflet-control-container');
                          }
                        });
                        const dataUrl = canvas.toDataURL("image/png");
                        sessionStorage.setItem("mapScreenshot", dataUrl);
                        console.log("Map screenshot captured, size:", dataUrl.length);
                        toast.success("Map screenshot saved for report!");
                      } catch (innerError) {
                        // Fallback: Create a canvas with map info
                        console.warn("html2canvas failed, using fallback", innerError);
                        const mapContainer = mapRef.current.getContainer();
                        const canvas = document.createElement('canvas');
                        canvas.width = mapContainer.offsetWidth;
                        canvas.height = mapContainer.offsetHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          // Draw light gray background
                          ctx.fillStyle = '#f5f5f5';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          
                          // Draw border
                          ctx.strokeStyle = '#cccccc';
                          ctx.lineWidth = 2;
                          ctx.strokeRect(0, 0, canvas.width, canvas.height);
                          
                          // Draw title
                          ctx.fillStyle = '#333333';
                          ctx.font = 'bold 18px Arial';
                          ctx.fillText('Site Map', 20, 40);
                          
                          // Draw site information
                          ctx.font = '14px Arial';
                          ctx.fillStyle = '#666666';
                          let yPos = 80;
                          
                          if (pvCompleted && pvAreaResults) {
                            ctx.fillText(`✓ PV Area: ${pvAreaResults.hectares.toFixed(2)} hectares`, 20, yPos);
                            ctx.fillText(`  System Size: ${pvAreaResults.systemSize.toFixed(2)} MW`, 20, yPos + 25);
                            yPos += 60;
                          }
                          
                          if (cableCompleted && cableResults) {
                            ctx.fillText(`✓ Cable Route: ${cableResults.distance.toFixed(3)} km`, 20, yPos);
                          }
                        }
                        const dataUrl = canvas.toDataURL("image/png");
                        sessionStorage.setItem("mapScreenshot", dataUrl);
                        console.log("Fallback screenshot created, size:", dataUrl.length);
                        toast.success("Map screenshot saved for report!");
                      }
                    }
                  } catch (e) {
                    console.error("Screenshot capture failed:", e);
                    toast.error("Failed to capture screenshot");
                  }
                }}
              >
                📸 Take Screenshot for Report
              </Button>
            )}

            {/* Apply Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {pvCompleted && pvAreaResults && (
                <Button className="w-full" onClick={applyPVAreaToCalculator}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Apply PV Area
                </Button>
              )}
              {cableCompleted && cableResults && (
                <Button className="w-full" onClick={applyCableRouteToCalculator}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Apply Cable Route
                </Button>
              )}
            </div>

            {/* Reset Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {pvCompleted && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={resetPVArea}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset PV Area
                </Button>
              )}
              {cableCompleted && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={resetCableRoute}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Cable Route
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
