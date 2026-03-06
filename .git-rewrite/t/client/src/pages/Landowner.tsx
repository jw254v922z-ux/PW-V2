import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "../components/MetricCard";
import { Leaf, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SolarResults } from "@/lib/calculator";

interface LandownerPageProps {
  results: SolarResults;
}

export default function LandownerPage({ results }: LandownerPageProps) {
  const { totalLandOptionIncome, landOptionYield } = results.summary;

  return (
    <div className="space-y-6">
      {/* Landowner Key Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="Total Yearly Land Options Income" 
          value={formatCurrency(totalLandOptionIncome)} 
          icon={Leaf}
          className="bg-white/5 border-l-green-500 text-white border-white/10 backdrop-blur-sm"
        />
        <MetricCard 
          title="Land Option Yield" 
          value={landOptionYield.toFixed(2) + "%"} 
          icon={TrendingUp}
          className="bg-white/5 border-l-emerald-400 text-white border-white/10 backdrop-blur-sm"
        />
      </div>

      {/* Landowner Information Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Landowner Benefits</CardTitle>
          <CardDescription>Financial metrics for landowners participating in this solar project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Total Land Option Income</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalLandOptionIncome)}</p>
              <p className="text-xs text-gray-500 mt-1">Over project lifetime</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Annual Land Option Yield</p>
              <p className="text-2xl font-bold text-white">{landOptionYield.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">As percentage of project CAPEX</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-sm text-gray-300">
              Land option income represents the annual payments made to landowners for use of their land. 
              The yield metric shows this income as a percentage of the total project capital expenditure, 
              providing a measure of the financial return to the landowner relative to the project's investment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
