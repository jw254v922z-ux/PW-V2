import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Trash2, Check, ArrowRight } from "lucide-react";
import { calculatePolygonArea, calculatePolylineDistance } from "@/lib/geospatial";
import { toast } from "sonner";
import { captureMapWithDomToImage } from '@/lib/domToImageCapture';
import domtoimage from 'dom-to-image-more';
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
  const [mapStyle, setMapStyle] = useState<'light' | 'grayscale' | 'satellite'>('light');
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  // Don't clear screenshot when entering drawing mode - only clear when explicitly clearing the polygon
  // This prevents the screenshot from disappearing before the new one is saved

  // Initialize map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([52.52, -1.17], 10);
    
    // Expose map instance globally for leaflet-image capture
    (window as any).leafletMap = map;

    // Add initial tile layer
    const layer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    mapRef.current = map;
    setTileLayer(layer);

    return () => {
      map.remove();
      mapRef.current = null;
      (window as any).leafletMap = null;
    };
  }, []);

  // Handle map style changes
  useEffect(() => {
    if (!mapRef.current || !tileLayer) return;

    mapRef.current.removeLayer(tileLayer);

    let newUrl: string;
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>';

    switch (mapStyle) {
      case 'grayscale':
        newUrl = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
        break;
      case 'satellite':
        newUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = '&copy; <a href="https://www.arcgisonline.com/">Esri</a>';
        break;
      case 'light':
      default:
        newUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    }

    const newLayer = L.tileLayer(newUrl, {
      attribution,
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(mapRef.current);

    setTileLayer(newLayer);
  }, [mapStyle]);

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

  // Finalize polygon when pvCompleted becomes true
  useEffect(() => {
    if (!pvCompleted || pvPoints.length < 3 || !mapRef.current) return;

    // Remove old polygon if exists
    if (pvPolygon) {
      mapRef.current.removeLayer(pvPolygon);
    }

    // Create final polygon
    const polygon = L.polygon(pvPoints, {
      color: "#22c55e",
      weight: 2,
      opacity: 0.8,
      fillColor: "#22c55e",
      fillOpacity: 0.2,
    }).addTo(mapRef.current);

    setPvPolygon(polygon);

    // Calculate area
    const area = calculatePolygonArea(pvPoints);
    const hectares = area / 10000;
    const systemSize = hectares * 10;
    setPvAreaResults({ area, hectares, systemSize });

    // Save polygon coordinates to sessionStorage for report page
    const polygonData = pvPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    sessionStorage.setItem('pvPolygonData', JSON.stringify(polygonData));
    console.log('[MapView] Saved PV polygon data to sessionStorage:', polygonData.length, 'points');
  }, [pvCompleted, pvPoints]);

  const addPVPoint = useCallback((point: L.LatLng) => {
    setPvPoints((prev) => {
      // Check if user clicked on first point to close polygon
      if (prev.length >= 3) {
        const firstPoint = prev[0];
        const distance = point.distanceTo(firstPoint);
        const closeThreshold = 30; // meters

        if (distance < closeThreshold) {
          // Close the polygon
          setPvCompleted(true);
          setDrawingMode("view");
          toast.success("PV area completed! Polygon closed.");
          return prev; // Don't add duplicate point
        }
      }

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

      // Show preview polyline while drawing (not a closed polygon yet)
      // Only create actual polygon when explicitly closed by clicking first point
      // This is handled in the setPvCompleted state change effect below
      return newPoints;
    });
  }, [pvPolygon, pvMarkers]);

  const addCablePoint = useCallback((point: L.LatLng) => {
    setCablePoints((prev) => {
      // Check if user clicked on first point to end cable route
      if (prev.length >= 2) {
        const firstPoint = prev[0];
        const distance = point.distanceTo(firstPoint);
        const closeThreshold = 30; // meters

        if (distance < closeThreshold) {
          // End the cable route
          setCableCompleted(true);
          setDrawingMode("view");
          toast.success("Cable route completed! Route closed.");
          return prev; // Don't add duplicate point
        }
      }

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

        // Save cable polyline coordinates to sessionStorage for report page
        const polylineData = newPoints.map(p => ({ lat: p.lat, lng: p.lng }));
        sessionStorage.setItem('cablePolylineData', JSON.stringify(polylineData));
        console.log('[MapView] Saved cable polyline data to sessionStorage:', polylineData.length, 'points');
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
    setPvCompleted(false);
    // Clear old screenshot
    sessionStorage.removeItem('mapScreenshot');
    
    // Recapture map screenshot
    setTimeout(async () => {
      try {
        const mapContainer = mapContainerRef.current;
        if (mapContainer) {
          const dataUrl = await domtoimage.toPng(mapContainer, {
            quality: 0.95,
            cacheBust: true,
          });
          sessionStorage.setItem('mapScreenshot', dataUrl);
          console.log('[MapView] Map screenshot updated after clearing PV area');
        }
      } catch (error) {
        console.error('[MapView] Failed to recapture map:', error);
      }
    }, 300);
    
    toast.success("PV area cleared");
  };

  const clearCableRoute = () => {
    cableMarkers.forEach((m) => mapRef.current?.removeLayer(m));
    if (cablePolyline) mapRef.current?.removeLayer(cablePolyline);
    setCablePoints([]);
    setCableMarkers([]);
    setCablePolyline(null);
    setCableResults(null);
    setCableCompleted(false);
    // Clear old screenshot
    sessionStorage.removeItem('mapScreenshot');
    
    // Recapture map screenshot
    setTimeout(async () => {
      try {
        const mapContainer = mapContainerRef.current;
        if (mapContainer) {
          const dataUrl = await domtoimage.toPng(mapContainer, {
            quality: 0.95,
            cacheBust: true,
          });
          sessionStorage.setItem('mapScreenshot', dataUrl);
          console.log('[MapView] Map screenshot updated after clearing cable route');
        }
      } catch (error) {
        console.error('[MapView] Failed to recapture map:', error);
      }
    }, 300);
    
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
        const dataUrl = await captureMapWithDomToImage(mapContainerRef.current);
        sessionStorage.setItem("mapScreenshot", dataUrl);
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
        const dataUrl = await captureMapWithDomToImage(mapContainerRef.current);
        sessionStorage.setItem("mapScreenshot", dataUrl);
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
        const dataUrl = await captureMapWithDomToImage(mapContainerRef.current);
        sessionStorage.setItem("mapScreenshot", dataUrl);
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
          <CardContent className="space-y-3">
            {/* Map Style Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Map Style</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mapStyle === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMapStyle('light')}
                  className="text-xs"
                >
                  Light
                </Button>
                <Button
                  variant={mapStyle === 'grayscale' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMapStyle('grayscale')}
                  className="text-xs"
                >
                  Grayscale
                </Button>
                <Button
                  variant={mapStyle === 'satellite' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMapStyle('satellite')}
                  className="text-xs"
                >
                  Satellite
                </Button>
              </div>
            </div>
            <div className="border-t pt-2" />
            <Button
              variant={drawingMode === "view" ? "default" : "outline"}
              className="w-full mt-2"
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
                onClick={async () => {
                  setPvCompleted(true);
                  setDrawingMode("view");
                  toast.success("PV area completed!");
                  
                  // Automatically capture map screenshot
                  setTimeout(async () => {
                    try {
                      const mapContainer = mapContainerRef.current;
                      if (!mapContainer) {
                        console.error('[MapView] Map container not found');
                        return;
                      }
                      
                      const dataUrl = await domtoimage.toPng(mapContainer, {
                        quality: 0.95,
                        cacheBust: true,
                      });
                      sessionStorage.setItem('mapScreenshot', dataUrl);
                      console.log('[MapView] Map screenshot saved automatically:', dataUrl.length, 'characters');
                      toast.success('Map screenshot saved for report!');
                    } catch (error) {
                      console.error('[MapView] Failed to capture map:', error);
                    }
                  }, 500); // Wait for polygon to render
                }}
              >
                <Check className="w-4 h-4 mr-2" /> Complete PV Area
              </Button>
            )}
            {drawingMode === "cable" && cablePoints.length >= 2 && !cableCompleted && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  setCableCompleted(true);
                  setDrawingMode("view");
                  toast.success("Cable route completed!");
                  
                  // Automatically capture map screenshot
                  setTimeout(async () => {
                    try {
                      const mapContainer = mapContainerRef.current;
                      if (!mapContainer) {
                        console.error('[MapView] Map container not found');
                        return;
                      }
                      
                      const dataUrl = await domtoimage.toPng(mapContainer, {
                        quality: 0.95,
                        cacheBust: true,
                      });
                      sessionStorage.setItem('mapScreenshot', dataUrl);
                      console.log('[MapView] Map screenshot saved automatically:', dataUrl.length, 'characters');
                      toast.success('Map screenshot saved for report!');
                    } catch (error) {
                      console.error('[MapView] Failed to capture map:', error);
                    }
                  }, 500); // Wait for polyline to render
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
                    if (mapContainerRef.current) {
                      try {
                        // Use dom-to-image to capture the map container with better SVG support for polygons
                        const dataUrl = await captureMapWithDomToImage(mapContainerRef.current);
                        sessionStorage.setItem("mapScreenshot", dataUrl);
                        console.log('[MapView] Map screenshot saved to sessionStorage, length:', dataUrl.length);
                        toast.success("Map screenshot saved for PDF!");
                      } catch (error) {
                        console.error("Map capture failed:", error);
                        toast.error("Failed to capture map screenshot");
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
