/**
 * Geospatial calculation utilities for map-based features
 */

/**
 * Calculate the area of a polygon using the Shoelace formula
 * Works with lat/lng coordinates
 * @param points Array of {lat, lng} points forming a closed polygon
 * @returns Area in square meters
 */
export function calculatePolygonArea(
  points: google.maps.LatLngLiteral[]
): number {
  if (points.length < 3) return 0;

  // Earth's radius in meters
  const R = 6371000;

  // Convert to radians and calculate area using spherical excess
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    // Convert to radians
    const lat1 = (p1.lat * Math.PI) / 180;
    const lng1 = (p1.lng * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lng2 = (p2.lng * Math.PI) / 180;

    // Calculate spherical excess
    const dLng = lng2 - lng1;
    const E =
      2 *
      Math.atan2(
        Math.tan(dLng / 2) * (Math.tan(lat1 / 2) + Math.tan(lat2 / 2)),
        1 + Math.tan(lat1 / 2) * Math.tan(lat2 / 2)
      );

    area += E;
  }

  // Apply Earth's radius squared
  area = Math.abs(area) * R * R;

  return area;
}

/**
 * Calculate the distance between two points using Haversine formula
 * @param point1 Starting point {lat, lng}
 * @param point2 Ending point {lat, lng}
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: google.maps.LatLngLiteral,
  point2: google.maps.LatLngLiteral
): number {
  const R = 6371; // Earth's radius in km

  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate the total distance of a polyline
 * @param points Array of {lat, lng} points
 * @returns Total distance in kilometers
 */
export function calculatePolylineDistance(
  points: google.maps.LatLngLiteral[]
): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }

  return totalDistance;
}

/**
 * Determine cable size based on distance and power
 * @param distanceKm Cable distance in kilometers
 * @param powerMW System power in megawatts
 * @returns Cable size recommendation
 */
export function determineCableSize(
  distanceKm: number,
  powerMW: number
): {
  size: string;
  voltage: string;
  description: string;
} {
  // Simplified cable sizing logic
  // In reality, this would be based on voltage drop calculations and current capacity

  const currentA = (powerMW * 1000) / 0.4; // Assuming 0.4kV for now

  if (distanceKm < 1 && currentA < 500) {
    return {
      size: "70mm²",
      voltage: "400V",
      description: "Standard LV cable",
    };
  } else if (distanceKm < 2 && currentA < 1000) {
    return {
      size: "150mm²",
      voltage: "400V",
      description: "Heavy-duty LV cable",
    };
  } else if (distanceKm < 5) {
    return {
      size: "95mm² Cu",
      voltage: "10kV",
      description: "Medium voltage cable",
    };
  } else if (distanceKm < 10) {
    return {
      size: "150mm² Cu",
      voltage: "20kV",
      description: "High voltage cable",
    };
  } else {
    return {
      size: "240mm² Cu",
      voltage: "33kV",
      description: "Extra high voltage cable",
    };
  }
}
