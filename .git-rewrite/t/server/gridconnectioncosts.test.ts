import { describe, it, expect } from "vitest";
import { calculateGridConnectionCost } from "../client/src/lib/gridConnectionCosts";

describe("Grid Connection Cost Calculator", () => {
  it("should calculate cable costs based on distance and voltage", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result.cableCost.min).toBeGreaterThan(0);
    expect(result.cableCost.max).toBeGreaterThanOrEqual(result.cableCost.min);
  });

  it("should calculate step-up transformer costs", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result.stepUpCost.min).toBeGreaterThan(0);
    expect(result.stepUpCost.max).toBeGreaterThan(result.stepUpCost.min);
  });

  it("should calculate step-down transformer costs based on count", () => {
    const result1 = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 1,
      roadCrossings: 2,
    });

    const result2 = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result2.stepDownCost.min).toBeGreaterThan(result1.stepDownCost.min);
  });

  it("should calculate joint bay costs based on distance", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result.jointBayCost.min).toBeGreaterThan(0);
    expect(result.jointBayCost.max).toBeGreaterThan(result.jointBayCost.min);
  });

  it("should calculate road crossing costs", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result.roadCrossingCost.min).toBeGreaterThan(0);
    expect(result.roadCrossingCost.max).toBeGreaterThan(result.roadCrossingCost.min);
  });

  it("should include land rights and planning costs", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    expect(result.landRightsCost.min).toBeGreaterThan(0);
    expect(result.landRightsCost.max).toBeGreaterThan(result.landRightsCost.min);
  });

  it("should calculate total cost as sum of all components", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    const expectedMin =
      result.cableCost.min +
      result.stepUpCost.min +
      result.stepDownCost.min +
      result.stepDownInstallationCost.min +
      result.jointBayCost.min +
      result.roadCrossingCost.min +
      result.terminationCost.min +
      result.hvTerminationCost.min +
      result.wayleavesCost.min +
      result.landRightsCost.min +
      result.roadCableLayingCost.min;

    expect(result.totalCost.min).toBe(expectedMin);
  });

  it("should handle different cable voltages", () => {
    const result33 = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    const result132 = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "132",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    // Higher voltage should have higher cable costs
    expect(result132.cableCost.min).toBeGreaterThan(result33.cableCost.min);
  });

  it("should scale costs with distance", () => {
    const result1 = calculateGridConnectionCost({
      distance: 1,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 0,
    });

    const result3 = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 0,
    });

    // 3x distance should have higher cable costs
    expect(result3.cableCost.min).toBeGreaterThan(result1.cableCost.min);
  });

  it("should return reasonable cost ranges", () => {
    const result = calculateGridConnectionCost({
      distance: 3,
      roadPercentage: 50,
      cableVoltage: "33",
      stepUpTransformerCount: 1,
      stepDownTransformerCount: 2,
      roadCrossings: 2,
    });

    // Total cost should be between 3-5 million for typical scenario
    expect(result.totalCost.min).toBeGreaterThan(1000000);
    expect(result.totalCost.max).toBeLessThan(10000000);
    expect(result.totalCost.min).toBeLessThan(result.totalCost.max);
  });
});
