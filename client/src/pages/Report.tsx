import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { SolarInputs, SolarResults } from "@/lib/calculator";
import { formatCurrency } from "@/lib/formatters";

interface ReportData {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
}

export default function Report() {
  const [, navigate] = useLocation();
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("reportData");
    if (data) {
      try {
        setReportData(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse report data:", e);
      }
    }
  }, []);

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calculator
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-600">No report data available. Please generate a report from the calculator.</p>
          </div>
        </div>
      </div>
    );
  }

  const { inputs, results, projectName } = reportData;

  // Calculate stakeholder values
  const operatorNPV = Math.max(0, results.summary.totalDiscountedCashFlow);
  const offtakerSavings = Math.max(0, results.summary.totalSavings);
  const landownerIncome = Math.max(0, results.summary.totalLandOptionIncome);
  const developerPremium = Math.max(0, results.summary.totalDeveloperPremium);
  const totalValue = operatorNPV + offtakerSavings + landownerIncome + developerPremium;

  const stakeholderData = [
    {
      name: "Operator",
      value: operatorNPV,
      color: "#808080",
      percentage: totalValue > 0 ? (operatorNPV / totalValue) * 100 : 0,
    },
    {
      name: "Offtaker",
      value: offtakerSavings,
      color: "#2D8659",
      percentage: totalValue > 0 ? (offtakerSavings / totalValue) * 100 : 0,
    },
    {
      name: "Landowner",
      value: landownerIncome,
      color: "#FFD700",
      percentage: totalValue > 0 ? (landownerIncome / totalValue) * 100 : 0,
    },
    {
      name: "Developer",
      value: developerPremium,
      color: "#001F3F",
      percentage: totalValue > 0 ? (developerPremium / totalValue) * 100 : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-16">
        {/* PAGE 1: KEY METRICS */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Total CAPEX</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(results.summary.totalCapex)}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">LCOE (Real)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                £{results.summary.lcoe.toFixed(0)}/MWh
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">IRR (Unlevered)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(results.summary.irr * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Payback Period</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {results.summary.paybackPeriod.toFixed(1)} Years
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Total NPV</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(results.summary.totalNPV || 0)}
              </p>
            </div>
          </div>
        </section>

        {/* PAGE 2: STAKEHOLDER VALUE DISTRIBUTION */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Stakeholder Value Distribution</h2>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 p-8 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              {stakeholderData.map((stakeholder) => (
                <div
                  key={stakeholder.name}
                  className="p-4 rounded-lg text-white"
                  style={{ backgroundColor: stakeholder.color }}
                >
                  <h3 className="font-bold text-lg">{stakeholder.name}</h3>
                  <p className="text-sm mt-2">{formatCurrency(stakeholder.value)}</p>
                  <p className="text-sm font-semibold">{stakeholder.percentage.toFixed(1)}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAGE 3: CASH FLOW ANALYSIS */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Cash Flow Analysis</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Year</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Generation (MWh)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Revenue</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">OPEX</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Net Cash Flow</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Discounted CF</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Cumulative DCF</th>
                </tr>
              </thead>
              <tbody>
                {results.yearlyData.map((yearData, idx) => (
                  <tr
                    key={yearData.year}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium">{yearData.year}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {yearData.generation.toFixed(0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(yearData.revenue)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(yearData.opex)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(yearData.cashFlow)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(yearData.discountedCashFlow)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-semibold">
                      {formatCurrency(yearData.cumulativeCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PAGE 4: STAKEHOLDER CASH FLOW SUMMARY */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Cash Flow Summary by Stakeholder</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stakeholderData.map((stakeholder) => (
              <div
                key={stakeholder.name}
                className="p-6 rounded-lg text-white"
                style={{ backgroundColor: stakeholder.color }}
              >
                <h3 className="font-bold text-lg mb-3">{stakeholder.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total NPV:</span>
                    <span className="font-semibold">{formatCurrency(stakeholder.value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span className="font-semibold">{stakeholder.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PAGE 5: KEY ASSUMPTIONS */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Key Assumptions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {[
                  ["Project Life", `${inputs.projectLife} years`],
                  ["Installed Capacity", `${(inputs.mw || 0).toFixed(2)} MWp`],
                  ["CAPEX per MW", `£${(inputs.capexPerMW || 0).toFixed(0)}`],
                  ["OPEX per MW (Year 1)", `£${(inputs.opexPerMW || 0).toFixed(0)}`],
                  ["Cost Inflation Rate (CPI)", `${(inputs.costInflationRate || 0).toFixed(2)}%`],
                  ["Generation Degradation", `${(inputs.degradationRate || 0).toFixed(4)}% p.a.`],
                  ["PPA Price", `£${(inputs.powerPrice || 0).toFixed(2)}/MWh`],
                  ["Discount Rate", `${(inputs.discountRate || 0).toFixed(2)}%`],
                ].map((row, idx) => (
                  <tr
                    key={row[0]}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-4 py-3 text-sm font-medium w-1/2">
                      {row[0]}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                      {row[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PAGE 6: DATA SOURCES */}
        <section className="space-y-6">
          <div className="border-b-4 border-yellow-400 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Data Sources & Methodology</h2>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <p>• Grid connection costs: SSEN Distribution Cost Estimates (2025)</p>
            <p>• Solar irradiance: UK Met Office historical averages</p>
            <p>• EPC costs: Industry benchmarks (2026)</p>
            <p>• Transformer costs: Manufacturer quotes</p>
            <p>• Cable costs: Supplier pricing data</p>
            <p>• Financial calculations: NPV at specified discount rate, IRR via iterative method</p>
            <p>• All costs are updated in real-time as parameters are adjusted</p>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <h3 className="font-bold text-gray-900 mb-3">Disclaimer</h3>
            <p className="text-sm text-gray-700">
              This report contains indicative projections based on January 2026 data and assumptions. These projections are not suitable for investment decisions without professional verification and should not be relied upon as the sole basis for any financial decision. All figures are subject to change based on market conditions, regulatory changes, and other factors.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 pt-8 mt-12 text-center text-sm text-gray-600">
          <p>Produced by Savills Earth</p>
          <p>© 2026 Savills plc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
