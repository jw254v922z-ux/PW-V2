import { calculateSolarModel, SolarInputs } from "./calculator";

export interface SensitivityResult {
  voltage: number;
  distance: number;
  lcoe: number;
  irr: number;
}

export interface SensitivityMatrix {
  voltages: number[];
  distances: number[];
  lcoeData: number[][];
  irrData: number[][];
  minLcoe: number;
  maxLcoe: number;
  minIrr: number;
  maxIrr: number;
}

// Cable voltage options (kV)
const VOLTAGES = [6, 10, 20, 33, 66, 132];

// Distance options (km)
const DISTANCES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Simplified grid cost estimation based on voltage and distance
// This is based on typical UK utility pricing
function estimateGridCost(voltageKV: number, distanceKm: number): number {
  // Base costs per km by voltage (£/km)
  const baseCosts: Record<number, number> = {
    6: 150000,    // 6 kV: £150k/km
    10: 180000,   // 10 kV: £180k/km
    20: 220000,   // 20 kV: £220k/km
    33: 280000,   // 33 kV: £280k/km
    66: 380000,   // 66 kV: £380k/km
    132: 520000,  // 132 kV: £520k/km
  };

  const baseCost = baseCosts[voltageKV] || baseCosts[33];
  
  // Cable cost
  const cableCost = baseCost * distanceKm;
  
  // Transformer cost (increases with voltage)
  const transformerCost = 50000 + (voltageKV * 500);
  
  // Wayleave costs (increases with distance)
  const wayleaveAnnual = 2000 * distanceKm;
  const wayleaveCapital = wayleaveAnnual * 20; // Capitalize over 20 years
  
  // Road laying costs (traffic management, trenching, reinstatement)
  const roadLayingCost = 80000 * distanceKm * 0.3; // 30% of distance is road
  
  // Soft costs (planning, surveys, legal)
  const softCosts = (cableCost + transformerCost) * 0.15;
  
  return cableCost + transformerCost + wayleaveCapital + roadLayingCost + softCosts;
}

export function calculateSensitivityMatrix(baseInputs: SolarInputs): SensitivityMatrix {
  const lcoeData: number[][] = [];
  const irrData: number[][] = [];
  let minLcoe = Infinity;
  let maxLcoe = -Infinity;
  let minIrr = Infinity;
  let maxIrr = -Infinity;

  // Calculate LCOE and IRR for each voltage/distance combination
  for (const distance of DISTANCES) {
    const lcoeRow: number[] = [];
    const irrRow: number[] = [];
    
    for (const voltage of VOLTAGES) {
      // Create modified inputs with new grid cost
      const gridCost = estimateGridCost(voltage, distance);
      const modifiedInputs: SolarInputs = {
        ...baseInputs,
        gridConnectionCost: gridCost,
        cableVoltageKV: voltage,
        distanceKm: distance,
      };

      // Calculate solar results
      const results = calculateSolarModel(modifiedInputs);
      const lcoe = results.summary.lcoe;
      const irr = results.summary.irr;

      // Debug: log first few values
      if (distance === 1 && voltage === 6) {
        console.log('[DEBUG SENSITIVITY] First cell (6kV, 1km):', { lcoe, irr, irrPercent: (irr * 100).toFixed(2) });
      }

      lcoeRow.push(lcoe);
      irrRow.push(irr);
      minLcoe = Math.min(minLcoe, lcoe);
      maxLcoe = Math.max(maxLcoe, lcoe);
      minIrr = Math.min(minIrr, irr);
      maxIrr = Math.max(maxIrr, irr);
    }
    
    lcoeData.push(lcoeRow);
    irrData.push(irrRow);
  }

  console.log('[DEBUG SENSITIVITY] Matrix minIrr:', minIrr, 'maxIrr:', maxIrr, 'minIrr%:', (minIrr * 100).toFixed(2), 'maxIrr%:', (maxIrr * 100).toFixed(2));

  return {
    voltages: VOLTAGES,
    distances: DISTANCES,
    lcoeData,
    irrData,
    minLcoe,
    maxLcoe,
    minIrr,
    maxIrr,
  };
}

// Get color for heatmap based on value
export function getHeatmapColor(value: number, minValue: number, maxValue: number, invertScale = false): string {
  let normalized = (value - minValue) / (maxValue - minValue);
  
  // For IRR, invert the scale so higher values are green
  if (invertScale) {
    normalized = 1 - normalized;
  }
  
  // Color scale: green (low cost/high return) -> yellow -> red (high cost/low return)
  if (normalized < 0.33) {
    // Green to yellow
    const t = normalized / 0.33;
    const r = Math.round(0 + (255 - 0) * t);
    const g = 255;
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0.67) {
    // Yellow to orange
    const t = (normalized - 0.33) / 0.34;
    const r = 255;
    const g = Math.round(255 - (255 - 200) * t);
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to red
    const t = (normalized - 0.67) / 0.33;
    const r = 255;
    const g = Math.round(200 - (200 - 0) * t);
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
}
