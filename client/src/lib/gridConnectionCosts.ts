/**
 * Grid Connection Cost Lookup Tables
 * Based on SSEN charging statements and UK industry benchmarks
 * Reference: https://www.ssen.co.uk/about-ssen/library/charging-statements-and-information/southern-electric-power-distribution/
 */

// Cable costs per km based on voltage and trench type
export const CABLE_COSTS = {
  // Low voltage (0.4 kV) - underground cable
  "0.4": { agricultural: 80000, road: 250000 }, // £ per km
  // Medium voltage
  "6": { agricultural: 120000, road: 350000 },
  "11": { agricultural: 150000, road: 400000 },
  "33": { agricultural: 200000, road: 600000 },
  "66": { agricultural: 300000, road: 900000 },
  "132": { agricultural: 450000, road: 1200000 },
} as const;

// Step-up transformer costs (Solar output voltage to cable voltage)
// Based on transformer rating and voltage combination
export const STEPUP_TRANSFORMER_COSTS = {
  // Format: "outputVoltage/cableVoltage": { min, max }
  "0.4/6": { min: 150000, max: 250000 },
  "0.4/11": { min: 180000, max: 300000 },
  "0.4/33": { min: 250000, max: 400000 },
  "0.4/66": { min: 350000, max: 550000 },
  "0.4/132": { min: 500000, max: 800000 },
} as const;

// Step-down transformer costs (Cable voltage to end-user voltage)
// Format: "cableVoltage/endUserVoltage": { min, max }
export const STEPDOWN_TRANSFORMER_COSTS = {
  "6/0.4": { min: 100000, max: 180000 },
  "11/0.4": { min: 120000, max: 220000 },
  "33/0.4": { min: 200000, max: 350000 },
  "33/6.6": { min: 180000, max: 320000 },
  "33/11": { min: 250000, max: 400000 },
  "66/11": { min: 350000, max: 550000 },
  "66/33": { min: 300000, max: 500000 },
  "132/33": { min: 450000, max: 750000 },
  "132/66": { min: 400000, max: 650000 },
} as const;

// Joint bay costs (per joint for underground cable)
export const JOINT_BAY_COSTS = {
  "0.4": { min: 15000, max: 25000 },
  "6": { min: 20000, max: 35000 },
  "11": { min: 25000, max: 40000 },
  "33": { min: 30000, max: 50000 },
  "66": { min: 40000, max: 65000 },
  "132": { min: 50000, max: 80000 },
} as const;

// Road crossing costs (directional drill)
export const ROAD_CROSSING_COSTS = {
  "0.4": { min: 80000, max: 150000 },
  "6": { min: 100000, max: 180000 },
  "11": { min: 120000, max: 220000 },
  "33": { min: 150000, max: 300000 },
  "66": { min: 200000, max: 400000 },
  "132": { min: 300000, max: 600000 },
} as const;

// Termination and connection costs
export const TERMINATION_COSTS = {
  "0.4": { min: 20000, max: 40000 },
  "6": { min: 30000, max: 60000 },
  "11": { min: 40000, max: 80000 },
  "33": { min: 60000, max: 120000 },
  "66": { min: 80000, max: 160000 },
  "132": { min: 120000, max: 240000 },
} as const;

// Land rights and planning costs (fixed, not voltage dependent)
// Sources: ENA Wayleave Rates 2024-25, SSEN Land Rights Guidance
export const LAND_RIGHTS_COSTS = {
  compensation: { min: 20000, max: 60000 },
  legal: { min: 50000, max: 90000 },
  planning: { min: 600, max: 1200 },
  surveys: { min: 15000, max: 40000 },
} as const;

// Wayleave rates per km based on land type
// Source: ENA Wayleave Rates 2024-25 (https://www.energynetworks.org/assets/images/Publications/2024/240902-ena-wayleave-rates-2024-25.pdf)
export const WAYLEAVE_RATES = {
  agricultural: { min: 150, max: 300 }, // £ per km per year
  grassland: { min: 100, max: 200 },
  hedgerow: { min: 50, max: 150 },
  arable: { min: 200, max: 400 },
} as const;

// HV Termination costs at end-user sites
// Source: SSEN Charging Statements, typical HV connection costs
export const HV_TERMINATION_COSTS = {
  "6": { min: 15000, max: 35000 },
  "11": { min: 20000, max: 50000 },
  "33": { min: 35000, max: 80000 },
  "66": { min: 60000, max: 120000 },
  "132": { min: 100000, max: 200000 },
} as const;

// Step-down transformer installation costs (proportional to transformer size)
// Source: Market norms for HV/LV substation installations
export const STEPDOWN_INSTALLATION_COSTS = {
  "6/0.4": { min: 50000, max: 100000 },
  "11/0.4": { min: 60000, max: 120000 },
  "33/0.4": { min: 80000, max: 150000 },
  "33/6.6": { min: 70000, max: 130000 },
  "33/11": { min: 75000, max: 140000 },
  "66/11": { min: 100000, max: 180000 },
  "66/33": { min: 90000, max: 160000 },
  "132/33": { min: 120000, max: 220000 },
  "132/66": { min: 110000, max: 200000 },
} as const;

/**
 * Calculate total grid connection cost based on parameters
 */
export function calculateGridConnectionCost(params: {
  distance: number; // km
  roadPercentage: number; // 0-100
  cableVoltage: string; // "6", "11", "33", "66", "132"
  stepUpTransformerCount: number; // Usually 1
  stepDownTransformerCount: number; // Number of end-user connection points
  roadCrossings: number;
  includeStepDownInstallation?: boolean; // Add installation costs for step-down transformers
  wayleaveYears?: number; // Number of years for wayleave calculation
  wayleaveDiscount?: number; // 0-100% discount on wayleaves
  roadCableLayingCostPerKm?: number; // £/km for road cable laying
  includeStepUpTransformer?: boolean; // Toggle to include/exclude step-up transformer costs
  includeStepDownTransformer?: boolean; // Toggle to include/exclude step-down transformer costs
}): {
  cableCost: { min: number; max: number };
  stepUpCost: { min: number; max: number };
  stepDownCost: { min: number; max: number };
  stepDownInstallationCost: { min: number; max: number };
  jointBayCost: { min: number; max: number };
  roadCrossingCost: { min: number; max: number };
  terminationCost: { min: number; max: number };
  hvTerminationCost: { min: number; max: number };
  wayleavesCost: { min: number; max: number };
  landRightsCost: { min: number; max: number };
  roadCableLayingCost: { min: number; max: number };
  totalCost: { min: number; max: number };
} {
  const {
    distance,
    roadPercentage,
    cableVoltage,
    stepUpTransformerCount,
    stepDownTransformerCount,
    roadCrossings,
    includeStepDownInstallation = false,
    wayleaveYears = 1,
    wayleaveDiscount = 0,
    roadCableLayingCostPerKm = 150000, // Default £150k/km for road cable laying
    includeStepUpTransformer = true,
    includeStepDownTransformer = true,
  } = params;

  // Cable costs
  const cableCosts = CABLE_COSTS[cableVoltage as keyof typeof CABLE_COSTS] || CABLE_COSTS["33"];
  const agriculturalDist = (distance * (100 - roadPercentage)) / 100;
  const roadDist = (distance * roadPercentage) / 100;
  
  const cableCost = {
    min: agriculturalDist * cableCosts.agricultural + roadDist * cableCosts.road,
    max: agriculturalDist * cableCosts.agricultural + roadDist * cableCosts.road,
  };

  // Step-up transformer costs (solar to cable voltage)
  const stepUpKey = `0.4/${cableVoltage}` as keyof typeof STEPUP_TRANSFORMER_COSTS;
  const stepUpCosts = STEPUP_TRANSFORMER_COSTS[stepUpKey] || STEPUP_TRANSFORMER_COSTS["0.4/33"];
  const stepUpCost = includeStepUpTransformer ? {
    min: stepUpCosts.min * stepUpTransformerCount,
    max: stepUpCosts.max * stepUpTransformerCount,
  } : { min: 0, max: 0 };

  // Step-down transformer costs (cable to end-user voltage)
  const stepDownKey = `${cableVoltage}/11` as keyof typeof STEPDOWN_TRANSFORMER_COSTS;
  const stepDownCosts = STEPDOWN_TRANSFORMER_COSTS[stepDownKey] || STEPDOWN_TRANSFORMER_COSTS["33/11"];
  const stepDownCost = includeStepDownTransformer ? {
    min: stepDownCosts.min * stepDownTransformerCount,
    max: stepDownCosts.max * stepDownTransformerCount,
  } : { min: 0, max: 0 };

  // Joint bay costs (approximately 1 joint per 500m)
  const jointCount = Math.ceil((distance * 1000) / 500);
  const jointCosts = JOINT_BAY_COSTS[cableVoltage as keyof typeof JOINT_BAY_COSTS] || JOINT_BAY_COSTS["33"];
  const jointBayCost = {
    min: jointCosts.min * jointCount,
    max: jointCosts.max * jointCount,
  };

  // Road crossing costs
  const roadCrossingCosts = ROAD_CROSSING_COSTS[cableVoltage as keyof typeof ROAD_CROSSING_COSTS] || ROAD_CROSSING_COSTS["33"];
  const roadCrossingCost = {
    min: roadCrossingCosts.min * roadCrossings,
    max: roadCrossingCosts.max * roadCrossings,
  };

  // Termination costs
  const terminationCosts = TERMINATION_COSTS[cableVoltage as keyof typeof TERMINATION_COSTS] || TERMINATION_COSTS["33"];
  const effectiveStepUpCount = includeStepUpTransformer ? stepUpTransformerCount : 0;
  const effectiveStepDownCount = includeStepDownTransformer ? stepDownTransformerCount : 0;
  const terminationCost = {
    min: terminationCosts.min * (effectiveStepUpCount + effectiveStepDownCount),
    max: terminationCosts.max * (effectiveStepUpCount + effectiveStepDownCount),
  };

  // Step-down transformer installation costs (if included)
  const stepDownInstallationCosts = includeStepDownInstallation && includeStepDownTransformer
    ? STEPDOWN_INSTALLATION_COSTS[`${cableVoltage}/11` as keyof typeof STEPDOWN_INSTALLATION_COSTS] ||
      STEPDOWN_INSTALLATION_COSTS["33/11"]
    : { min: 0, max: 0 };
  const effectiveStepDownCountForInstallation = (includeStepDownInstallation && includeStepDownTransformer) ? stepDownTransformerCount : 0;
  const stepDownInstallationCost = {
    min: stepDownInstallationCosts.min * effectiveStepDownCountForInstallation,
    max: stepDownInstallationCosts.max * effectiveStepDownCountForInstallation,
  };

  // HV termination costs at end-user sites
  const hvTerminationCosts = HV_TERMINATION_COSTS[cableVoltage as keyof typeof HV_TERMINATION_COSTS] || HV_TERMINATION_COSTS["33"];
  const hvTerminationCost = includeStepDownTransformer ? {
    min: hvTerminationCosts.min * stepDownTransformerCount,
    max: hvTerminationCosts.max * stepDownTransformerCount,
  } : { min: 0, max: 0 };

  // Wayleaves costs (annual, multiplied by years, with discount applied)
  const wayleaveDiscountFactor = 1 - (wayleaveDiscount / 100);
  const wayleavesCost = {
    min: agriculturalDist * WAYLEAVE_RATES.agricultural.min * wayleaveYears * wayleaveDiscountFactor,
    max: roadDist * WAYLEAVE_RATES.arable.max * wayleaveYears * wayleaveDiscountFactor,
  };

  // Road cable laying costs (one-time, applied to road portion)
  const roadCableLayingCost = {
    min: roadDist * roadCableLayingCostPerKm,
    max: roadDist * roadCableLayingCostPerKm,
  };

  // Land rights and planning costs
  const landRightsCost = {
    min: LAND_RIGHTS_COSTS.compensation.min + LAND_RIGHTS_COSTS.legal.min + LAND_RIGHTS_COSTS.planning.min + LAND_RIGHTS_COSTS.surveys.min,
    max: LAND_RIGHTS_COSTS.compensation.max + LAND_RIGHTS_COSTS.legal.max + LAND_RIGHTS_COSTS.planning.max + LAND_RIGHTS_COSTS.surveys.max,
  };

  // Total cost (excluding wayleaves which are recurring OPEX, not CAPEX)
  const totalCost = {
    min:
      cableCost.min +
      stepUpCost.min +
      stepDownCost.min +
      stepDownInstallationCost.min +
      jointBayCost.min +
      roadCrossingCost.min +
      terminationCost.min +
      hvTerminationCost.min +
      landRightsCost.min +
      roadCableLayingCost.min,
    max:
      cableCost.max +
      stepUpCost.max +
      stepDownCost.max +
      stepDownInstallationCost.max +
      jointBayCost.max +
      roadCrossingCost.max +
      terminationCost.max +
      hvTerminationCost.max +
      landRightsCost.max +
      roadCableLayingCost.max,
  };

  return {
    cableCost,
    stepUpCost,
    stepDownCost,
    stepDownInstallationCost,
    jointBayCost,
    roadCrossingCost,
    terminationCost,
    hvTerminationCost,
    wayleavesCost,
    landRightsCost,
    roadCableLayingCost,
    totalCost,
  };
}
