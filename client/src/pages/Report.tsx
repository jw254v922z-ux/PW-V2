import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ReportMap } from "@/components/ReportMap";

interface ReportData {
  projectName: string;
  mapScreenshot: string | null;
  metrics: {
    totalCapex: number;
    lcoe: number;
    irr: number;
    paybackPeriod: string;
    totalNpv: number;
    projectLife: number;
  };
  stakeholders: {
    operator: { npv: number; irr: number };
    offtaker: { yearlySavings: number; totalSavings: number };
    landowner: { yearlyIncome: number; totalIncome: number; yield: number };
    developer: { premium: number };
  };
  stakeholderDistribution: {
    operator: number;
    offtaker: number;
    landowner: number;
    developer: number;
  };
  cashFlow: Array<{
    year: number;
    revenue: number;
    opex: number;
    netCashFlow: number;
    discountedCashFlow: number;
  }>;
  assumptions: {
    systemSize: number;
    projectLife: number;
    epcCost: number;
    privateWireCost: number;
    devPremium: number;
    landRentalCost: number;
    opex: number;
    ppaPrice: number;
    exportPrice: number;
    offsetableEnergyCost: number;
    discountRate: number;
    degradation: number;
  };
}

// Savills Earth brand colors
const COLORS = {
  yellow: '#FFD700',
  navyBlue: '#1a2332',
  forestGreen: '#2d7a4f',
  gray: '#808080',
  lightYellow: '#fff9e6',
};

export default function Report() {
  const [, setLocation] = useLocation();
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    // Load report data from sessionStorage
    const dataStr = sessionStorage.getItem("reportData");
    if (!dataStr) {
      // Redirect back to calculator if no data
      setLocation("/");
      return;
    }

    try {
      const data = JSON.parse(dataStr) as ReportData;
      setReportData(data);
    } catch (error) {
      console.error("Failed to parse report data:", error);
      setLocation("/");
    }
  }, [setLocation]);

  // Draw pie chart after data is loaded
  useEffect(() => {
    if (!reportData) return;

    const canvas = document.getElementById('stakeholder-pie-chart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pie chart data with Savills Earth colors
    const data = [
      { label: 'Operator', value: reportData.stakeholderDistribution.operator, color: COLORS.gray },
      { label: 'Offtaker', value: reportData.stakeholderDistribution.offtaker, color: COLORS.forestGreen },
      { label: 'Landowner', value: reportData.stakeholderDistribution.landowner, color: COLORS.yellow },
      { label: 'Developer', value: reportData.stakeholderDistribution.developer, color: COLORS.navyBlue },
    ];

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
      const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.label}\n${item.value.toFixed(1)}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  }, [reportData]);

  // Check if polygon data exists in sessionStorage
  const hasMapData = sessionStorage.getItem('pvPolygonData') || sessionStorage.getItem('cablePolylineData');

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading report...</p>
      </div>
    );
  }

  const { projectName, mapScreenshot, metrics, stakeholders, stakeholderDistribution, cashFlow, assumptions } = reportData;

  console.log('[Report] mapScreenshot exists:', !!mapScreenshot);
  console.log('[Report] mapScreenshot length:', mapScreenshot ? mapScreenshot.length : 0);

  return (
    <div className="report-container bg-white text-black">
      {/* Page 1: Cover + Map + Key Metrics */}
      <div className="report-page">
        <div className="report-header">
          <h1 className="text-4xl font-bold mb-4" style={{ color: COLORS.navyBlue }}>Solar Project Analysis</h1>
          <h2 className="text-2xl text-gray-600 mb-8">{projectName}</h2>
        </div>

        <div className="disclaimer p-4 mb-8 rounded" style={{ backgroundColor: COLORS.lightYellow }}>
          <h3 className="font-bold text-sm mb-2">Tool Limitations & Disclaimer</h3>
          <p className="text-xs text-gray-700">
            This calculator provides indicative financial projections based on industry assumptions and publicly available data sources. 
            All data and assumptions are valid as of January 2026. Results are for indicative purposes only and should not be relied upon 
            for investment decisions. Grid costs, irradiance data, and technology assumptions may vary significantly by location. Costs and 
            pricing may change over time. Site-specific conditions (soil, access, environmental) are not accounted for. This tool does not 
            include all potential costs (e.g., planning, environmental surveys, financing). Results should not be relied upon for investment 
            decisions without independent professional verification from qualified engineers, surveyors, and financial advisors.
          </p>
        </div>

        {hasMapData && (
          <div className="map-section mb-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.navyBlue }}>Site Location Map</h3>
            <ReportMap className="w-full border border-gray-300 rounded" />
          </div>
        )}

        <div className="metrics-grid grid grid-cols-2 gap-4 mb-8">
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">Total CAPEX</div>
            <div className="text-2xl font-bold">£{metrics.totalCapex.toLocaleString()}</div>
          </div>
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">LCOE (Real)</div>
            <div className="text-2xl font-bold">£{metrics.lcoe.toFixed(2)}/MWh</div>
          </div>
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">IRR (Unlevered)</div>
            <div className="text-2xl font-bold">{metrics.irr.toFixed(2)}%</div>
          </div>
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">Payback Period</div>
            <div className="text-2xl font-bold">{metrics.paybackPeriod}</div>
          </div>
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">Total NPV</div>
            <div className="text-2xl font-bold">£{metrics.totalNpv.toLocaleString()}</div>
          </div>
          <div className="metric-card border border-gray-300 p-4 rounded">
            <div className="text-sm text-gray-600">Project Life</div>
            <div className="text-2xl font-bold">{metrics.projectLife} years</div>
          </div>
        </div>

        <div className="report-footer">
          <p className="text-sm text-gray-500">Produced by Savills Earth</p>
          <p className="text-sm text-gray-500">Page 1 of 4</p>
        </div>
      </div>

      {/* Page 2: Stakeholder Distribution */}
      <div className="report-page page-break">
        <div className="section-header p-4 mb-8" style={{ backgroundColor: COLORS.yellow }}>
          <h2 className="text-3xl font-bold" style={{ color: COLORS.navyBlue }}>Stakeholder Value Distribution</h2>
        </div>

        <div className="stakeholder-chart mb-8 flex justify-center">
          <canvas id="stakeholder-pie-chart" width="400" height="400"></canvas>
        </div>

        <div className="stakeholder-metrics grid grid-cols-2 gap-4">
          <div className="stakeholder-card p-4 rounded" style={{ backgroundColor: COLORS.gray, color: 'white' }}>
            <h3 className="font-bold mb-2">Operator</h3>
            <p className="text-sm">Value: £{stakeholders.operator.npv.toLocaleString()}</p>
            <p className="text-sm">Percentage: {stakeholderDistribution.operator.toFixed(1)}%</p>
          </div>
          <div className="stakeholder-card p-4 rounded" style={{ backgroundColor: COLORS.forestGreen, color: 'white' }}>
            <h3 className="font-bold mb-2">Offtaker</h3>
            <p className="text-sm">Total Savings: £{stakeholders.offtaker.totalSavings.toLocaleString()}</p>
            <p className="text-sm">Percentage: {stakeholderDistribution.offtaker.toFixed(1)}%</p>
          </div>
          <div className="stakeholder-card p-4 rounded" style={{ backgroundColor: COLORS.yellow, color: COLORS.navyBlue }}>
            <h3 className="font-bold mb-2">Landowner</h3>
            <p className="text-sm">Total Income: £{stakeholders.landowner.totalIncome.toLocaleString()}</p>
            <p className="text-sm">Percentage: {stakeholderDistribution.landowner.toFixed(1)}%</p>
          </div>
          <div className="stakeholder-card p-4 rounded" style={{ backgroundColor: COLORS.navyBlue, color: 'white' }}>
            <h3 className="font-bold mb-2">Developer</h3>
            <p className="text-sm">Premium: £{stakeholders.developer.premium.toLocaleString()}</p>
            <p className="text-sm">Percentage: {stakeholderDistribution.developer.toFixed(1)}%</p>
          </div>
        </div>

        <div className="report-footer">
          <p className="text-sm text-gray-500">Produced by Savills Earth</p>
          <p className="text-sm text-gray-500">Page 2 of 4</p>
        </div>
      </div>

      {/* Page 3: Cash Flow Analysis */}
      <div className="report-page page-break">
        <div className="section-header p-4 mb-8" style={{ backgroundColor: COLORS.yellow }}>
          <h2 className="text-3xl font-bold" style={{ color: COLORS.navyBlue }}>Annual Cash Flow Analysis</h2>
        </div>

        <div className="cash-flow-table mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: COLORS.navyBlue, color: 'white' }}>
                <th className="border border-gray-300 p-2">Year</th>
                <th className="border border-gray-300 p-2">Revenue (£)</th>
                <th className="border border-gray-300 p-2">OPEX (£)</th>
                <th className="border border-gray-300 p-2">Net Cash Flow (£)</th>
                <th className="border border-gray-300 p-2">Discounted CF (£)</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.map((row, index) => (
                <tr key={row.year} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f5f5f5' }}>
                  <td className="border border-gray-300 p-2 text-center">{row.year}</td>
                  <td className="border border-gray-300 p-2 text-right">{row.revenue.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{row.opex.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{row.netCashFlow.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{row.discountedCashFlow.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cash-flow-summary">
          <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.navyBlue }}>Cash Flow Summary by Stakeholder</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 rounded" style={{ backgroundColor: COLORS.gray, color: 'white' }}>
              <span className="font-bold">Operator</span>
              <span className="float-right">NPV: £{stakeholders.operator.npv.toLocaleString()} | IRR: {stakeholders.operator.irr.toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: COLORS.forestGreen, color: 'white' }}>
              <span className="font-bold">Offtaker</span>
              <span className="float-right">NPV: £{stakeholders.offtaker.totalSavings.toLocaleString()} | IRR: 0.00%</span>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: COLORS.yellow, color: COLORS.navyBlue }}>
              <span className="font-bold">Landowner</span>
              <span className="float-right">NPV: £{stakeholders.landowner.totalIncome.toLocaleString()} | IRR: 0.00%</span>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: COLORS.navyBlue, color: 'white' }}>
              <span className="font-bold">Developer</span>
              <span className="float-right">NPV: £{stakeholders.developer.premium.toLocaleString()} | IRR: 0.00%</span>
            </div>
          </div>
        </div>

        <div className="report-footer">
          <p className="text-sm text-gray-500">Produced by Savills Earth</p>
          <p className="text-sm text-gray-500">Page 3 of 4</p>
        </div>
      </div>

      {/* Page 4: Assumptions */}
      <div className="report-page page-break">
        <div className="section-header p-4 mb-8" style={{ backgroundColor: COLORS.yellow }}>
          <h2 className="text-3xl font-bold" style={{ color: COLORS.navyBlue }}>Key Assumptions</h2>
        </div>

        <div className="assumptions-grid grid grid-cols-2 gap-4">
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">System Size:</span> {assumptions.systemSize} MW
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Project Life:</span> {assumptions.projectLife} years
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">EPC Cost:</span> £{assumptions.epcCost.toLocaleString()}/MW
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Private Wire Cost:</span> £{assumptions.privateWireCost.toLocaleString()}
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Developer Premium:</span> £{assumptions.devPremium.toLocaleString()}/MW
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Land Rental Cost:</span> £{assumptions.landRentalCost.toLocaleString()}/MW/year
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">OPEX:</span> £{assumptions.opex.toLocaleString()}/MW/year
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">PPA Price:</span> £{assumptions.ppaPrice}/MWh
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Export Price:</span> £{assumptions.exportPrice}/MWh
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Offsetable Energy Cost:</span> £{assumptions.offsetableEnergyCost}/MWh
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Discount Rate:</span> {(assumptions.discountRate * 100).toFixed(2)}%
          </div>
          <div className="assumption-item p-3 border border-gray-300 rounded">
            <span className="font-bold">Panel Degradation:</span> {(assumptions.degradation * 100).toFixed(2)}%
          </div>
        </div>

        <div className="report-footer mt-8">
          <p className="text-sm text-gray-500">Produced by Savills Earth</p>
          <p className="text-sm text-gray-500">Page 4 of 4</p>
        </div>
      </div>

      <style>{`
        @media print {
          .report-page {
            page-break-after: always;
            padding: 40px;
            min-height: 100vh;
          }
          .page-break {
            page-break-before: always;
          }
          .report-footer {
            position: fixed;
            bottom: 20px;
            left: 40px;
            right: 40px;
            display: flex;
            justify-content: space-between;
          }
          .section-header {
            margin-left: -40px;
            margin-right: -40px;
            padding-left: 40px !important;
            padding-right: 40px !important;
          }
        }

        @media screen {
          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .report-page {
            background: white;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            min-height: 297mm;
          }
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
