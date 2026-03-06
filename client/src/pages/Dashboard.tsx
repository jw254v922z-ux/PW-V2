import React from 'react';
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
import { AlertCircle, Info, BatteryCharging, Coins, Download, Factory, Save, Trash2, Zap, LogOut, Leaf, TrendingUp, MapPin, FileText } from "lucide-react";
import { useLocation } from "wouter";
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
  const [, navigate] = useLocation();
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
      refetchModels();
      setShowSaveDialog(false);
      toast.success('Model saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save model: ' + error.message);
    },
  });

  const updateModelMutation = trpc.solar.update.useMutation({
    onSuccess: () => {
      refetchModels();
      setShowSaveDialog(false);
      toast.success('Model updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update model: ' + error.message);
    },
  });

  const loadModel = trpc.solar.get.useQuery(
    { id: currentModelId || 0 },
    { enabled: currentModelId !== null }
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

  const handleViewReport = () => {
    try {
      // Operator cash flows
      const operatorCashFlows = results.yearlyData.map((year, idx) => ({
        year: idx,
        generation: year.generation,
        revenue: year.revenue,
        opex: year.opex,
        netCF: year.cashFlow,
        discountedCF: year.discountedCashFlow,
        cumulativeDCF: year.cumulativeDiscountedCashFlow,
      }));

      // Offtaker cash flows
      const offtakerCashFlows = results.yearlyData.map((year, idx) => ({
        year: idx,
        savings: year.savings || 0,
        discountedSavings: (year.savings || 0) * year.discountFactor,
        cumulativeDCF: 0,
      }));

      // Calculate cumulative for offtaker
      let offtakerCumulative = 0;
      offtakerCashFlows.forEach(cf => {
        offtakerCumulative += cf.discountedSavings;
        cf.cumulativeDCF = offtakerCumulative;
      });

      // Landowner cash flows
      const landownerCashFlows = results.yearlyData.map((year, idx) => ({
        year: idx,
        rental: year.landIncome || 0,
        discountedRental: (year.landIncome || 0) * year.discountFactor,
        cumulativeDCF: 0,
      }));

      // Calculate cumulative for landowner
      let landownerCumulative = 0;
      landownerCashFlows.forEach(cf => {
        landownerCumulative += cf.discountedRental;
        cf.cumulativeDCF = landownerCumulative;
      });

      // Developer cash flows
      const developerCashFlows = [{
        year: 0,
        premium: inputs.developmentPremiumEnabled ? inputs.developmentPremiumPerMW * inputs.mw : 0,
        discountedPremium: inputs.developmentPremiumEnabled ? inputs.developmentPremiumPerMW * inputs.mw : 0,
      }];

      const reportData = {
        projectName: modelName || 'Solar Project',
        projectDescription: modelDescription,
        systemSize: inputs.mw,
        projectLife: inputs.projectLife,
        capex: results.summary.totalCapex,
        lcoe: results.summary.lcoe,
        irr: results.summary.irr * 100,
        npv: results.summary.totalDiscountedCashFlow,
        paybackPeriod: results.summary.paybackPeriod,
        operatorNPV: results.summary.totalDiscountedCashFlow,
        operatorIRR: results.summary.irr * 100,
        offtakerSavings: results.summary.totalSavings,
        landownerIncome: results.summary.totalLandOptionIncome,
        developerPremium: results.summary.totalDeveloperPremium,
        totalValue: results.summary.totalSavings + results.summary.totalLandOptionIncome + results.summary.totalDeveloperPremium,
        assumptions: {
          epcCostPerMW: inputs.capexPerMW,
          privateWireCost: inputs.privateWireCost,
          devPremium: inputs.developmentPremiumPerMW,
          landRentalCost: inputs.landOptionCostPerMWYear,
          opexPerMW: inputs.opexPerMW,
          ppaPrice: inputs.powerPrice,
          exportPrice: inputs.exportPrice,
          offsetableEnergy: inputs.offsetableEnergyCost,
          discountRate: inputs.discountRate,
          inflation: inputs.costInflationRate,
          projectLife: inputs.projectLife,
        },
        cashFlows: {
          operator: operatorCashFlows,
          offtaker: offtakerCashFlows,
          landowner: landownerCashFlows,
          developer: developerCashFlows,
        },
      };
      sessionStorage.setItem('reportData', JSON.stringify(reportData));
      
      // Try to capture map screenshot if available
      const mapElement = document.querySelector('[data-map-container]') as HTMLElement;
      if (mapElement) {
        html2canvas(mapElement, { backgroundColor: '#ffffff', scale: 2 })
          .then(canvas => {
            const screenshot = canvas.toDataURL('image/png');
            sessionStorage.setItem('mapScreenshot', screenshot);
          })
          .catch(err => console.warn('Failed to capture map screenshot:', err));
      }
      
      // Get drawn polygons from sessionStorage if available
      const drawnPolygons = sessionStorage.getItem('drawnPolygons');
      if (drawnPolygons) {
        // Already in sessionStorage, no need to set again
      }
      
      navigate('/report');
      toast.success('Opening report...');
    } catch (error) {
      console.error('Failed to open report:', error);
      toast.error('Failed to open report');
    }
  };

  const exportCSV = () => {
    const headers = [
      "Year", "Capex", "Opex", "Generation (MWh)", "Revenue", "Cash Flow", 
      "Cumulative Cash Flow", "Discount Factor", "Discounted Cost", 
      "Discounted Energy", "Discounted Revenue", "Discounted Cash Flow", "Cumulative Discounted CF"
    ];
    
    const rows = results.yearlyData.map(y => [
      y.year,
      y.capex,
      y.opex,
      y.generation.toFixed(0),
      y.revenue.toFixed(0),
      y.cashFlow.toFixed(0),
      y.cumulativeCashFlow.toFixed(0),
      y.discountFactor.toFixed(4),
      y.discountedCost.toFixed(0),
      y.discountedEnergy.toFixed(0),
      y.discountedRevenue.toFixed(0),
      y.discountedCashFlow.toFixed(0),
      y.cumulativeDiscountedCashFlow.toFixed(0),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelName || 'solar-model'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Private Wire Solar Calculator</h1>
            <p className="text-slate-600">Welcome, User! Advanced financial modeling for solar assets with private wire integration.</p>
          </div>
          {isAuthenticated && (
            <Button 
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          <a href="/map" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Site Mapping
                </CardTitle>
              </CardHeader>
            </Card>
          </a>
        </div>

        <div className="flex gap-4 mb-8">
          <Button 
            onClick={exportCSV}
            variant="outline"
            className="bg-slate-900/10 text-slate-900 border-slate-900/20 hover:bg-slate-900/20"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>

          <Button onClick={handleViewReport} variant="outline" className="bg-slate-900/10 text-slate-900 border-slate-900/20 hover:bg-slate-900/20">
            <FileText className="mr-2 h-4 w-4" /> View Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Total CAPEX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalCapex)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                LCOE (Real)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">£{results.summary.lcoe.toFixed(0)}/MWh</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                IRR (Unlevered)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{(results.summary.irr * 100).toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Payback Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{results.summary.paybackPeriod > inputs.projectLife ? '> Project Life' : `${results.summary.paybackPeriod.toFixed(1)} years`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BatteryCharging className="h-5 w-5" />
                Total NPV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalDiscountedCashFlow)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Total NPV</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalDiscountedCashFlow)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">IRR</p>
                <p className="text-2xl font-bold text-slate-900">{(results.summary.irr * 100).toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Offtaker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Yearly Savings</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.yearlySavings)}/year</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Savings</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalSavings)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Landowner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Yearly Rental Income</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.yearlyRentalIncome)}/year</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Rental Income</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalLandOptionIncome)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Land Rental Yield</p>
                <p className="text-2xl font-bold text-slate-900">{results.summary.landOptionYield.toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Developer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Developer Premium</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(results.summary.totalDeveloperPremium)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stakeholder Value Distribution</CardTitle>
            <CardDescription>Proportional value created for each party based on project NPV, offtaker savings, landowner rental income, and developer premium</CardDescription>
          </CardHeader>
          <CardContent>
            <StakeholderValueChart results={results} />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Name and identify your solar model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Parameters</CardTitle>
            <CardDescription>Adjust inputs to update the model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">System Size</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity (MW)</Label>
                  <Input
                    type="number"
                    value={inputs.mw}
                    onChange={(e) => handleInputChange('mw', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.mw} MW</p>
                </div>
                <div>
                  <Label>Project Life (Years)</Label>
                  <Input
                    type="number"
                    value={inputs.projectLife}
                    onChange={(e) => handleInputChange('projectLife', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.projectLife} years</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Costs (Capex)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>EPC Cost per MW (£)</Label>
                  <Input
                    type="number"
                    value={inputs.capexPerMW}
                    onChange={(e) => handleInputChange('capexPerMW', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{formatNumberWithCommas(inputs.capexPerMW)}</p>
                </div>
                <div>
                  <Label>Private Wire Cost (£)</Label>
                  <Input
                    type="number"
                    value={inputs.privateWireCost}
                    onChange={(e) => handleInputChange('privateWireCost', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Grid Connection Estimate:</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(inputs.privateWireCost)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
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
                    onCheckedChange={(checked) => handleInputChange('developmentPremiumEnabled', checked as boolean)}
                  />
                  <Label htmlFor="devPremiumEnabled" className="text-sm">Include Developer Premium in CAPEX</Label>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Dev Premium Discount (%)</Label>
                  <Input
                    type="number"
                    value={inputs.developmentPremiumDiscount}
                    onChange={(e) => handleInputChange('developmentPremiumDiscount', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.developmentPremiumDiscount.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
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
                    onCheckedChange={(checked) => handleInputChange('landOptionEnabled', checked as boolean)}
                  />
                  <Label htmlFor="landOptionEnabled" className="text-sm">Include Land Rental Cost in OPEX</Label>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Land Rental Discount (%)</Label>
                  <Input
                    type="number"
                    value={inputs.landOptionDiscount}
                    onChange={(e) => handleInputChange('landOptionDiscount', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.landOptionDiscount.toFixed(1)}%</p>
                </div>
                <div>
                  <Label>Land Value (£)</Label>
                  <Input
                    type="number"
                    value={inputs.landValue}
                    onChange={(e) => handleInputChange('landValue', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Cost Inflation Rate (CPI %)</Label>
                <Input
                  type="number"
                  value={inputs.costInflationRate}
                  onChange={(e) => handleInputChange('costInflationRate', parseFloat(e.target.value))}
                  step="0.1"
                />
                <p className="text-xs text-slate-500 mt-1">{inputs.costInflationRate.toFixed(2)}%</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Operational</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Opex per MW (£/year)</Label>
                  <Input
                    type="number"
                    value={inputs.opexPerMW}
                    onChange={(e) => handleInputChange('opexPerMW', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{formatNumberWithCommas(inputs.opexPerMW)}</p>
                </div>
                <div>
                  <Label>PPA Price (£/MWh)</Label>
                  <Input
                    type="number"
                    value={inputs.powerPrice}
                    onChange={(e) => handleInputChange('powerPrice', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.powerPrice}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>% Consumption at PPA</Label>
                  <Input
                    type="number"
                    value={inputs.percentConsumptionPPA}
                    onChange={(e) => handleInputChange('percentConsumptionPPA', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.percentConsumptionPPA.toFixed(1)}%</p>
                </div>
                <div>
                  <Label>% Consumption at Export</Label>
                  <Input
                    type="number"
                    value={inputs.percentConsumptionExport}
                    onChange={(e) => handleInputChange('percentConsumptionExport', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.percentConsumptionExport.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Export Price (£/MWh)</Label>
                  <Input
                    type="number"
                    value={inputs.exportPrice}
                    onChange={(e) => handleInputChange('exportPrice', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.exportPrice}</p>
                </div>
                <div>
                  <Label>Offsetable Energy Cost (£/MWh)</Label>
                  <Input
                    type="number"
                    value={inputs.offsetableEnergyCost}
                    onChange={(e) => handleInputChange('offsetableEnergyCost', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.offsetableEnergyCost}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">Use energy pricing tool for accurate site-specific info</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Override Grid Connection Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Irradiance Override (kWh/m²/year)</Label>
                  <Input
                    type="number"
                    placeholder="0 = use default from generation/MW"
                    value={inputs.irradianceOverride}
                    onChange={(e) => handleInputChange('irradianceOverride', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Rate (%)</Label>
                  <Input
                    type="number"
                    value={inputs.discountRate}
                    onChange={(e) => handleInputChange('discountRate', parseFloat(e.target.value))}
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500 mt-1">{inputs.discountRate.toFixed(2)}%</p>
                </div>
                <div>
                  <Label>Panel Degradation (%)</Label>
                  <Input
                    type="number"
                    value={inputs.degradationRate * 100}
                    onChange={(e) => handleInputChange('degradationRate', parseFloat(e.target.value) / 100)}
                    step="0.01"
                  />
                  <p className="text-xs text-slate-500 mt-1">{(inputs.degradationRate * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSaveModel}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Save className="mr-2 h-4 w-4" /> Save Model
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="gridcosts" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="gridcosts">Private Wire Parameters</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Returns</TabsTrigger>
            <TabsTrigger value="generation">Generation & Revenue</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="gridcosts">
            <GridConnectionSliders 
              onCostsUpdate={setGridConnectionCosts}
              setShowSourceInfo={setShowSourceInfo}
              initialDistance={inputs.distanceKm}
            />
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>15-Year Cash Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowTable yearlyData={results.yearlyData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cumulative">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Discounted Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={results.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeDiscountedCashFlow" 
                      stroke="#001F3F" 
                      name="Cumulative DCF"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generation">
            <Card>
              <CardHeader>
                <CardTitle>Generation & Revenue Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={results.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="generation" fill="#2D8659" name="Generation (MWh)" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#FFD700" name="Revenue (£)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sensitivity">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
                <CardDescription>IRR sensitivity to key parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <SensitivityHeatmap matrix={sensitivityMatrix} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              Indicative projections based on Jan 2026 data. Not for investment decisions without professional verification.
            </p>
          </CardContent>
        </Card>

        {!isAuthenticated && (
          <Card className="mt-8 bg-slate-50">
            <CardHeader>
              <CardTitle>Guest Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">You're using the calculator in read-only mode. Sign in to save your models.</p>
              <a href={getLoginUrl()}>
                <Button className="bg-slate-900 hover:bg-slate-800">Sign In</Button>
              </a>
            </CardContent>
          </Card>
        )}

        {isAuthenticated && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Saved Models</CardTitle>
              <CardDescription>Load or manage your project models</CardDescription>
            </CardHeader>
            <CardContent>
              {savedModels.length === 0 ? (
                <p className="text-slate-600">No saved models yet. Create one to get started!</p>
              ) : (
                <div className="space-y-2">
                  {savedModels.map((model: any) => (
                    <div 
                      key={model.id}
                      className="p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                      onClick={() => setCurrentModelId(model.id)}
                    >
                      <p className="font-semibold text-slate-900">{model.name}</p>
                      <p className="text-sm text-slate-600">{model.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        LCOE: £{model.lcoe}/MWh | IRR: {model.irr}% | NPV: {formatCurrency(parseFloat(model.totalNpv))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
