import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface CostItem {
  label: string;
  min: number;
  max: number;
  description: string;
}

interface GridConnectionCostBreakdownProps {
  costs: {
    agriculturalTrenchingMin: number;
    agriculturalTrenchingMax: number;
    roadTrenchingMin: number;
    roadTrenchingMax: number;
    majorRoadCrossingsMin: number;
    majorRoadCrossingsMax: number;
    jointBaysMin: number;
    jointBaysMax: number;
    transformersMin: number;
    transformersMax: number;
    landRightsCompensationMin: number;
    landRightsCompensationMax: number;
    landRightsLegalMin: number;
    landRightsLegalMax: number;
    planningFeesMin: number;
    planningFeesMax: number;
    planningConsentsMin: number;
    planningConsentsMax: number;
    constructionMin: number;
    constructionMax: number;
    softCostsMin: number;
    softCostsMax: number;
    projectMin: number;
    projectMax: number;
  };
  onUpdate: (updatedCosts: Partial<Record<string, number>>) => void;
  setShowSourceInfo?: (key: string) => void;
}

export function GridConnectionCostBreakdown({ costs, onUpdate, setShowSourceInfo }: GridConnectionCostBreakdownProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    trenching: true,
    infrastructure: true,
    landRights: true,
    planning: true,
    totals: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CostItemInput = ({ 
    label, 
    minKey, 
    maxKey, 
    description 
  }: { 
    label: string; 
    minKey: string; 
    maxKey: string; 
    description: string;
  }) => (
    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <Label className="font-medium text-sm">{label}</Label>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-600">Min</Label>
          <Input
            type="number"
            value={(costs as any)[minKey]}
            onChange={(e) => onUpdate({ [minKey]: Number(e.target.value) } as any)}
            className="text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">{formatCurrency((costs as any)[minKey] as number)}</p>
        </div>
        <div>
          <Label className="text-xs text-slate-600">Max</Label>
          <Input
            type="number"
            value={(costs as any)[maxKey]}
            onChange={(e) => onUpdate({ [maxKey]: Number(e.target.value) } as any)}
            className="text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">{formatCurrency((costs as any)[maxKey] as number)}</p>
        </div>
      </div>
    </div>
  );

  const CollapsibleSection = ({ 
    title, 
    sectionKey, 
    children,
    sourceKey
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
    sourceKey?: string;
  }) => (
    <div className="border rounded-lg">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {sourceKey && setShowSourceInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSourceInfo(sourceKey);
              }}
              className="text-blue-500 hover:text-blue-700 p-0.5"
              title="View source information"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="border-t p-4 space-y-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Grid Connection Cost Breakdown</CardTitle>
        <CardDescription>
          Customize all cost components based on your project specifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4 mt-4">
            {/* Trenching Section */}
            <CollapsibleSection title="Trenching Costs" sectionKey="trenching">
              <CostItemInput
                label="Agricultural Trenching (3.0 km)"
                minKey="agriculturalTrenchingMin"
                maxKey="agriculturalTrenchingMax"
                description="Soft-dig reinstatement"
              />
              <CostItemInput
                label="Road Trenching (2.0 km)"
                minKey="roadTrenchingMin"
                maxKey="roadTrenchingMax"
                description="Hard-dig, Traffic Management"
              />
            </CollapsibleSection>

            {/* Infrastructure Section */}
            <CollapsibleSection title="Infrastructure & Equipment" sectionKey="infrastructure" sourceKey="infrastructure">
              <CostItemInput
                label="Major Road Crossings (2)"
                minKey="majorRoadCrossingsMin"
                maxKey="majorRoadCrossingsMax"
                description="Directional drill"
              />
              <CostItemInput
                label="Joint Bays & Terminations"
                minKey="jointBaysMin"
                maxKey="jointBaysMax"
                description="4-6 joints, HV jointing"
              />
              <CostItemInput
                label="Transformers (2 × 33/11 kV)"
                minKey="transformersMin"
                maxKey="transformersMax"
                description="Plant + plinth, Market norms"
              />
            </CollapsibleSection>

            {/* Land Rights Section */}
            <CollapsibleSection title="Land Rights" sectionKey="landRights" sourceKey="wayleave">
              <CostItemInput
                label="Land Rights - Compensation"
                minKey="landRightsCompensationMin"
                maxKey="landRightsCompensationMax"
                description="Wayleave/easement"
              />
              <CostItemInput
                label="Land Rights - Legal Fees"
                minKey="landRightsLegalMin"
                maxKey="landRightsLegalMax"
                description="Legal, surveys, EHV land rights"
              />
            </CollapsibleSection>

            {/* Planning Section */}
            <CollapsibleSection title="Planning & Consents" sectionKey="planning">
              <CostItemInput
                label="Planning Application Fees"
                minKey="planningFeesMin"
                maxKey="planningFeesMax"
                description="Transformer sites"
              />
              <CostItemInput
                label="Planning Surveys"
                minKey="planningConsentsMin"
                maxKey="planningConsentsMax"
                description="Ecology, heritage, Statutory consents"
              />
            </CollapsibleSection>

            {/* Totals Section */}
            <CollapsibleSection title="Calculated Totals" sectionKey="totals">
              <CostItemInput
                label="Total Construction"
                minKey="constructionMin"
                maxKey="constructionMax"
                description="Trenching + transformers"
              />
              <CostItemInput
                label="Total Soft Costs"
                minKey="softCostsMin"
                maxKey="softCostsMax"
                description="Land rights + planning"
              />
              <CostItemInput
                label="Total Project Range"
                minKey="projectMin"
                maxKey="projectMax"
                description="All-in project cost"
              />
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Grid Connection Cost Summary</h3>
                {setShowSourceInfo && (
                  <button 
                    onClick={() => setShowSourceInfo('gridCost')}
                    className="text-blue-500 hover:text-blue-700 p-1 h-6 w-6"
                    title="View source information"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600">Total Construction Cost Range</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(costs.constructionMin)} - {formatCurrency(costs.constructionMax)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-slate-600">Soft Costs Range</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {formatCurrency(costs.softCostsMin)} - {formatCurrency(costs.softCostsMax)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-slate-600">Total Project Cost Range</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(costs.projectMin)} - {formatCurrency(costs.projectMax)}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
