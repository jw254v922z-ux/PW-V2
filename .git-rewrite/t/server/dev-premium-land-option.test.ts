import { describe, it, expect } from "vitest";
import { calculateSolarModel, defaultInputs } from "../client/src/lib/calculator";

describe("Developer Premium and Land Option Cost Features", () => {
  it("should include Developer Premium when enabled", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: true,
      developmentPremiumDiscount: 0,
    };

    const result = calculateSolarModel(inputs);

    // Year 0 CAPEX should include full developer premium
    const expectedDevPremium = 50000 * 28; // £1,400,000
    const expectedCapex = (437590 * 28) + 6400000 + expectedDevPremium;
    
    expect(result.yearlyData[0].capex).toBeCloseTo(expectedCapex, -1);
    expect(result.summary.totalCapex).toBeCloseTo(expectedCapex, -1);
  });

  it("should exclude Developer Premium when disabled", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: false,
      developmentPremiumDiscount: 0,
    };

    const result = calculateSolarModel(inputs);

    // Year 0 CAPEX should NOT include developer premium
    const expectedCapex = (437590 * 28) + 6400000; // No dev premium
    
    expect(result.yearlyData[0].capex).toBeCloseTo(expectedCapex, -1);
    expect(result.summary.totalCapex).toBeCloseTo(expectedCapex, -1);
  });

  it("should apply Developer Premium discount correctly", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: true,
      developmentPremiumDiscount: 20, // 20% discount
    };

    const result = calculateSolarModel(inputs);

    // Dev Premium with 20% discount = 50000 * 0.8 = 40000 per MW
    const discountedDevPremium = 50000 * 28 * 0.8; // £1,120,000
    const expectedCapex = (437590 * 28) + 6400000 + discountedDevPremium;
    
    expect(result.yearlyData[0].capex).toBeCloseTo(expectedCapex, -1);
  });

  it("should include Land Option Cost when enabled", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000, // £10,000 per MW per year
      landOptionEnabled: true,
      landOptionDiscount: 0,
      costInflationRate: 0, // No inflation for this test
    };

    const result = calculateSolarModel(inputs);

    // Year 1 OPEX should include base OPEX + Land Option Cost
    const baseOpex = 15100 * 28; // £422,800
    const landOptionCost = 10000 * 28; // £280,000
    const expectedOpex = baseOpex + landOptionCost; // £702,800
    
    expect(result.yearlyData[1].opex).toBeCloseTo(expectedOpex, 0);
  });

  it("should exclude Land Option Cost when disabled", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000,
      landOptionEnabled: false,
      landOptionDiscount: 0,
    };

    const result = calculateSolarModel(inputs);

    // Year 1 OPEX should only include base OPEX
    const expectedOpex = 15100 * 28; // £422,800
    
    expect(result.yearlyData[1].opex).toBeCloseTo(expectedOpex, 0);
  });

  it("should apply Land Option Cost discount correctly", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000,
      landOptionEnabled: true,
      landOptionDiscount: 25, // 25% discount
      costInflationRate: 0,
    };

    const result = calculateSolarModel(inputs);

    // Land Option with 25% discount = 10000 * 0.75 = 7500 per MW
    const baseOpex = 15100 * 28;
    const discountedLandOption = 10000 * 28 * 0.75; // £210,000
    const expectedOpex = baseOpex + discountedLandOption;
    
    expect(result.yearlyData[1].opex).toBeCloseTo(expectedOpex, 0);
  });

  it("should apply CPI inflation to Land Option Cost", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000,
      landOptionEnabled: true,
      landOptionDiscount: 0,
      costInflationRate: 2.5, // 2.5% CPI inflation
      opexEscalation: 0, // No escalation on base OPEX for this test
    };

    const result = calculateSolarModel(inputs);

    // Year 1: Base Land Option Cost
    const year1LandOption = 10000 * 28; // £280,000
    expect(result.yearlyData[1].opex).toBeCloseTo(15100 * 28 + year1LandOption, 0);

    // Year 2: Land Option Cost with 2.5% inflation
    const year2LandOption = 10000 * 28 * 1.025; // £286,000
    expect(result.yearlyData[2].opex).toBeCloseTo(15100 * 28 + year2LandOption, 0);

    // Year 3: Land Option Cost with 2 years of 2.5% inflation
    const year3LandOption = 10000 * 28 * Math.pow(1.025, 2);
    expect(result.yearlyData[3].opex).toBeCloseTo(15100 * 28 + year3LandOption, 0);
  });

  it("should handle both Developer Premium and Land Option Cost simultaneously", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: true,
      developmentPremiumDiscount: 10, // 10% discount
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000,
      landOptionEnabled: true,
      landOptionDiscount: 15, // 15% discount
      costInflationRate: 2.0,
      opexEscalation: 0,
    };

    const result = calculateSolarModel(inputs);

    // Year 0: Check CAPEX includes discounted Dev Premium
    const discountedDevPremium = 50000 * 28 * 0.9; // £1,260,000
    const expectedCapex = (437590 * 28) + 6400000 + discountedDevPremium;
    expect(result.yearlyData[0].capex).toBeCloseTo(expectedCapex, -1);

    // Year 1: Check OPEX includes discounted Land Option Cost
    const baseOpex = 15100 * 28;
    const discountedLandOption = 10000 * 28 * 0.85; // £238,000
    const expectedOpex = baseOpex + discountedLandOption;
    expect(result.yearlyData[1].opex).toBeCloseTo(expectedOpex, 0);

    // Year 2: Check Land Option Cost has 2% inflation applied
    const year2LandOption = 10000 * 28 * 0.85 * 1.02;
    expect(result.yearlyData[2].opex).toBeCloseTo(baseOpex + year2LandOption, 0);
  });

  it("should calculate LCOE correctly with both cost options enabled", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: true,
      developmentPremiumDiscount: 0,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 5000, // Smaller amount for easier calculation
      landOptionEnabled: true,
      landOptionDiscount: 0,
      costInflationRate: 0, // No inflation for predictable results
      opexEscalation: 0,
      projectLife: 15,
      discountRate: 0.10,
      powerPrice: 110,
      percentConsumptionPPA: 100,
      percentConsumptionExport: 0,
      exportPrice: 50,
    };

    const result = calculateSolarModel(inputs);

    // LCOE should be higher than baseline due to additional costs
    expect(result.summary.lcoe).toBeGreaterThan(0);
    expect(result.summary.undiscountedLcoe).toBeGreaterThan(0);
    
    // Total CAPEX should include Dev Premium
    const expectedCapex = (437590 * 28) + 6400000 + (50000 * 28);
    expect(result.summary.totalCapex).toBeCloseTo(expectedCapex, -1);

    // Total OPEX should include Land Option Cost for all years
    const baseOpexTotal = 15100 * 28 * 15;
    const landOptionTotal = 5000 * 28 * 15; // No inflation
    const expectedOpex = baseOpexTotal + landOptionTotal;
    expect(result.summary.totalOpex).toBeCloseTo(expectedOpex, 0);
  });

  it("should handle 100% discount on Developer Premium", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437590,
      privateWireCost: 6400000,
      developmentPremiumPerMW: 50000,
      developmentPremiumEnabled: true,
      developmentPremiumDiscount: 100, // 100% discount = no cost
    };

    const result = calculateSolarModel(inputs);

    // CAPEX should not include any dev premium
    const expectedCapex = (437590 * 28) + 6400000;
    expect(result.yearlyData[0].capex).toBeCloseTo(expectedCapex, -1);
  });

  it("should handle 100% discount on Land Option Cost", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      opexPerMW: 15100,
      landOptionCostPerMWYear: 10000,
      landOptionEnabled: true,
      landOptionDiscount: 100, // 100% discount = no cost
    };

    const result = calculateSolarModel(inputs);

    // Year 1 OPEX should only include base OPEX
    const expectedOpex = 15100 * 28;
    expect(result.yearlyData[1].opex).toBeCloseTo(expectedOpex, 0);
  });
});
