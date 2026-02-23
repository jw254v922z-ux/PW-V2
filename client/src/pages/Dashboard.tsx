import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateSolarModel, defaultInputs, SolarInputs, SolarResults } from "@/lib/calculator";
import { getSourceDetails } from '@/lib/sources';
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumberWithCommas } from "@/lib/formatters";
import { AlertCircle, Info, BatteryCharging, Coins, Download, Factory, Save, Trash2, Zap, LogOut, Leaf, TrendingUp, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { GridConnectionCostBreakdown } from "../components/GridConnectionCostBreakdown";
import { GridConnectionSliders, type GridConnectionCosts } from "../components/GridConnectionSliders";
import { SensitivityHeatmap } from "../components/SensitivityHeatmap";
import { CashFlowTable } from "../components/CashFlowTable";
import { StakeholderValueChart } from "../components/StakeholderValueChart";
import LandownerPage from "./Landowner";
import { calculateSensitivityMatrix } from "@/lib/sensitivity";
import { generatePDFReport } from "@/lib/pdfReport";
import { captureMapScreenshotWithTimeout } from "@/lib/mapScreenshotWithTimeout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [inputs, setInputs] = useState<SolarInputs>(defaultInputs);
  const [results, setResults] = useState<SolarResults>(calculateSolarModel(defaultInputs));
  const [sensitivityMatrix, setSensitivityMatrix] = useState(calculateSensitivityMatrix(defaultInputs));
  const [modelName, setModelName] = useState("My Solar Model");
  const [modelDescription, setModelDescription] = useState("");
  const [currentModelId, setCurrentModelId] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState<string | null>(null);
  const [gridConnectionCosts, setGridConnectionCosts] = useState<GridConnectionCosts | null>(null);

  const { data: savedModels = [], refetch: refetchModels } = trpc.solar.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createModelMutation = trpc.solar.create.useMutation({
    onSuccess: () => {
      toast.success("Model saved successfully!");
      refetchModels();
      setShowSaveDialog(false);
      setModelName("My Solar Model");
      setModelDescription("");
    },
    onError: (error) => {
      toast.error("Failed to save model: " + error.message);
    },
  });

  const updateModelMutation = trpc.solar.update.useMutation({
    onSuccess: () => {
      toast.success("Model updated successfully!");
      refetchModels();
      setShowSaveDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to update model: " + error.message);
    },
  });

  const deleteModelMutation = trpc.solar.delete.useMutation({
    onSuccess: () => {
      toast.success("Model deleted successfully!");
      refetchModels();
      if (currentModelId) setCurrentModelId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete model: " + error.message);
    },
  });

  const loadModel = trpc.solar.get.useQuery(
    { id: currentModelId! },
    { enabled: currentModelId !== null && isAuthenticated }
  );

  useEffect(() => {
    if (loadModel.data) {
      const model = loadModel.data;
      setInputs({
        mw: model.mw,
        capexPerMW: model.capexPerMW,
        privateWireCost: model.privateWireCost,
        gridConnectionCost: model.gridConnectionCost,
        developmentPremiumPerMW: model.developmentPremiumPerMW,
        developmentPremiumEnabled: true,
        developmentPremiumDiscount: 0,
        landOptionCostPerMWYear: 0,
        landOptionEnabled: false,
        landOptionDiscount: 0,
        costInflationRate: 2.5,
        opexPerMW: model.opexPerMW,
        opexEscalation: parseFloat(model.opexEscalation),
        generationPerMW: parseFloat(model.generationPerMW),
        irradianceOverride: 0,
        degradationRate: parseFloat(model.degradationRate),
        projectLife: model.projectLife,
        discountRate: parseFloat(model.discountRate),
        powerPrice: model.powerPrice,
        percentConsumptionPPA: model.percentConsumptionPPA || 100,
        percentConsumptionExport: model.percentConsumptionExport || 0,
        exportPrice: model.exportPrice || 50,
        offsetableEnergyCost: model.offsetableEnergyCost || 120,
        offsetableEnergyCPI: 2.5,
        gridCostOverrideEnabled: false,
        gridCostOverride: 0,
        landValue: 0,
      });
      setModelName(model.name);
      setModelDescription(model.description || "");
    }
  }, [loadModel.data]);

  useEffect(() => {
    const mapResultsStr = sessionStorage.getItem('mapResults');
    console.log('[Dashboard] mapResults from sessionStorage:', mapResultsStr);
    if (mapResultsStr) {
      try {
        const mapResults = JSON.parse(mapResultsStr);
        console.log('[Dashboard] Parsed mapResults:', mapResults);
        if (mapResults.systemSize !== null && mapResults.systemSize !== undefined) {
          setInputs(prev => ({ ...prev, mw: mapResults.systemSize }));
          toast.success(`System size: ${mapResults.systemSize.toFixed(2)} MW from map`);
        }
        if (mapResults.cableDistance !== null && mapResults.cableDistance !== undefined) {
          console.log('[Dashboard] Setting cable distance to:', mapResults.cableDistance);
          setInputs(prev => ({ ...prev, distanceKm: mapResults.cableDistance }));
          toast.success(`Cable distance: ${mapResults.cableDistance.toFixed(2)} km from map`);
        }
        sessionStorage.removeItem('mapResults');
      } catch (error) {
        console.error('[Dashboard] Failed to parse map results:', error);
      }
    }
  }, []);

  useEffect(() => {
    setResults(calculateSolarModel(inputs));
    setSensitivityMatrix(calculateSensitivityMatrix(inputs));
  }, [inputs]);

  const handleInputChange = (key: keyof SolarInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveModel = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (currentModelId) {
      updateModelMutation.mutate({
        id: currentModelId,
        name: modelName,
        description: modelDescription,
        mw: inputs.mw,
        capexPerMW: inputs.capexPerMW,
        privateWireCost: inputs.privateWireCost,
        gridConnectionCost: inputs.gridConnectionCost,
        developmentPremiumPerMW: inputs.developmentPremiumPerMW,
        opexPerMW: inputs.opexPerMW,
        opexEscalation: inputs.opexEscalation.toString(),
        generationPerMW: inputs.generationPerMW.toString(),
        degradationRate: inputs.degradationRate.toString(),
        projectLife: inputs.projectLife,
        discountRate: inputs.discountRate.toString(),
        powerPrice: inputs.powerPrice,
        percentConsumptionPPA: inputs.percentConsumptionPPA,
        percentConsumptionExport: inputs.percentConsumptionExport,
        exportPrice: inputs.exportPrice,
        lcoe: results.summary.lcoe.toFixed(2),
        irr: (results.summary.irr * 100).toFixed(2),
        paybackPeriod: results.summary.paybackPeriod.toFixed(1),
        totalNpv: results.summary.totalDiscountedCashFlow.toFixed(0),
      });
    } else {
      createModelMutation.mutate({
        name: modelName,
        description: modelDescription,
        mw: inputs.mw,
        capexPerMW: inputs.capexPerMW,
        privateWireCost: inputs.privateWireCost,
        gridConnectionCost: inputs.gridConnectionCost,
        developmentPremiumPerMW: inputs.developmentPremiumPerMW,
        opexPerMW: inputs.opexPerMW,
        opexEscalation: inputs.opexEscalation.toString(),
        generationPerMW: inputs.generationPerMW.toString(),
        degradationRate: inputs.degradationRate.toString(),
        projectLife: inputs.projectLife,
        discountRate: inputs.discountRate.toString(),
        powerPrice: inputs.powerPrice,
        percentConsumptionPPA: inputs.percentConsumptionPPA,
        percentConsumptionExport: inputs.percentConsumptionExport,
        exportPrice: inputs.exportPrice,
        lcoe: results.summary.lcoe.toFixed(2),
        irr: (results.summary.irr * 100).toFixed(2),
        paybackPeriod: results.summary.paybackPeriod.toFixed(1),
        totalNpv: results.summary.totalDiscountedCashFlow.toFixed(0),
      });
    }
  };

  const handleDeleteModel = (id: number) => {
    if (confirm("Are you sure you want to delete this model?")) {
      deleteModelMutation.mutate({ id });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number, decimals = 2) => {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: decimals }).format(val);
  };



  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Generating PDF...');
      // Generate PDF and trigger download
      const doc = generatePDFReport({ 
        inputs, 
        results, 
        projectName: modelName || 'Solar Project', 
        description: modelDescription,
        mapScreenshot: undefined
      });
      
      // Convert PDF to blob and trigger download using anchor element
      const filename = `${modelName || 'Solar Project'}-report.pdf`;
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Year", "Capex", "Opex", "Generation (MWh)", "Revenue", "Cash Flow", 
      "Cumulative Cash Flow", "Discount Factor", "Discounted Cost", 
      "Discounted Energy", "Discounted Revenue", "Discounted Cash Flow", "Cumulative Discounted CF"
    ];
    
    const rows = results.yearlyData.map(y => [
      y.year, y.capex, y.opex, y.generation, y.revenue, y.cashFlow,
      y.cumulativeCashFlow, y.discountFactor, y.discountedCost,
      y.discountedEnergy, y.discountedRevenue, y.discountedCashFlow, y.cumulativeDiscountedCashFlow
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "solar_model_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [guestMode, setGuestMode] = useState(true); // Public access - guest mode enabled by default

  if (!isAuthenticated && !guestMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Private Wire Solar Calculator</CardTitle>
            <CardDescription>Sign in to save and manage your solar project models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              className="w-full"
              size="lg"
            >
              Sign In with Manus
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-gray-500">or</span>
              </div>
            </div>
            <Button 
              onClick={() => setGuestMode(true)} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue as Guest (Read-Only)
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Guest mode allows you to explore the calculator but you won't be able to save your models.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Disclaimer Banner - Top */}
      <div className="bg-amber-50 dark:bg-amber-950 border-b-2 border-amber-400 p-3">
        <div className="container">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center flex-1">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Disclaimer:</strong> Indicative projections based on Jan 2026 data. Not for investment decisions without professional verification.
                <button onClick={() => setShowDisclaimerModal(true)} className="ml-2 font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer">View full details</button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative bg-slate-900 text-white pb-24 pt-12 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663312201571/FyKDbvLKydspiJJE.jpg" alt="Solar Farm" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900/95" />
        </div>
        
        <div className="container relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display mb-2">
                Private Wire Solar Calculator
              </h1>
              <p className="text-slate-300 max-w-2xl text-lg">
                Welcome, {user?.name || "User"}! Advanced financial modeling for solar assets with private wire integration.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <a href="/map" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Site Mapping
                </a>
              </Button>
              <Button onClick={exportCSV} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              {isAuthenticated && (
                <Button onClick={() => logout()} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              )}
            </div>
          </div>

          {/* Project Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            <MetricCard 
              title="Total CAPEX" 
              value={formatCurrency(results.summary.totalCapex)} 
              icon={Factory}
              className="bg-white/5 border-l-orange-400 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="LCOE (Real)" 
              value={formatCurrency(results.summary.lcoe) + "/MWh"} 
              icon={Coins}
              className="bg-white/5 border-l-emerald-400 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="IRR (Unlevered)" 
              value={(results.summary.irr * 100).toFixed(2) + "%"} 
              icon={Zap}
              className="bg-white/5 border-l-yellow-400 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="Payback Period" 
              value={results.summary.paybackPeriod > inputs.projectLife ? "> Project Life" : results.summary.paybackPeriod.toFixed(1) + " Years"} 
              icon={BatteryCharging}
              className="bg-white/5 border-l-blue-400 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="Total NPV" 
              value={formatCurrency(results.summary.totalDiscountedCashFlow)} 
              icon={Factory}
              className="bg-white/5 border-l-purple-400 text-white border-white/10 backdrop-blur-sm"
            />
          </div>

          {/* Offtaker Banner */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Offtaker</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <MetricCard 
                title="Yearly Savings" 
                value={formatCurrency(results.summary.yearlySavings) + "/year"} 
                icon={Zap}
                className="bg-white/5 border-l-green-400 text-white border-white/10 backdrop-blur-sm"
              />
              <MetricCard 
                title="Total Savings" 
                value={formatCurrency(results.summary.totalSavings)} 
                icon={Zap}
                className="bg-white/5 border-l-emerald-400 text-white border-white/10 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Landowner Banner */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Landowner</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <MetricCard 
              title="Yearly Rental Income" 
              value={formatCurrency(results.summary.yearlyRentalIncome) + "/year"} 
              icon={Leaf}
              className="bg-white/5 border-l-green-500 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="Total Rental Income" 
              value={formatCurrency(results.summary.totalLandOptionIncome)} 
              icon={TrendingUp}
              className="bg-white/5 border-l-emerald-400 text-white border-white/10 backdrop-blur-sm"
            />
            <MetricCard 
              title="Land Rental Yield" 
              value={results.summary.landOptionYield.toFixed(2) + "%"} 
              icon={TrendingUp}
              className="bg-white/5 border-l-blue-400 text-white border-white/10 backdrop-blur-sm"
            />
            </div>
          </div>

          {/* Developer Banner */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Developer</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
            <MetricCard 
              title="Developer Premium" 
              value={formatCurrency(results.summary.totalDeveloperPremium)} 
              icon={Coins}
              className="bg-white/5 border-l-purple-400 text-white border-white/10 backdrop-blur-sm"
            />
            </div>
          </div>
        </div>
        
        {/* Stakeholder Value Distribution Chart */}
        <StakeholderValueChart results={results} />
      </div>

      {guestMode && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  <strong>Guest Mode:</strong> You're using the calculator in read-only mode. Sign in to save your models.
                </p>
              </div>
            )}

            <div className="container -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar with Model Management */}
          <div className="lg:col-span-4 space-y-6">
            {/* Model Management Card */}
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Saved Models</CardTitle>
                <CardDescription>Load or manage your project models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedModels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved models yet. Create one to get started!</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedModels.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <button
                          onClick={() => setCurrentModelId(model.id)}
                          className={cn(
                            "flex-1 text-left text-sm font-medium truncate",
                            currentModelId === model.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {model.name}
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteModel(model.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parameters Card */}
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Name and identify your solar model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input 
                    id="project-name"
                    value={modelName} 
                    onChange={(e) => setModelName(e.target.value)} 
                    placeholder="e.g. North Ridge Solar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description (Optional)</Label>
                  <Input 
                    id="project-description"
                    value={modelDescription} 
                    onChange={(e) => setModelDescription(e.target.value)} 
                    placeholder="Brief project overview"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parameters Card */}
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Project Parameters</CardTitle>
                <CardDescription>Adjust inputs to update the model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Size</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Capacity (MW)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.mw)} MW</span>
                    </div>
                    <Slider 
                      value={[inputs.mw]} 
                      min={1} max={100} step={0.5} 
                      onValueChange={(v) => handleInputChange("mw", v[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Project Life (Years)</Label>
                      <span className="text-sm font-mono">{inputs.projectLife} years</span>
                    </div>
                    <Slider 
                      value={[inputs.projectLife]} 
                      min={5} max={30} step={1} 
                      onValueChange={(v) => handleInputChange("projectLife", v[0])} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Costs (Capex)</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>EPC Cost per MW (£)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.capexPerMW)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.capexPerMW)} 
                      onChange={(e) => handleInputChange("capexPerMW", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Private Wire Cost (£)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.privateWireCost)}</span>
                    </div>
                    {gridConnectionCosts && (
                      <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Grid Connection Estimate:</span>
                          <button 
                            onClick={() => setShowSourceInfo('gridCost')}
                            className="text-blue-500 hover:text-blue-700 p-0 h-4 w-4"
                            title="View source information"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                        <div>{formatCurrency((gridConnectionCosts.totalCostMin + gridConnectionCosts.totalCostMax) / 2)}</div>
                      </div>
                    )}
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.privateWireCost)} 
                      onChange={(e) => handleInputChange("privateWireCost", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Dev Premium per MW (£)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.developmentPremiumPerMW)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.developmentPremiumPerMW)} 
                      onChange={(e) => handleInputChange("developmentPremiumPerMW", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="devPremiumEnabled"
                        checked={inputs.developmentPremiumEnabled}
                        onChange={(e) => handleInputChange("developmentPremiumEnabled", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="devPremiumEnabled" className="cursor-pointer">Include Developer Premium in CAPEX</Label>
                    </div>
                  </div>

                  {inputs.developmentPremiumEnabled && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Dev Premium Discount (%)</Label>
                        <span className="text-sm font-mono">{inputs.developmentPremiumDiscount.toFixed(1)}%</span>
                      </div>
                      <Slider 
                        value={[inputs.developmentPremiumDiscount]} 
                        min={0} max={100} step={0.5} 
                        onValueChange={(v) => handleInputChange("developmentPremiumDiscount", v[0])} 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Land Rental Cost per MW/year (£)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.landOptionCostPerMWYear)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.landOptionCostPerMWYear)} 
                      onChange={(e) => handleInputChange("landOptionCostPerMWYear", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="landOptionEnabled"
                        checked={inputs.landOptionEnabled}
                        onChange={(e) => handleInputChange("landOptionEnabled", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="landOptionEnabled" className="cursor-pointer">Include Land Rental Cost in OPEX</Label>
                    </div>
                  </div>

                  {inputs.landOptionEnabled && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Land Rental Discount (%)</Label>
                        <span className="text-sm font-mono">{inputs.landOptionDiscount.toFixed(1)}%</span>
                      </div>
                      <Slider 
                        value={[inputs.landOptionDiscount]} 
                        min={0} max={100} step={0.5} 
                        onValueChange={(v) => handleInputChange("landOptionDiscount", v[0])} 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Land Value (£)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.landValue)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.landValue)} 
                      onChange={(e) => handleInputChange("landValue", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Cost Inflation Rate (CPI %)</Label>
                      <span className="text-sm font-mono">{inputs.costInflationRate.toFixed(2)}%</span>
                    </div>
                    <Slider 
                      value={[inputs.costInflationRate]} 
                      min={0} max={10} step={0.1} 
                      onValueChange={(v) => handleInputChange("costInflationRate", v[0])} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Operational</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Opex per MW (£/year)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.opexPerMW)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.opexPerMW)} 
                      onChange={(e) => handleInputChange("opexPerMW", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>PPA Price (£/MWh)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.powerPrice)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.powerPrice)} 
                      onChange={(e) => handleInputChange("powerPrice", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>% Consumption at PPA</Label>
                      <span className="text-sm font-mono">{inputs.percentConsumptionPPA.toFixed(1)}%</span>
                    </div>
                    <Slider 
                      value={[inputs.percentConsumptionPPA]} 
                      min={0} max={100} step={1} 
                      onValueChange={(v) => handleInputChange("percentConsumptionPPA", v[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>% Consumption at Export</Label>
                      <span className="text-sm font-mono">{inputs.percentConsumptionExport.toFixed(1)}%</span>
                    </div>
                    <Slider 
                      value={[inputs.percentConsumptionExport]} 
                      min={0} max={100} step={1} 
                      onValueChange={(v) => handleInputChange("percentConsumptionExport", v[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Export Price (£/MWh)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.exportPrice)}</span>
                    </div>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.exportPrice)} 
                      onChange={(e) => handleInputChange("exportPrice", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Offsetable Energy Cost (£/MWh)</Label>
                      <span className="text-sm font-mono">{formatNumberWithCommas(inputs.offsetableEnergyCost)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Use energy pricing tool for accurate site-specific info</p>
                    <Input 
                      type="text" 
                      value={formatNumberWithCommas(inputs.offsetableEnergyCost)} 
                      onChange={(e) => handleInputChange("offsetableEnergyCost", Number(e.target.value.replace(/,/g, '')))} 
                    />
                  </div>

                  {/* Grid Cost Override Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox 
                        checked={inputs.gridCostOverrideEnabled}
                        onCheckedChange={(checked: boolean) => handleInputChange("gridCostOverrideEnabled", checked)}
                      />
                      <Label className="font-semibold">Override Grid Connection Costs</Label>
                    </div>
                    
                    {inputs.gridCostOverrideEnabled && (
                      <div className="space-y-2 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Enter total grid connection cost (£). This overrides all calculated grid costs.
                        </p>
                        <div className="flex justify-between">
                          <Label>Total Grid Cost (£)</Label>
                          <span className="text-sm font-mono">{formatNumberWithCommas(inputs.gridCostOverride)}</span>
                        </div>
                        <Input 
                          type="text" 
                          value={formatNumberWithCommas(inputs.gridCostOverride)} 
                          onChange={(e) => handleInputChange("gridCostOverride", Number(e.target.value.replace(/,/g, '')))} 
                          placeholder="Enter total grid cost"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Irradiance Override (kWh/m²/year)</Label>
                      <span className="text-sm font-mono">{inputs.irradianceOverride === 0 ? "Default" : inputs.irradianceOverride.toFixed(2)}</span>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={inputs.irradianceOverride} 
                      onChange={(e) => handleInputChange("irradianceOverride", Number(e.target.value))} 
                      placeholder="0 = use default from generation/MW"
                    />
                  </div>

                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Discount Rate (%)</Label>
                        <span className="text-sm font-mono">{(inputs.discountRate * 100).toFixed(2)}%</span>
                      </div>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={inputs.discountRate * 100} 
                        onChange={(e) => handleInputChange("discountRate", Number(e.target.value) / 100)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panel Degradation (%)</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.001"
                          value={inputs.degradationRate} 
                          onChange={(e) => handleInputChange("degradationRate", Number(e.target.value))} 
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg" disabled={guestMode}>
                      <Save className="mr-2 h-4 w-4" /> {currentModelId ? "Update" : "Save"} Model
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{currentModelId ? "Update" : "Save"} Model</DialogTitle>
                      <DialogDescription>Give your model a name and description</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Model Name</Label>
                        <Input 
                          value={modelName} 
                          onChange={(e) => setModelName(e.target.value)} 
                          placeholder="e.g., 28MW Solar Farm - High Price Scenario"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input 
                          value={modelDescription} 
                          onChange={(e) => setModelDescription(e.target.value)} 
                          placeholder="Add notes about this model..."
                        />
                      </div>
                      <Button 
                        onClick={handleSaveModel} 
                        className="w-full"
                        disabled={createModelMutation.isPending || updateModelMutation.isPending}
                      >
                        {createModelMutation.isPending || updateModelMutation.isPending ? "Saving..." : "Save Model"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

              </CardContent>
            </Card>
          </div>

          {/* Main Charts Area */}
          <div className="lg:col-span-8 space-y-6">
            
            <Tabs defaultValue="gridcosts" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-4">
                <TabsTrigger value="gridcosts">Private Wire Parameters</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
                <TabsTrigger value="cumulative">Cumulative Returns</TabsTrigger>
                <TabsTrigger value="generation">Generation & Revenue</TabsTrigger>
                <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>

              </TabsList>
              
              <TabsContent value="cashflow">
                <CashFlowTable yearlyData={results.yearlyData} projectName={modelName || "Solar Project"} />
              </TabsContent>

              <TabsContent value="cumulative">
                <Card>
                  <CardHeader>
                    <CardTitle>Cumulative Discounted Cash Flow</CardTitle>
                    <CardDescription>Project NPV trajectory showing payback period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(val) => `£${val/1000000}m`} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Legend />
                        <Area type="monotone" dataKey="cumulativeDiscountedCashFlow" name="Cumulative Discounted CF" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCumulative)" />
                        <Line type="monotone" dataKey={() => 0} stroke="#64748b" strokeDasharray="5 5" strokeWidth={1} dot={false} activeDot={false} legendType="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generation">
                <Card>
                  <CardHeader>
                    <CardTitle>Generation & Revenue</CardTitle>
                    <CardDescription>Energy production vs. Revenue over time (accounting for degradation)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" tickFormatter={(val) => `${val/1000}k`} label={{ value: 'MWh', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `£${val/1000000}m`} label={{ value: 'Revenue', angle: 90, position: 'insideRight' }} />
                        <Tooltip formatter={(val: number, name: string) => [name === 'Revenue' ? formatCurrency(val) : formatNumber(val) + ' MWh', name]} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="generation" name="Generation (MWh)" stroke="#f59e0b" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (£)" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="gridcosts">
                <GridConnectionSliders
                  initialDistance={inputs.distanceKm}
                  onCostsUpdate={(costs) => {
                    setGridConnectionCosts(costs);
                    const avgCost = (costs.totalCostMin + costs.totalCostMax) / 2;
                    handleInputChange("gridConnectionCost", Math.round(avgCost));
                    // Also update Private Wire Cost with grid connection estimate
                    handleInputChange("privateWireCost", Math.round(avgCost));
                  }}
                  setShowSourceInfo={setShowSourceInfo}
                />
              </TabsContent>
              
              <TabsContent value="sensitivity">
                <div className="space-y-6">
                  <SensitivityHeatmap 
                    matrix={sensitivityMatrix} 
                    currentInputs={inputs}
                    title="LCOE Sensitivity Analysis"
                    metric="lcoe"
                  />
                  <SensitivityHeatmap 
                    matrix={sensitivityMatrix} 
                    currentInputs={inputs}
                    title="IRR Sensitivity Analysis"
                    metric="irr"
                  />
                </div>
              </TabsContent>

            </Tabs>

            {/* Detailed Table Preview - Only show on non-gridcosts tabs */}
            {/* Hidden from Private Wire Parameters tab */}

          </div>
        </div>
      </div>

      {/* Source Info Modal */}
      <Dialog open={!!showSourceInfo} onOpenChange={() => setShowSourceInfo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Source Information</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-4">
            {showSourceInfo && (() => {
              const source = getSourceDetails(showSourceInfo);
              if (!source) {
                return <p className="text-gray-500">Source information not available</p>;
              }
              return (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="font-bold text-blue-900">{source.title}</p>
                    <p className="text-sm text-blue-800 mt-1">{source.organization} ({source.year})</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Description</h4>
                      <p className="text-gray-700">{source.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">Methodology</h4>
                      <p className="text-gray-700">{source.methodology}</p>
                    </div>
                    
                    {source.link && (
                      <div>
                        <h4 className="font-semibold text-gray-900">Reference Link</h4>
                        <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">
                          {source.link}
                        </a>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">
                        <strong>Confidence Level:</strong> {source && source.confidence ? source.confidence.charAt(0).toUpperCase() + source.confidence.slice(1) : 'High'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Last Updated:</strong> {source && source.lastUpdated ? source.lastUpdated : 'January 2026'}
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>


      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool Limitations & Disclaimer</DialogTitle>
            <DialogDescription>Important information about this calculator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Validity & Data Sources</h3>
              <p>This calculator provides indicative financial projections based on industry assumptions and publicly available data sources. All data and assumptions are valid as of January 2026.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Limitations</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Results are for indicative purposes only and should not be relied upon for investment decisions</li>
                <li>Grid costs, irradiance data, and technology assumptions may vary significantly by location</li>
                <li>Costs and pricing may change over time</li>
                <li>Site-specific conditions (soil, access, environmental) are not accounted for</li>
                <li>This tool does not include all potential costs (e.g., planning, environmental surveys, financing)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Professional Verification Required</h3>
              <p>Results should not be relied upon for investment decisions without independent professional verification from qualified engineers, surveyors, and financial advisors.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Sources</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Grid connection costs: SSEN Distribution Cost Estimates (2025)</li>
                <li>Solar irradiance: UK Met Office historical averages</li>
                <li>EPC costs: Industry benchmarks (2026)</li>
                <li>Transformer costs: Manufacturer quotes</li>
                <li>Cable costs: Supplier pricing data</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
