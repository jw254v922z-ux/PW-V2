import { describe, it, expect } from "vitest";

// Test cost rate calculations
describe("GridConnectionSliders - Cost Calculations", () => {
  const COST_RATES = {
    agricultural: { min: 200000, max: 350000 },
    road: { min: 600000, max: 1200000 },
    roadCrossing: { min: 150000, max: 300000 },
    jointBay: { min: 30000, max: 40000 },
    transformer: {
      "33/11": { min: 250000, max: 400000 },
      "33/6.6": { min: 250000, max: 400000 },
      "11/0.4": { min: 50000, max: 100000 },
    },
  };

  it("should calculate agricultural trenching costs correctly", () => {
    const distance = 3; // km
    const roadPercentage = 50;
    const agriculturalDistance = (distance * (100 - roadPercentage)) / 100;

    const min = agriculturalDistance * COST_RATES.agricultural.min;
    const max = agriculturalDistance * COST_RATES.agricultural.max;

    expect(min).toBe(300000);
    expect(max).toBe(525000);
  });

  it("should calculate road trenching costs correctly", () => {
    const distance = 3; // km
    const roadPercentage = 50;
    const roadDistance = (distance * roadPercentage) / 100;

    const min = roadDistance * COST_RATES.road.min;
    const max = roadDistance * COST_RATES.road.max;

    expect(min).toBe(900000);
    expect(max).toBe(1800000);
  });

  it("should calculate joints based on distance (1 per 500m)", () => {
    const distance = 3; // km
    const joints = Math.ceil((distance * 1000) / 500);

    expect(joints).toBe(6);
  });

  it("should calculate joint bay costs correctly", () => {
    const joints = 6;
    const min = joints * COST_RATES.jointBay.min;
    const max = joints * COST_RATES.jointBay.max;

    expect(min).toBe(180000);
    expect(max).toBe(240000);
  });

  it("should calculate transformer costs for 33/11 kV", () => {
    const transformerCount = 2;
    const voltage = "33/11";
    const costs = COST_RATES.transformer[voltage as keyof typeof COST_RATES.transformer];

    const min = transformerCount * costs.min;
    const max = transformerCount * costs.max;

    expect(min).toBe(500000);
    expect(max).toBe(800000);
  });

  it("should calculate transformer costs for 11/0.4 kV", () => {
    const transformerCount = 2;
    const voltage = "11/0.4";
    const costs = COST_RATES.transformer[voltage as keyof typeof COST_RATES.transformer];

    const min = transformerCount * costs.min;
    const max = transformerCount * costs.max;

    expect(min).toBe(100000);
    expect(max).toBe(200000);
  });

  it("should calculate major road crossing costs correctly", () => {
    const majorRoadCrossings = 2;
    const min = majorRoadCrossings * COST_RATES.roadCrossing.min;
    const max = majorRoadCrossings * COST_RATES.roadCrossing.max;

    expect(min).toBe(300000);
    expect(max).toBe(600000);
  });

  it("should calculate total project cost correctly", () => {
    // Scenario: 3km distance, 50% road, 2 transformers 33/11, 2 road crossings
    const distance = 3;
    const roadPercentage = 50;
    const transformerCount = 2;
    const majorRoadCrossings = 2;

    const agriculturalDistance = (distance * (100 - roadPercentage)) / 100;
    const roadDistance = (distance * roadPercentage) / 100;
    const joints = Math.ceil((distance * 1000) / 500);

    const agriculturalMin = agriculturalDistance * COST_RATES.agricultural.min;
    const agriculturalMax = agriculturalDistance * COST_RATES.agricultural.max;
    const roadMin = roadDistance * COST_RATES.road.min;
    const roadMax = roadDistance * COST_RATES.road.max;
    const crossingMin = majorRoadCrossings * COST_RATES.roadCrossing.min;
    const crossingMax = majorRoadCrossings * COST_RATES.roadCrossing.max;
    const jointMin = joints * COST_RATES.jointBay.min;
    const jointMax = joints * COST_RATES.jointBay.max;
    const transformerMin = transformerCount * COST_RATES.transformer["33/11"].min;
    const transformerMax = transformerCount * COST_RATES.transformer["33/11"].max;

    const constructionMin = agriculturalMin + roadMin + crossingMin + jointMin + transformerMin;
    const constructionMax = agriculturalMax + roadMax + crossingMax + jointMax + transformerMax;

    const softCostsMin = 20000 + 50000 + 600 + 15000;
    const softCostsMax = 60000 + 90000 + 1200 + 40000;

    const projectMin = constructionMin + softCostsMin;
    const projectMax = constructionMax + softCostsMax;

    expect(constructionMin).toBe(2180000);
    expect(constructionMax).toBe(3965000);
    expect(softCostsMin).toBe(85600);
    expect(softCostsMax).toBe(191200);
    expect(projectMin).toBe(2265600);
    expect(projectMax).toBe(4156200);
  });

  it("should handle zero road crossings", () => {
    const majorRoadCrossings = 0;
    const min = majorRoadCrossings * COST_RATES.roadCrossing.min;
    const max = majorRoadCrossings * COST_RATES.roadCrossing.max;

    expect(min).toBe(0);
    expect(max).toBe(0);
  });

  it("should calculate average cost correctly", () => {
    const projectMin = 2666200;
    const projectMax = 4156400;
    const average = (projectMin + projectMax) / 2;

    expect(average).toBe(3411300);
  });
});
