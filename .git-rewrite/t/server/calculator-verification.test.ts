import { describe, it, expect } from "vitest";
import { calculateSolarModel, defaultInputs } from "../client/src/lib/calculator";

describe("Solar Calculator Verification Against Excel Model", () => {
  it("should match Excel reference model exactly", () => {
    // Excel inputs
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437589.69, // (20052511.46 - 6400000 - 1400000) / 28
      privateWireCost: 6400000,
      gridConnectionCost: 0,
      developmentPremiumPerMW: 50000, // 1400000 / 28
      opexPerMW: 15100, // 422800 / 28
      opexEscalation: 0,
      generationPerMW: 944.82, // 26454.96 / 28
      degradationRate: 0.004,
      projectLife: 15,
      discountRate: 0.10,
      powerPrice: 110,
      percentConsumptionPPA: 100,
      percentConsumptionExport: 0,
      exportPrice: 50,
    };

    const result = calculateSolarModel(inputs);

    // Excel Results
    const excelLcoe = 118.09; // Discounted LCOE
    const excelUndiscountedLcoe = 68.40; // Undiscounted LCOE
    const excelIrr = 0.0856; // 8.56%
    const excelNpv = -1594784.82; // Total discounted cash flow
    const excelTotalCapex = 20052511.46;
    const excelTotalOpex = 422800 * 15; // 6,342,000
    const excelTotalGeneration = 385903.62; // MWh
    const excelTotalDiscountedCost = 23268361.88;
    const excelTotalDiscountedEnergy = 197032.52;

    console.log("\n=== CALCULATOR RESULTS ===");
    console.log(`LCOE (Discounted): £${result.summary.lcoe.toFixed(2)}/MWh (Excel: £${excelLcoe.toFixed(2)}/MWh)`);
    console.log(`LCOE (Undiscounted): £${result.summary.undiscountedLcoe.toFixed(2)}/MWh (Excel: £${excelUndiscountedLcoe.toFixed(2)}/MWh)`);
    console.log(`IRR: ${(result.summary.irr * 100).toFixed(2)}% (Excel: ${(excelIrr * 100).toFixed(2)}%)`);
    console.log(`NPV: £${result.summary.totalDiscountedCashFlow.toFixed(2)} (Excel: £${excelNpv.toFixed(2)})`);
    console.log(`Total Capex: £${result.summary.totalCapex.toFixed(2)} (Excel: £${excelTotalCapex.toFixed(2)})`);
    console.log(`Total Opex: £${result.summary.totalOpex.toFixed(2)} (Excel: £${excelTotalOpex.toFixed(2)})`);
    console.log(`Total Generation: ${result.summary.totalGeneration.toFixed(2)} MWh (Excel: ${excelTotalGeneration.toFixed(2)} MWh)`);
    console.log(`Total Discounted Cost: £${result.summary.totalDiscountedCost.toFixed(2)} (Excel: £${excelTotalDiscountedCost.toFixed(2)})`);
    console.log(`Total Discounted Energy: ${result.summary.totalDiscountedEnergy.toFixed(2)} MWh (Excel: ${excelTotalDiscountedEnergy.toFixed(2)} MWh)`);

    // Verify key metrics with tolerance
    const tolerance = 0.01; // 1% tolerance for floating point differences
    
    expect(result.summary.lcoe).toBeCloseTo(excelLcoe, 0);
    expect(result.summary.undiscountedLcoe).toBeCloseTo(excelUndiscountedLcoe, 0);
    expect(result.summary.irr).toBeCloseTo(excelIrr, 4);
    expect(result.summary.totalDiscountedCashFlow).toBeCloseTo(excelNpv, -2);
    expect(result.summary.totalCapex).toBeCloseTo(excelTotalCapex, -1); // Allow small rounding differences
    expect(result.summary.totalOpex).toBeCloseTo(excelTotalOpex, 0);
    expect(result.summary.totalGeneration).toBeCloseTo(excelTotalGeneration, 0);

    // Verify Year 0 structure
    const year0 = result.yearlyData[0];
    expect(year0.year).toBe(0);
    expect(year0.capex).toBeCloseTo(excelTotalCapex, -1); // Allow small rounding differences
    expect(year0.opex).toBe(0);
    expect(year0.generation).toBe(0);
    expect(year0.revenue).toBe(0);
    expect(year0.cashFlow).toBeCloseTo(-excelTotalCapex, -1);

    // Verify Year 1 structure
    const year1 = result.yearlyData[1];
    expect(year1.year).toBe(1);
    expect(year1.capex).toBe(0);
    expect(year1.opex).toBeCloseTo(422800, 0);
    expect(year1.generation).toBeCloseTo(26454.96, 0);
    expect(year1.revenue).toBeCloseTo(2910045.6, 0);
    expect(year1.cashFlow).toBeCloseTo(2487245.6, 0);
    expect(year1.discountFactor).toBeCloseTo(0.9090909091, 8);

    // Verify project life
    expect(result.yearlyData.length).toBe(16); // Year 0 to Year 15
  });

  it("should apply OPEX escalation correctly", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437589.69,
      privateWireCost: 6400000,
      gridConnectionCost: 0,
      developmentPremiumPerMW: 50000,
      opexPerMW: 15100,
      opexEscalation: 0.025, // 2.5% escalation
      generationPerMW: 944.82,
      degradationRate: 0.004,
      projectLife: 15,
      discountRate: 0.10,
      powerPrice: 110,
      percentConsumptionPPA: 100,
      percentConsumptionExport: 0,
      exportPrice: 50,
    };

    const result = calculateSolarModel(inputs);

    // Year 1 Opex
    const year1Opex = 422800;
    expect(result.yearlyData[1].opex).toBeCloseTo(year1Opex, 0);

    // Year 2 Opex with 2.5% escalation
    const year2Opex = year1Opex * 1.025;
    expect(result.yearlyData[2].opex).toBeCloseTo(year2Opex, 0);

    // Year 3 Opex
    const year3Opex = year1Opex * Math.pow(1.025, 2);
    expect(result.yearlyData[3].opex).toBeCloseTo(year3Opex, 0);
  });

  it("should apply degradation correctly", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437589.69,
      privateWireCost: 6400000,
      gridConnectionCost: 0,
      developmentPremiumPerMW: 50000,
      opexPerMW: 15100,
      opexEscalation: 0,
      generationPerMW: 944.82,
      degradationRate: 0.004,
      projectLife: 15,
      discountRate: 0.10,
      powerPrice: 110,
      percentConsumptionPPA: 100,
      percentConsumptionExport: 0,
      exportPrice: 50,
    };

    const result = calculateSolarModel(inputs);

    // Year 1 Generation
    const year1Gen = 26454.96;
    expect(result.yearlyData[1].generation).toBeCloseTo(year1Gen, 0);

    // Year 2 Generation with 0.4% degradation
    const year2Gen = year1Gen * (1 - 0.004);
    expect(result.yearlyData[2].generation).toBeCloseTo(year2Gen, 0);

    // Year 3 Generation
    const year3Gen = year1Gen * Math.pow(1 - 0.004, 2);
    expect(result.yearlyData[3].generation).toBeCloseTo(year3Gen, 0);
  });

  it("should calculate split revenue correctly", () => {
    const inputs = {
      ...defaultInputs,
      mw: 28,
      capexPerMW: 437589.69,
      privateWireCost: 6400000,
      gridConnectionCost: 0,
      developmentPremiumPerMW: 50000,
      opexPerMW: 15100,
      opexEscalation: 0,
      generationPerMW: 944.82,
      degradationRate: 0.004,
      projectLife: 15,
      discountRate: 0.10,
      powerPrice: 110,
      percentConsumptionPPA: 80, // 80% at PPA price
      percentConsumptionExport: 20, // 20% at export price
      exportPrice: 50,
    };

    const result = calculateSolarModel(inputs);

    // Year 1 Generation
    const year1Gen = 26454.96;
    const ppaConsumption = year1Gen * 0.8;
    const exportGeneration = year1Gen * 0.2;
    const expectedRevenue = (ppaConsumption * 110) + (exportGeneration * 50);

    expect(result.yearlyData[1].revenue).toBeCloseTo(expectedRevenue, 0);
  });
});
