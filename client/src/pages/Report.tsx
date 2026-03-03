import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";

interface ReportData {
  projectName: string;
  projectDescription: string;
  inputs: any;
  results: any;
}

export default function Report() {
  const [, navigate] = useLocation();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedData = sessionStorage.getItem("reportData");
    if (storedData) {
      try {
        setReportData(JSON.parse(storedData));
      } catch (error) {
        console.error("Error loading report data:", error);
      }
    }
    setLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading report...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">No Report Data</h1>
          <p className="text-slate-600 mb-6">Please generate a report from the calculator first.</p>
          <Button onClick={() => navigate("/")} variant="default">
            Back to Calculator
          </Button>
        </div>
      </div>
    );
  }

  const { projectName, projectDescription, inputs, results } = reportData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate stakeholder values
  const operatorNPV = results?.projectNPV || 0;
  const offtakerSavings = results?.totalOfftakerSavings || 0;
  const landownerIncome = results?.totalLandownerIncome || 0;
  const developerPremium = (inputs?.systemSize || 0) * (inputs?.devPremiumPerMW || 0) * (1 - (inputs?.devPremiumDiscount || 0) / 100);
  const totalValue = operatorNPV + offtakerSavings + landownerIncome + developerPremium;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{projectName || "Solar Project"}</h1>
            {projectDescription && <p className="text-slate-300 mt-1">{projectDescription}</p>}
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePrint} variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">Total CAPEX</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(results?.totalCapex || 0)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">LCOE (Real)</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">£{(results?.lcoe || 0).toFixed(0)}/MWh</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">IRR (Unlevered)</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{((results?.irr || 0) * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">Payback Period</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {(results?.paybackPeriod || 0) > (inputs?.projectLife || 25) ? "> Project Life" : `${(results?.paybackPeriod || 0).toFixed(1)} Years`}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">Total NPV</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(results?.projectNPV || 0)}</p>
          </div>
        </div>

        {/* Stakeholder Summary */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Stakeholder Value Distribution</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-slate-200">
              <p className="text-sm text-slate-600">Operator</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(operatorNPV)}</p>
              <p className="text-xs text-slate-500 mt-1">{totalValue > 0 ? ((operatorNPV / totalValue) * 100).toFixed(1) : "0"}% of total</p>
            </div>
            <div className="bg-white p-4 rounded border border-slate-200">
              <p className="text-sm text-slate-600">Offtaker</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(offtakerSavings)}</p>
              <p className="text-xs text-slate-500 mt-1">{totalValue > 0 ? ((offtakerSavings / totalValue) * 100).toFixed(1) : "0"}% of total</p>
            </div>
            <div className="bg-white p-4 rounded border border-slate-200">
              <p className="text-sm text-slate-600">Landowner</p>
              <p className="text-lg font-bold text-yellow-600">{formatCurrency(landownerIncome)}</p>
              <p className="text-xs text-slate-500 mt-1">{totalValue > 0 ? ((landownerIncome / totalValue) * 100).toFixed(1) : "0"}% of total</p>
            </div>
            <div className="bg-white p-4 rounded border border-slate-200">
              <p className="text-sm text-slate-600">Developer</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(developerPremium)}</p>
              <p className="text-xs text-slate-500 mt-1">{totalValue > 0 ? ((developerPremium / totalValue) * 100).toFixed(1) : "0"}% of total</p>
            </div>
          </div>
        </div>

        {/* Project Parameters */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Project Parameters</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 font-medium">System Size</p>
              <p className="text-lg font-bold text-slate-900">{(inputs?.systemSize || 0).toFixed(2)} MW</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Project Life</p>
              <p className="text-lg font-bold text-slate-900">{inputs?.projectLife || 25} Years</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">EPC Cost per MW</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(inputs?.epcCostPerMW || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">PPA Price</p>
              <p className="text-lg font-bold text-slate-900">£{(inputs?.ppaPricePerMWh || 0).toFixed(0)}/MWh</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Discount Rate</p>
              <p className="text-lg font-bold text-slate-900">{(inputs?.discountRate || 0).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Cost Inflation (CPI)</p>
              <p className="text-lg font-bold text-slate-900">{(inputs?.costInflationRate || 0).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <p className="text-sm text-slate-700">
            <strong>Disclaimer:</strong> This report contains indicative projections based on January 2026 data and assumptions. These projections are not suitable for investment decisions without professional verification and should not be relied upon as the sole basis for any financial decision. All figures are subject to change based on market conditions, regulatory changes, and other factors.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">Produced by Savills Earth</p>
          <p className="text-xs text-slate-400 mt-1">© 2026 Savills plc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
