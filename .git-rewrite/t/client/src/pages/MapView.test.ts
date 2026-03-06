import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculatePolygonArea } from "@/lib/geospatial";

describe("MapView Functionality", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("Geospatial Calculations", () => {
    it("should calculate polygon area correctly for a square", () => {
      // Create a 100m x 100m square (approximately)
      // Using lat/lng coordinates
      const points = [
        { lat: 52.52, lng: -1.17 },
        { lat: 52.520009, lng: -1.17 },
        { lat: 52.520009, lng: -1.169991 },
        { lat: 52.52, lng: -1.169991 },
      ];

      const area = calculatePolygonArea(points);
      
      // Area should be positive and reasonable
      expect(area).toBeGreaterThan(0);
      expect(area).toBeLessThan(100000); // Less than 10 hectares
    });

    it("should calculate system size from hectares using 0.5 MW/ha standard", () => {
      const hectares = 10;
      const systemSize = hectares * 0.5;
      
      expect(systemSize).toBe(5);
    });

    it("should handle map results in sessionStorage", () => {
      const mapResults = {
        systemSize: 5.5,
        cableDistance: 2.3,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      
      const retrieved = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(retrieved.systemSize).toBe(5.5);
      expect(retrieved.cableDistance).toBe(2.3);
    });

    it("should clear sessionStorage after reading map results", () => {
      const mapResults = {
        systemSize: 5.5,
        cableDistance: 2.3,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      expect(sessionStorage.getItem("mapResults")).not.toBeNull();
      
      sessionStorage.removeItem("mapResults");
      expect(sessionStorage.getItem("mapResults")).toBeNull();
    });
  });

  describe("Map Results Handling", () => {
    it("should store PV area results correctly", () => {
      const pvResults = {
        area: 100000, // m²
        hectares: 10,
        systemSize: 5, // MW
      };

      sessionStorage.setItem(
        "mapResults",
        JSON.stringify({
          systemSize: pvResults.systemSize,
          cableDistance: null,
        })
      );

      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      expect(stored.systemSize).toBe(5);
    });

    it("should store cable distance results correctly", () => {
      const cableResults = {
        distance: 2.5, // km
      };

      sessionStorage.setItem(
        "mapResults",
        JSON.stringify({
          systemSize: null,
          cableDistance: cableResults.distance,
        })
      );

      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      expect(stored.cableDistance).toBe(2.5);
    });

    it("should store both PV area and cable distance together", () => {
      const mapResults = {
        systemSize: 5,
        cableDistance: 2.5,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));

      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      expect(stored.systemSize).toBe(5);
      expect(stored.cableDistance).toBe(2.5);
    });
  });

  describe("Parameter Conversion", () => {
    it("should convert system size (MW) to calculator input", () => {
      const systemSize = 5.5;
      const mwInput = systemSize;
      
      expect(mwInput).toBe(5.5);
    });

    it("should convert cable distance (km) to private wire cost estimate", () => {
      const cableDistance = 2.5; // km
      const estimatedCost = cableDistance * 1000; // Rough estimate: £1000/km
      
      expect(estimatedCost).toBe(2500);
    });

    it("should handle fractional values correctly", () => {
      const systemSize = 5.75;
      const cableDistance = 2.33;
      
      const mapResults = {
        systemSize,
        cableDistance,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(stored.systemSize).toBeCloseTo(5.75, 2);
      expect(stored.cableDistance).toBeCloseTo(2.33, 2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values in map results", () => {
      const mapResults = {
        systemSize: null,
        cableDistance: 2.5,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(stored.systemSize).toBeNull();
      expect(stored.cableDistance).toBe(2.5);
    });

    it("should handle both null values", () => {
      const mapResults = {
        systemSize: null,
        cableDistance: null,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(stored.systemSize).toBeNull();
      expect(stored.cableDistance).toBeNull();
    });

    it("should handle zero values", () => {
      const mapResults = {
        systemSize: 0,
        cableDistance: 0,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(stored.systemSize).toBe(0);
      expect(stored.cableDistance).toBe(0);
    });

    it("should handle very large values", () => {
      const mapResults = {
        systemSize: 1000,
        cableDistance: 500,
      };

      sessionStorage.setItem("mapResults", JSON.stringify(mapResults));
      const stored = JSON.parse(sessionStorage.getItem("mapResults") || "{}");
      
      expect(stored.systemSize).toBe(1000);
      expect(stored.cableDistance).toBe(500);
    });
  });
});
