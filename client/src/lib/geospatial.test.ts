import { describe, it, expect } from "vitest";
import {
  calculatePolygonArea,
  calculateDistance,
  calculatePolylineDistance,
  determineCableSize,
} from "./geospatial";

describe("Geospatial Calculations", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      const point1 = { lat: 52.5200, lng: -1.1743 }; // Midlands
      const point2 = { lat: 51.5074, lng: -0.1278 }; // London
      const distance = calculateDistance(point1, point2);
      // Distance should be approximately 150-170 km
      expect(distance).toBeGreaterThan(140);
      expect(distance).toBeLessThan(180);
    });

    it("should return 0 for same point", () => {
      const point = { lat: 52.5200, lng: -1.1743 };
      const distance = calculateDistance(point, point);
      expect(distance).toBeLessThan(0.01); // Allow small floating point error
    });
  });

  describe("calculatePolylineDistance", () => {
    it("should calculate total distance of a polyline", () => {
      const points = [
        { lat: 52.5200, lng: -1.1743 }, // Midlands
        { lat: 52.0, lng: -1.0 }, // Intermediate
        { lat: 51.5074, lng: -0.1278 }, // London
      ];
      const distance = calculatePolylineDistance(points);
      expect(distance).toBeGreaterThan(0);
    });

    it("should return 0 for less than 2 points", () => {
      const points = [{ lat: 52.5200, lng: -1.1743 }];
      const distance = calculatePolylineDistance(points);
      expect(distance).toBe(0);
    });
  });

  describe("calculatePolygonArea", () => {
    it("should calculate area of a square-like polygon", () => {
      // Create a small square around a point
      const points = [
        { lat: 52.0, lng: -1.0 },
        { lat: 52.01, lng: -1.0 },
        { lat: 52.01, lng: -0.99 },
        { lat: 52.0, lng: -0.99 },
      ];
      const area = calculatePolygonArea(points);
      // Area should be positive
      expect(area).toBeGreaterThan(0);
    });

    it("should return 0 for less than 3 points", () => {
      const points = [
        { lat: 52.0, lng: -1.0 },
        { lat: 52.01, lng: -1.0 },
      ];
      const area = calculatePolygonArea(points);
      expect(area).toBe(0);
    });
  });

  describe("determineCableSize", () => {
    it("should determine cable size for short distance and low power", () => {
      const result = determineCableSize(0.5, 1);
      expect(result.size).toBe("70mm²");
      expect(result.voltage).toBe("400V");
    });

    it("should determine cable size for medium distance", () => {
      const result = determineCableSize(3, 5);
      expect(result.voltage).toBe("10kV");
    });

    it("should determine cable size for long distance", () => {
      const result = determineCableSize(15, 10);
      expect(result.voltage).toBe("33kV");
    });
  });
});
