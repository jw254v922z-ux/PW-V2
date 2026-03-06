import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { YearData } from "@/lib/calculator";
import { formatCurrency, formatNumberWithCommas } from "@/lib/formatters";

interface CashFlowTableProps {
  yearlyData: YearData[];
  projectName?: string;
}

export function CashFlowTable({ yearlyData, projectName = "Solar Project" }: CashFlowTableProps) {
  const handleExportCSV = () => {
    // Create CSV header
    const headers = [
      "Year",
      "Generation (MWh)",
      "OPEX (£)",
      "Revenue (£)",
      "Nominal Cash Flow (£)",
      "Discount Factor",
      "Discounted Cost (£)",
      "Discounted Energy (MWh)",
      "Discounted Revenue (£)",
      "Discounted Cash Flow (£)",
      "Cumulative Discounted Cash Flow (£)",
    ];

    // Create CSV rows
    const rows = yearlyData.map((year) => [
      year.year,
      year.generation.toFixed(2),
      year.opex.toFixed(2),
      year.revenue.toFixed(2),
      year.cashFlow.toFixed(2),
      year.discountFactor.toFixed(4),
      year.discountedCost.toFixed(2),
      year.discountedEnergy.toFixed(2),
      year.discountedRevenue.toFixed(2),
      year.discountedCashFlow.toFixed(2),
      year.cumulativeDiscountedCashFlow.toFixed(2),
    ]);

    // Combine headers and rows
    const csvContent = [
      [`${projectName} - Cash Flow Analysis`],
      [],
      headers,
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${projectName}-cashflow.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Detailed Cash Flow Analysis</CardTitle>
          <CardDescription>Year-by-year breakdown of generation, costs, revenue, and cash flows</CardDescription>
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Year</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Gen (MWh)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Project CF (£)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Offtaker Sav. (£)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Land Rent (£)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Discount Factor</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Disc. Project CF (£)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-900">Cum. DCF (£)</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((year, idx) => (
                <tr
                  key={year.year}
                  className={`border-b border-slate-200 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-3 py-2 font-semibold text-slate-900">{year.year}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatNumberWithCommas(year.generation.toFixed(0))}
                  </td>
                  <td className="px-3 py-2 text-right text-purple-700 font-medium">
                    {formatCurrency(year.cashFlow)}
                  </td>
                  <td className="px-3 py-2 text-right text-green-700 font-medium">
                    {formatCurrency(year.savings || 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-700 font-medium">
                    {formatCurrency(year.landIncome || 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700 text-xs">
                    {year.discountFactor.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatCurrency(year.discountedCashFlow)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900 font-bold">
                    {formatCurrency(year.cumulativeDiscountedCashFlow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-slate-600 font-semibold">Total Generation</div>
            <div className="text-lg font-bold text-blue-900 mt-1">
              {formatNumberWithCommas(
                yearlyData.reduce((sum, y) => sum + y.generation, 0).toFixed(0)
              )}{" "}
              MWh
            </div>
          </div>
          <div className="p-3 bg-red-50 rounded border border-red-200">
            <div className="text-xs text-slate-600 font-semibold">Total OPEX</div>
            <div className="text-lg font-bold text-red-900 mt-1">
              {formatCurrency(yearlyData.reduce((sum, y) => sum + y.opex, 0))}
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <div className="text-xs text-slate-600 font-semibold">Total Revenue</div>
            <div className="text-lg font-bold text-green-900 mt-1">
              {formatCurrency(yearlyData.reduce((sum, y) => sum + y.revenue, 0))}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <div className="text-xs text-slate-600 font-semibold">Total Discounted Cash Flow</div>
            <div className="text-lg font-bold text-purple-900 mt-1">
              {formatCurrency(
                yearlyData[yearlyData.length - 1]?.cumulativeDiscountedCashFlow || 0
              )}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-sm font-semibold text-amber-900 mb-2">Key Metrics:</div>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>
              • Payback Period: Year{" "}
              {yearlyData.find((y) => y.cumulativeDiscountedCashFlow > 0)?.year || "Not achieved"}
            </li>
            <li>
              • Average Annual Generation:{" "}
              {formatNumberWithCommas(
                (yearlyData.reduce((sum, y) => sum + y.generation, 0) / yearlyData.length).toFixed(
                  0
                )
              )}{" "}
              MWh
            </li>
            <li>
              • Average Annual Revenue:{" "}
              {formatCurrency(
                yearlyData.reduce((sum, y) => sum + y.revenue, 0) / yearlyData.length
              )}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
