import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Info } from "lucide-react";
import { formatCurrency, formatNumberWithCommas } from "@/lib/formatters";
import { calculateGridConnectionCost } from "@/lib/gridConnectionCosts";

interface GridConnectionSliderProps {
  onCostsUpdate: (costs: GridConnectionCosts) => void;
  setShowSourceInfo?: (key: string) => void;
  initialDistance?: number;
}

export interface GridConnectionCosts {
  distance: number;
  cableVoltage: string;
  stepDownVoltage: string;
  stepUpTransformerCount: number;
  stepDownTransformerCount: number;
  roadPercentage: number;
  roadCrossings: number;
  includeStepDownInstallation: boolean;
  wayleaveDiscount: number; // 0-100%
  roadCableLayingCostPerKm: number; // £/km for road cable laying
  cableCostMin: number;
  cableCostMax: number;
  stepUpCostMin: number;
  stepUpCostMax: number;
  stepDownCostMin: number;
  stepDownCostMax: number;
  stepDownInstallationCostMin: number;
  stepDownInstallationCostMax: number;
  jointBayCostMin: number;
  jointBayCostMax: number;
  roadCrossingCostMin: number;
  roadCrossingCostMax: number;
  terminationCostMin: number;
  terminationCostMax: number;
  hvTerminationCostMin: number;
  hvTerminationCostMax: number;
  wayleavesCostMin: number;
  wayleavesCostMax: number;
  landRightsCostMin: number;
  landRightsCostMax: number;
  totalCostMin: number;
  totalCostMax: number;
}

const CABLE_VOLTAGE_OPTIONS = ["6", "11", "33", "66", "132"];
const STEPDOWN_VOLTAGE_OPTIONS = ["0.4", "6.6", "11"];

export function GridConnectionSliders({ onCostsUpdate, setShowSourceInfo, initialDistance = 3 }: GridConnectionSliderProps) {
  const [distance, setDistance] = useState(initialDistance);
  const [cableVoltage, setCableVoltage] = useState("33");
  const [stepDownVoltage, setStepDownVoltage] = useState("11");
  const [stepUpTransformerCount, setStepUpTransformerCount] = useState(1);
  const [stepDownTransformerCount, setStepDownTransformerCount] = useState(2);
  const [roadPercentage, setRoadPercentage] = useState(50);
  const [roadCrossings, setRoadCrossings] = useState(2);
  const [includeStepDownInstallation, setIncludeStepDownInstallation] = useState(false);

  // Update distance when initialDistance prop changes
  useEffect(() => {
    setDistance(initialDistance);
  }, [initialDistance]);

  // Calculate costs based on current parameters
  const costs = calculateGridConnectionCost({
    distance,
    roadPercentage,
    cableVoltage,
    stepUpTransformerCount,
    stepDownTransformerCount,
    roadCrossings,
    includeStepDownInstallation,
    wayleaveYears: 1,
  });

  // Update parent component with new costs
  useEffect(() => {
    onCostsUpdate({
      distance,
      cableVoltage,
      stepDownVoltage,
      stepUpTransformerCount,
      stepDownTransformerCount,
      roadPercentage,
      roadCrossings,
      includeStepDownInstallation,
      wayleaveDiscount: 0,
      roadCableLayingCostPerKm: 0,
      cableCostMin: costs.cableCost.min,
      cableCostMax: costs.cableCost.max,
      stepUpCostMin: costs.stepUpCost.min,
      stepUpCostMax: costs.stepUpCost.max,
      stepDownCostMin: costs.stepDownCost.min,
      stepDownCostMax: costs.stepDownCost.max,
      stepDownInstallationCostMin: costs.stepDownInstallationCost.min,
      stepDownInstallationCostMax: costs.stepDownInstallationCost.max,
      jointBayCostMin: costs.jointBayCost.min,
      jointBayCostMax: costs.jointBayCost.max,
      roadCrossingCostMin: costs.roadCrossingCost.min,
      roadCrossingCostMax: costs.roadCrossingCost.max,
      terminationCostMin: costs.terminationCost.min,
      terminationCostMax: costs.terminationCost.max,
      hvTerminationCostMin: costs.hvTerminationCost.min,
      hvTerminationCostMax: costs.hvTerminationCost.max,
      wayleavesCostMin: costs.wayleavesCost.min,
      wayleavesCostMax: costs.wayleavesCost.max,
      landRightsCostMin: costs.landRightsCost.min,
      landRightsCostMax: costs.landRightsCost.max,
      totalCostMin: costs.totalCost.min,
      totalCostMax: costs.totalCost.max,
    });
  }, [distance, cableVoltage, stepDownVoltage, stepUpTransformerCount, stepDownTransformerCount, roadPercentage, roadCrossings, includeStepDownInstallation]);

  const CostSummaryCard = ({ label, min, max, source }: { label: string; min: number; max: number; source?: string }) => (
    <div className="p-3 bg-slate-50 rounded-lg border">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-600 font-medium">{label}</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {formatCurrency(min)} - {formatCurrency(max)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Average: {formatCurrency((min + max) / 2)}
          </p>
        </div>
        {source && setShowSourceInfo && (
          <button
            onClick={() => setShowSourceInfo(source)}
            className="ml-2 flex-shrink-0 text-blue-500 hover:text-blue-700 p-0.5"
            title="View source information"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Grid Connection Cost Calculator</CardTitle>
        <CardDescription>Configure your private wire infrastructure parameters - costs auto-update in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="parameters" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-6 mt-4">
            {/* Cable Voltage Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Cable Voltage (kV)</Label>
              <div className="grid grid-cols-5 gap-2">
                {CABLE_VOLTAGE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setCableVoltage(v)}
                    className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                      cableVoltage === v
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {v} kV
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Selected cable voltage: <span className="font-semibold">{cableVoltage} kV</span>
              </p>
            </div>

            {/* Step-Up Transformer (Solar to Cable Voltage) */}
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Step-Up Transformers (0.4 kV → {cableVoltage} kV)</Label>
                <span className="text-2xl font-bold text-amber-600">{stepUpTransformerCount}</span>
              </div>
              <Slider
                value={[stepUpTransformerCount]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setStepUpTransformerCount(v[0])}
                className="w-full"
              />
              <p className="text-xs text-amber-900">
                Converts solar output voltage (0.4 kV) to transmission voltage ({cableVoltage} kV)
              </p>
            </div>

            {/* Step-Down Transformer Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Step-Down Transformers ({cableVoltage} kV → End-User Voltage)</Label>
              <div className="grid grid-cols-3 gap-2">
                {STEPDOWN_VOLTAGE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setStepDownVoltage(v)}
                    className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                      stepDownVoltage === v
                        ? "border-green-500 bg-green-50 text-green-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {v} kV
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Selected end-user voltage: <span className="font-semibold">{stepDownVoltage} kV</span>
              </p>
            </div>

            {/* Step-Down Transformer Count */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Number of Step-Down Transformers</Label>
                <span className="text-2xl font-bold text-green-600">{stepDownTransformerCount}</span>
              </div>
              <Slider
                value={[stepDownTransformerCount]}
                min={1}
                max={10}
                step={1}
                onValueChange={(v) => setStepDownTransformerCount(v[0])}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Number of connection points for end-users</p>
            </div>

            {/* Step-Down Transformer Installation Checkbox */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
              <Checkbox
                id="stepdown-installation"
                checked={includeStepDownInstallation}
                onCheckedChange={(checked) => setIncludeStepDownInstallation(checked as boolean)}
              />
              <Label htmlFor="stepdown-installation" className="cursor-pointer text-sm">
                <span className="font-semibold">Include Step-Down Transformer Installation Costs</span>
                <p className="text-xs text-slate-600 mt-1">
                  Adds proportional costs for transformer sites, civil works, and connections
                </p>
              </Label>
            </div>

            {/* Cable Distance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Cable Distance (km)</Label>
                <span className="text-2xl font-bold text-purple-600">{distance.toFixed(1)} km</span>
              </div>
              <Slider
                value={[distance]}
                min={0.5}
                max={20}
                step={0.1}
                onValueChange={(v) => setDistance(v[0])}
                className="w-full"
              />
            </div>

            {/* Road Percentage */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Road Percentage</Label>
                <span className="text-2xl font-bold text-indigo-600">{roadPercentage}%</span>
              </div>
              <Slider
                value={[roadPercentage]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setRoadPercentage(v[0])}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                <div>Agricultural: {((100 - roadPercentage) * distance / 100).toFixed(1)} km</div>
                <div>Road: {(roadPercentage * distance / 100).toFixed(1)} km</div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-semibold">Wayleaves:</span> {formatCurrency((100 - roadPercentage) * distance / 100 * 150)} - {formatCurrency((100 - roadPercentage) * distance / 100 * 400)} per year
              </p>
            </div>

            {/* Major Road Crossings */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Major Road Crossings</Label>
                <span className="text-2xl font-bold text-purple-600">{roadCrossings}</span>
              </div>
              <Slider
                value={[roadCrossings]}
                min={0}
                max={5}
                step={1}
                onValueChange={(v) => setRoadCrossings(v[0])}
                className="w-full"
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">
                Costs are calculated based on SSEN charging statements (2024-25) and ENA wayleave rates. All costs are updated in real-time as you adjust parameters.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Cable Infrastructure</h3>
              <CostSummaryCard
                label="Cable (Trenching + Installation)"
                min={costs.cableCost.min}
                max={costs.cableCost.max}
                source="cable-ssen"
              />
              <CostSummaryCard
                label="Joint Bays"
                min={costs.jointBayCost.min}
                max={costs.jointBayCost.max}
                source="joint-bay-standards"
              />
              <CostSummaryCard
                label="Road Crossings (Directional Drill)"
                min={costs.roadCrossingCost.min}
                max={costs.roadCrossingCost.max}
                source="directional-drill"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Transformers & Connections</h3>
              <CostSummaryCard
                label={`Step-Up Transformers (0.4 → ${cableVoltage} kV) x${stepUpTransformerCount}`}
                min={costs.stepUpCost.min}
                max={costs.stepUpCost.max}
                source="transformer-market"
              />
              <CostSummaryCard
                label={`Step-Down Transformers (${cableVoltage} → ${stepDownVoltage} kV) x${stepDownTransformerCount}`}
                min={costs.stepDownCost.min}
                max={costs.stepDownCost.max}
                source="transformer-market"
              />
              {includeStepDownInstallation && (
                <CostSummaryCard
                  label={`Step-Down Installation (Civil + Connections) x${stepDownTransformerCount}`}
                  min={costs.stepDownInstallationCost.min}
                  max={costs.stepDownInstallationCost.max}
                  source="termination-ssen"
                />
              )}
              <CostSummaryCard
                label="Cable Terminations"
                min={costs.terminationCost.min}
                max={costs.terminationCost.max}
                source="directional-drill"
              />
              <CostSummaryCard
                label={`HV Terminations at End-User Sites x${stepDownTransformerCount}`}
                min={costs.hvTerminationCost.min}
                max={costs.hvTerminationCost.max}
                source="directional-drill"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Land & Regulatory</h3>
              <CostSummaryCard
                label="Annual Wayleaves (Agricultural Land)"
                min={costs.wayleavesCost.min}
                max={costs.wayleavesCost.max}
                source="wayleave-ena"
              />
              <CostSummaryCard
                label="Land Rights & Planning"
                min={costs.landRightsCost.min}
                max={costs.landRightsCost.max}
                source="land-rights-ssen"
              />
            </div>

            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border-2 border-slate-700">
              <p className="text-xs text-slate-300 font-medium mb-2">TOTAL GRID CONNECTION COST</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(costs.totalCost.min)} - {formatCurrency(costs.totalCost.max)}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Average: {formatCurrency((costs.totalCost.min + costs.totalCost.max) / 2)}
              </p>
              <p className="text-xs text-slate-500 mt-3 border-t border-slate-700 pt-2">
                <span className="font-semibold">Note:</span> Wayleaves are annual costs. Total shown includes one year of wayleave payments.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
