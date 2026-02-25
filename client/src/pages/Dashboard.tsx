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

  // Get map screenshot from localStorage (persisted from MapView)
  const getMapScreenshot = () => {
    try {
      return localStorage.getItem('mapScreenshot');
    } catch (e) {
      console.error('Failed to get map screenshot from localStorage:', e);
      return null;
    }
  };

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Generating PDF...');
      
      // Try to capture the map from localStorage first (from manual button click in MapView)
      let mapImage = getMapScreenshot();
      
      // If no manual screenshot, try to capture the map element if it exists
      if (!mapImage) {
        try {
          const mapElement = document.querySelector('.leaflet-container');
          if (mapElement && mapElement instanceof HTMLElement) {
            console.log('[PDF Export] Capturing map element...');
            const canvas = await html2canvas(mapElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true,
            });
            mapImage = canvas.toDataURL('image/png');
            console.log('[PDF Export] Map captured successfully');
          }
        } catch (error) {
          console.warn('[PDF Export] Failed to capture map element:', error);
        }
      }
      
      // Generate PDF with map image
      const doc = await generatePDFReport({ 
        inputs, 
        results, 
        projectName: modelName || 'Solar Project', 
        description: modelDescription,
        mapScreenshot: mapImage || undefined
      });
      
      // Convert PDF to blob and trigger download
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
      console.error('[PDF Export] Error:', error);
      toast.error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        ['Year', 'Generation (MWh)', 'Revenue (£)', 'OPEX (£)', 'Net Cash Flow (£)', 'Discounted CF (£)', 'Cumulative CF (£)'],
        ...results.yearlyData.map(year => [
          year.year,
          year.generation.toFixed(0),
          year.revenue.toFixed(2),
          year.opex.toFixed(2),
          year.netCashFlow.toFixed(2),
          year.discountedCashFlow.toFixed(2),
          year.cumulativeCashFlow.toFixed(2),
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelName || 'Solar Project'}-cashflow.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Private Wire Solar Calculator</h1>
            <p className="text-slate-600">Welcome, {user?.name || 'Guest'}! Advanced financial modeling for solar assets with private wire integration.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/map'} className="gap-2">
              <MapPin className="w-4 h-4" />
              Site Mapping
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Disclaimer:</p>
                <p className="text-yellow-800 text-sm">Indicative projections based on Jan 2026 data. Not for investment decisions without professional verification.</p>
                <button onClick={() => setShowDisclaimerModal(true)} className="text-yellow-700 hover:text-yellow-900 text-sm font-medium underline mt-1">
                  View full details
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Total CAPEX"
            value={formatCurrency(results.summary.totalCapex)}
            icon={Factory}
          />
          <MetricCard
            title="LCOE (Real)"
            value={`£${results.summary.lcoe.toFixed(0)}/MWh`}
            icon={Zap}
          />
          <MetricCard
            title="IRR (Unlevered)"
            value={`${(results.summary.irr * 100).toFixed(2)}%`}
            icon={TrendingUp}
          />
          <MetricCard
            title="Payback Period"
            value={results.summary.paybackPeriod > results.summary.projectLife ? '> Project Life' : `${results.summary.paybackPeriod.toFixed(1)} years`}
            icon={BatteryCharging}
          />
          <MetricCard
            title="Total NPV"
            value={formatCurrency(results.summary.totalDiscountedCashFlow)}
            icon={Coins}
          />
        </div>

        {/* Stakeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Operator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                Operator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Total NPV</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(results.summary.totalDiscountedCashFlow)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">IRR</p>
                  <p className="text-xl font-bold text-slate-900">{(results.summary.irr * 100).toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offtaker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Offtaker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Yearly Savings</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(results.summary.offtakerYearlySavings)}/year</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Savings</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(results.summary.offtakerTotalSavings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Landowner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                Landowner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Yearly Rental Income</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(results.summary.landownerYearlyIncome)}/year</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Rental Income</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(results.summary.landownerTotalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Developer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                Developer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Developer Premium</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(results.summary.developerPremium)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stakeholder Value Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stakeholder Value Distribution</CardTitle>
            <CardDescription>Proportional value created for each party based on project NPV, offtaker savings, landowner rental income, and developer premium</CardDescription>
          </CardHeader>
          <CardContent>
            <StakeholderValueChart results={results} />
          </CardContent>
        </Card>

        {/* Guest Mode Notice */}
        {!isAuthenticated && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-blue-900"><strong>Guest Mode:</strong> You're using the calculator in read-only mode. <a href={getLoginUrl()} className="underline font-semibold">Sign in</a> to save your models.</p>
            </CardContent>
          </Card>
        )}

        {/* Saved Models Section */}
        {isAuthenticated && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Saved Models</CardTitle>
              <CardDescription>Load or manage your project models</CardDescription>
            </CardHeader>
            <CardContent>
              {savedModels.length === 0 ? (
                <p className="text-slate-600">No saved models yet. Create one to get started!</p>
              ) : (
                <div className="space-y-2">
                  {savedModels.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{model.name}</p>
                        <p className="text-sm text-slate-600">{model.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCurrentModelId(model.id)}>Load</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteModel(model.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Name and identify your solar model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. North Ridge Solar"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Input
                id="project-description"
                placeholder="Brief project overview"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveModel} className="gap-2">
                <Save className="w-4 h-4" />
                Save Model
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different analyses */}
        <Tabs defaultValue="parameters" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="gridcosts">Private Wire Parameters</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
            <TabsTrigger value="generation">Generation & Revenue</TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="parameters">
            <Card>
              <CardHeader>
                <CardTitle>Project Parameters</CardTitle>
                <CardDescription>Adjust inputs to update the model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">System Size</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Capacity (MW)</Label>
                        <span className="font-semibold">{inputs.mw.toFixed(2)} MW</span>
                      </div>
                      <Slider
                        value={[inputs.mw]}
                        onValueChange={(value) => handleInputChange('mw', value[0])}
                        min={1}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Project Life (Years)</Label>
                        <span className="font-semibold">{inputs.projectLife} years</span>
                      </div>
                      <Slider
                        value={[inputs.projectLife]}
                        onValueChange={(value) => handleInputChange('projectLife', value[0])}
                        min={5}
                        max={40}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Costs (Capex)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>EPC Cost per MW (£)</Label>
                      <Input
                        type="number"
                        value={inputs.capexPerMW}
                        onChange={(e) => handleInputChange('capexPerMW', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Private Wire Cost (£)</Label>
                      <Input
                        type="number"
                        value={inputs.privateWireCost}
                        onChange={(e) => handleInputChange('privateWireCost', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Grid Connection Estimate:</Label>
                      <Input
                        type="number"
                        value={inputs.gridConnectionCost}
                        onChange={(e) => handleInputChange('gridConnectionCost', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Dev Premium per MW (£)</Label>
                      <Input
                        type="number"
                        value={inputs.developmentPremiumPerMW}
                        onChange={(e) => handleInputChange('developmentPremiumPerMW', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="devPremiumEnabled"
                        checked={inputs.developmentPremiumEnabled}
                        onCheckedChange={(checked) => handleInputChange('developmentPremiumEnabled', checked === true)}
                      />
                      <Label htmlFor="devPremiumEnabled">Include Developer Premium in CAPEX</Label>
                    </div>
                    <div>
                      <Label>Dev Premium Discount (%)</Label>
                      <Input
                        type="number"
                        value={inputs.developmentPremiumDiscount}
                        onChange={(e) => handleInputChange('developmentPremiumDiscount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Land Rental Cost per MW/year (£)</Label>
                      <Input
                        type="number"
                        value={inputs.landOptionCostPerMWYear}
                        onChange={(e) => handleInputChange('landOptionCostPerMWYear', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="landOptionEnabled"
                        checked={inputs.landOptionEnabled}
                        onCheckedChange={(checked) => handleInputChange('landOptionEnabled', checked === true)}
                      />
                      <Label htmlFor="landOptionEnabled">Include Land Rental Cost in OPEX</Label>
                    </div>
                    <div>
                      <Label>Land Rental Discount (%)</Label>
                      <Input
                        type="number"
                        value={inputs.landOptionDiscount}
                        onChange={(e) => handleInputChange('landOptionDiscount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Land Value (£)</Label>
                      <Input
                        type="number"
                        value={inputs.landValue}
                        onChange={(e) => handleInputChange('landValue', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Cost Inflation Rate (CPI %)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={inputs.costInflationRate}
                        onChange={(e) => handleInputChange('costInflationRate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Operational</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Opex per MW (£/year)</Label>
                      <Input
                        type="number"
                        value={inputs.opexPerMW}
                        onChange={(e) => handleInputChange('opexPerMW', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>PPA Price (£/MWh)</Label>
                      <Input
                        type="number"
                        value={inputs.powerPrice}
                        onChange={(e) => handleInputChange('powerPrice', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>% Consumption at PPA</Label>
                        <span className="font-semibold">{inputs.percentConsumptionPPA.toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[inputs.percentConsumptionPPA]}
                        onValueChange={(value) => handleInputChange('percentConsumptionPPA', value[0])}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>% Consumption at Export</Label>
                        <span className="font-semibold">{inputs.percentConsumptionExport.toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[inputs.percentConsumptionExport]}
                        onValueChange={(value) => handleInputChange('percentConsumptionExport', value[0])}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <Label>Export Price (£/MWh)</Label>
                      <Input
                        type="number"
                        value={inputs.exportPrice}
                        onChange={(e) => handleInputChange('exportPrice', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Offsetable Energy Cost (£/MWh)</Label>
                      <Input
                        type="number"
                        value={inputs.offsetableEnergyCost}
                        onChange={(e) => handleInputChange('offsetableEnergyCost', parseFloat(e.target.value))}
                      />
                    </div>
                    <p className="text-sm text-slate-600">Use energy pricing tool for accurate site-specific info</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Override Grid Connection Costs</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="gridCostOverrideEnabled"
                        checked={inputs.gridCostOverrideEnabled}
                        onCheckedChange={(checked) => handleInputChange('gridCostOverrideEnabled', checked === true)}
                      />
                      <Label htmlFor="gridCostOverrideEnabled">Enable Override</Label>
                    </div>
                    {inputs.gridCostOverrideEnabled && (
                      <Input
                        type="number"
                        placeholder="0 = use default from generation/MW"
                        value={inputs.gridCostOverride}
                        onChange={(e) => handleInputChange('gridCostOverride', parseFloat(e.target.value))}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Advanced Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Irradiance Override (kWh/m²/year)</Label>
                      <Input
                        type="number"
                        placeholder="0 = use default from generation/MW"
                        value={inputs.irradianceOverride}
                        onChange={(e) => handleInputChange('irradianceOverride', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Discount Rate (%)</Label>
                        <span className="font-semibold">{inputs.discountRate.toFixed(2)}%</span>
                      </div>
                      <Slider
                        value={[inputs.discountRate]}
                        onValueChange={(value) => handleInputChange('discountRate', value[0])}
                        min={0}
                        max={20}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Panel Degradation (%)</Label>
                        <span className="font-semibold">{inputs.degradationRate.toFixed(4)}%</span>
                      </div>
                      <Slider
                        value={[inputs.degradationRate]}
                        onValueChange={(value) => handleInputChange('degradationRate', value[0])}
                        min={0}
                        max={1}
                        step={0.0001}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Breakdown Tab */}
          <TabsContent value="costs">
            <GridConnectionCostBreakdown costs={gridConnectionCosts} />
          </TabsContent>

          {/* Grid Connection Tab */}
          <TabsContent value="gridcosts">
            <Card>
              <CardHeader>
                <CardTitle>Grid Connection Cost Calculator</CardTitle>
                <CardDescription>Configure your private wire infrastructure parameters - costs auto-update in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <GridConnectionSliders
                  onCostsChange={setGridConnectionCosts}
                  onGridConnectionCostChange={(cost) => handleInputChange('gridConnectionCost', cost)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowTable data={results.yearlyData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generation Tab */}
          <TabsContent value="generation">
            <Card>
              <CardHeader>
                <CardTitle>Generation & Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={results.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="generation" stroke="#3b82f6" fill="#93c5fd" name="Generation (MWh)" />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="#a7f3d0" name="Revenue (£)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disclaimer Modal */}
        <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
          <DialogContent className="max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Full Disclaimer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p>This Solar Project Analysis tool provides indicative financial projections based on the parameters you input. The following important disclaimers apply:</p>
              <div className="space-y-2">
                <h4 className="font-semibold">1. Not Investment Advice</h4>
                <p>These projections are for informational purposes only and do not constitute investment advice. Do not make investment decisions based solely on these calculations without professional financial, legal, and technical advice.</p>
                
                <h4 className="font-semibold">2. Data Basis</h4>
                <p>Projections are based on January 2026 data and assumptions. Market conditions, technology costs, energy prices, and regulatory environments change frequently and may significantly impact actual project economics.</p>
                
                <h4 className="font-semibold">3. Accuracy of Inputs</h4>
                <p>The accuracy of outputs depends entirely on the accuracy of inputs. Users are responsible for verifying all input parameters with site-specific surveys, quotes, and market data.</p>
                
                <h4 className="font-semibold">4. Assumptions</h4>
                <p>The model makes standard assumptions about panel degradation, inflation rates, discount rates, and other factors. Actual project performance may differ materially from these assumptions.</p>
                
                <h4 className="font-semibold">5. Professional Verification</h4>
                <p>Before proceeding with any solar project, obtain independent verification from qualified engineers, financial advisors, and legal counsel familiar with your specific location and circumstances.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
