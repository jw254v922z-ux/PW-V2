import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SensitivityMatrix, getHeatmapColor } from "@/lib/sensitivity";
import { SolarInputs } from "@/lib/calculator";

interface SensitivityHeatmapProps {
  matrix: SensitivityMatrix;
  currentInputs?: SolarInputs;
  currentResults?: { lcoe: number; irr: number };
  title?: string;
  metric?: "lcoe" | "irr";
}

export function SensitivityHeatmap({ 
  matrix, 
  currentInputs,
  currentResults,
  title = "Sensitivity Analysis", 
  metric = "lcoe" 
}: SensitivityHeatmapProps) {
  const cellSize = 50;
  const labelWidth = 80;
  const labelHeight = 40;
  
  // Determine current scenario based on inputs
  let currentVoltageIdx = matrix.voltages.indexOf(33); // Default 33kV
  let currentDistanceIdx = 4; // Default ~5km
  
  // Use actual voltage and distance from inputs if available
  if (currentInputs?.cableVoltageKV) {
    const voltageIdx = matrix.voltages.indexOf(currentInputs.cableVoltageKV);
    if (voltageIdx >= 0) currentVoltageIdx = voltageIdx;
  }
  
  if (currentInputs?.distanceKm) {
    // Find exact match first
    let distanceIdx = matrix.distances.indexOf(currentInputs.distanceKm);
    
    // If no exact match, find the closest distance
    if (distanceIdx < 0) {
      let closestDistance = matrix.distances[0];
      let closestIdx = 0;
      let minDiff = Math.abs(currentInputs.distanceKm - closestDistance);
      
      for (let i = 1; i < matrix.distances.length; i++) {
        const diff = Math.abs(currentInputs.distanceKm - matrix.distances[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closestDistance = matrix.distances[i];
          closestIdx = i;
        }
      }
      distanceIdx = closestIdx;
    }
    
    if (distanceIdx >= 0) currentDistanceIdx = distanceIdx;
  }

  const data = metric === "lcoe" ? matrix.lcoeData : matrix.irrData;
  const minValue = metric === "lcoe" ? matrix.minLcoe : matrix.minIrr;
  const maxValue = metric === "lcoe" ? matrix.maxLcoe : matrix.maxIrr;
  const unit = metric === "lcoe" ? "£/MWh" : "%";
  const metricTitle = metric === "lcoe" ? "LCOE Sensitivity Analysis" : "IRR Sensitivity Analysis";
  const metricDesc = metric === "lcoe" 
    ? "Levelized Cost of Energy (£/MWh) across different cable voltages and distances"
    : "Internal Rate of Return (%) across different cable voltages and distances";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || metricTitle}</CardTitle>
        <CardDescription>{metricDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Header with voltage labels */}
            <div className="flex">
              <div style={{ width: labelWidth }} />
              {matrix.voltages.map((voltage) => (
                <div
                  key={`header-${voltage}`}
                  style={{ width: cellSize }}
                  className="flex items-center justify-center font-semibold text-sm text-center"
                >
                  {voltage}kV
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {matrix.distances.map((distance, distanceIdx) => (
              <div key={`row-${distance}`} className="flex">
                {/* Distance label */}
                <div
                  style={{ width: labelWidth, height: cellSize }}
                  className="flex items-center justify-center font-semibold text-sm border-r border-gray-200"
                >
                  {distance}km
                </div>

                {/* Heatmap cells */}
                {data[distanceIdx].map((value, voltageIdx) => {
                  const isCurrentScenario =
                    distanceIdx === currentDistanceIdx && voltageIdx === currentVoltageIdx;
                  const color = getHeatmapColor(value, minValue, maxValue, metric === 'irr');
                  
                  const displayValue = metric === "lcoe" 
                    ? `£${value.toFixed(0)}`
                    : `${(value * 100).toFixed(1)}%`;

                  return (
                    <div
                      key={`cell-${distance}-${matrix.voltages[voltageIdx]}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: color,
                        border: isCurrentScenario ? "3px solid #000" : "1px solid #e5e7eb",
                      }}
                      className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative group"
                      title={`${matrix.voltages[voltageIdx]}kV, ${distance}km: ${displayValue} ${unit}`}
                    >
                      <span className="text-xs font-semibold text-gray-900">
                        {displayValue}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        {matrix.voltages[voltageIdx]}kV, {distance}km
                        <br />
                        {metric === "lcoe" ? "LCOE" : "IRR"}: {displayValue} {unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold">Legend:</div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                style={{ width: 30, height: 30, backgroundColor: "rgb(0, 255, 0)" }}
                className="border border-gray-300"
              />
              <span className="text-sm">
                {metric === "lcoe" ? "Low Cost" : "High Return"} ({minValue.toFixed(1)}{unit})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{ width: 30, height: 30, backgroundColor: "rgb(255, 200, 0)" }}
                className="border border-gray-300"
              />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{ width: 30, height: 30, backgroundColor: "rgb(255, 0, 0)" }}
                className="border border-gray-300"
              />
              <span className="text-sm">
                {metric === "lcoe" ? "High Cost" : "Low Return"} ({maxValue.toFixed(1)}{unit})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{ width: 30, height: 30, border: "3px solid #000" }}
                className="bg-gray-100"
              />
              <span className="text-sm">Current Scenario</span>
            </div>
          </div>
        </div>

        {/* Current Scenario Info */}
        {currentResults && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-semibold text-green-900 mb-2">Current Project Scenario:</div>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <span className="font-semibold">LCOE:</span> £{currentResults.lcoe.toFixed(2)}/MWh
              </div>
              <div>
                <span className="font-semibold">IRR:</span> {currentResults.irr.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-2">Key Insights:</div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Best {metric === "lcoe" ? "LCOE" : "IRR"}: {minValue.toFixed(2)}{unit}</li>
            <li>• Worst {metric === "lcoe" ? "LCOE" : "IRR"}: {maxValue.toFixed(2)}{unit}</li>
            <li>• Range: {(maxValue - minValue).toFixed(2)}{unit}</li>
            <li>• {metric === "lcoe" 
              ? "Lower voltages and shorter distances generally reduce costs" 
              : "Higher voltages and shorter distances generally improve returns"}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
