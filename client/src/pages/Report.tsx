import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useLocation } from 'wouter';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportData {
  projectName: string;
  description: string;
  systemSize: number;
  projectLife: number;
  capex: number;
  lcoe: number;
  irr: number;
  npv: number;
  paybackPeriod: number;
  operatorNPV: number;
  operatorIRR: number;
  offtakerSavings: number;
  landownerIncome: number;
  developerPremium: number;
  totalValue: number;
  assumptions: Record<string, any>;
  cashFlows: {
    operator: Array<any>;
    offtaker: Array<any>;
    landowner: Array<any>;
    developer: Array<any>;
  };
}

interface DrawnPolygons {
  pvArea?: {
    coordinates: [number, number][];
    area: number;
    systemSize: number;
  };
  cableRoute?: {
    coordinates: [number, number][];
    distance: number;
  };
}

export default function Report() {
  const [, navigate] = useLocation();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [drawnPolygons, setDrawnPolygons] = useState<DrawnPolygons | null>(null);
  const [mapScreenshot, setMapScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem('reportData');
    const polygons = sessionStorage.getItem('drawnPolygons');
    const screenshot = sessionStorage.getItem('mapScreenshot');

    if (data) {
      try {
        setReportData(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse reportData:', e);
      }
    }

    if (polygons) {
      try {
        setDrawnPolygons(JSON.parse(polygons));
      } catch (e) {
        console.error('Failed to parse drawnPolygons:', e);
      }
    }

    if (screenshot) {
      setMapScreenshot(screenshot);
    }

    setLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
          >
            <ArrowLeft size={20} />
            Back to Calculator
          </button>
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">No Report Data</h1>
            <p className="text-gray-600 mb-8">
              Please generate a report from the calculator first.
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stakeholderData = [
    { name: 'Operator', value: Math.max(0, reportData.operatorNPV), color: '#808080' },
    { name: 'Offtaker', value: reportData.offtakerSavings, color: '#2D8659' },
    { name: 'Landowner', value: reportData.landownerIncome, color: '#FFD700' },
    { name: 'Developer', value: reportData.developerPremium, color: '#001F3F' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <div className="border-b-4 border-yellow-500 bg-gray-50 p-8 print:p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Project Report</h1>
            <p className="text-gray-700 text-lg">{reportData.projectName}</p>
            {reportData.description && (
              <p className="text-gray-600 mt-2">{reportData.description}</p>
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 print:p-4">
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Project Overview
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">Total CAPEX</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.capex)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">LCOE Real</p>
              <p className="text-2xl font-bold text-blue-900">£{formatNumber(reportData.lcoe, 0)}/MWh</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">IRR Unlevered</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(reportData.irr, 2)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">Payback Period</p>
              <p className="text-2xl font-bold text-blue-900">
                {reportData.paybackPeriod > reportData.projectLife ? '> Project Life' : `${formatNumber(reportData.paybackPeriod, 1)} yrs`}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">Total NPV</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.npv)}</p>
            </div>
          </div>
        </section>

        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Stakeholder Value Distribution
          </h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stakeholderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stakeholderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {stakeholderData.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border-l-4"
                  style={{ borderColor: item.color, backgroundColor: `${item.color}15` }}
                >
                  <p className="text-sm font-semibold text-gray-700">{item.name}</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-gray-600">
                    {((item.value / reportData.totalValue) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Site Location Map
          </h2>
          {mapScreenshot ? (
            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
              <img
                src={mapScreenshot}
                alt="Site location map"
                className="w-full h-auto"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-300">
              <p className="text-gray-600">Map screenshot not available - visit the Map page to draw site boundaries</p>
            </div>
          )}
          {drawnPolygons && drawnPolygons.pvArea && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-gray-700">PV Area</p>
                <p className="text-lg font-bold text-green-700">
                  {formatNumber(drawnPolygons.pvArea.area / 10000, 2)} ha
                </p>
                <p className="text-sm text-gray-600">System Size: {formatNumber(drawnPolygons.pvArea.systemSize, 2)} MW</p>
              </div>
            </div>
          )}
          {drawnPolygons && drawnPolygons.cableRoute && (
            <div className="mt-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700">Cable Route</p>
              <p className="text-lg font-bold text-blue-700">
                {formatNumber(drawnPolygons.cableRoute.distance, 2)} km
              </p>
            </div>
          )}
        </section>

        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Cash Flow Analysis
          </h2>

          {reportData.cashFlows.operator && reportData.cashFlows.operator.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: '#808080' }}></span>
                Operator Cash Flows
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Year</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Generation MWh</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Revenue</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">OPEX</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Net CF</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Discounted CF</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Cumulative DCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cashFlows.operator.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                      >
                        <td className="px-3 py-2 text-gray-800 font-semibold">{row.year}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatNumber(row.generation, 0)}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(row.revenue)}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(row.opex)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-semibold">{formatCurrency(row.netCF)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-semibold">{formatCurrency(row.discountedCF)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-bold">{formatCurrency(row.cumulativeDCF)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.cashFlows.offtaker && reportData.cashFlows.offtaker.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: '#2D8659' }}></span>
                Offtaker Savings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Year</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Annual Savings</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Discounted Savings</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Cumulative DCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cashFlows.offtaker.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                      >
                        <td className="px-3 py-2 text-gray-800 font-semibold">{row.year}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(row.savings)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-semibold">{formatCurrency(row.discountedSavings)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-bold">{formatCurrency(row.cumulativeDCF)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.cashFlows.landowner && reportData.cashFlows.landowner.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD700' }}></span>
                Landowner Rental Income
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Year</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Rental Income</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Discounted Income</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Cumulative DCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cashFlows.landowner.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                      >
                        <td className="px-3 py-2 text-gray-800 font-semibold">{row.year}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(row.rental)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-semibold">{formatCurrency(row.discountedRental)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-bold">{formatCurrency(row.cumulativeDCF)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.cashFlows.developer && reportData.cashFlows.developer.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: '#001F3F' }}></span>
                Developer Premium
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Year</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Premium</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Discounted Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cashFlows.developer.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                      >
                        <td className="px-3 py-2 text-gray-800 font-semibold">{row.year}</td>
                        <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(row.premium)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 font-semibold">{formatCurrency(row.discountedPremium)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Key Assumptions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {Object.entries(reportData.assumptions).map(([key, value], idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-700 w-1/2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {typeof value === 'number'
                        ? key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent')
                          ? `${formatNumber(value, 2)}%`
                          : key.toLowerCase().includes('cost') || key.toLowerCase().includes('price')
                          ? formatCurrency(value)
                          : formatNumber(value, 2)
                        : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-yellow-500 pb-3">
            Data Sources and Methodology
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Generation data based on PVGIS irradiance data for site location</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>EPC costs sourced from latest solar industry benchmarks 2024-25</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Grid connection costs calculated using SSEN charging statements</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Wayleave rates based on ENA standard rates for private wires</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Financial projections use standard DCF methodology with annual inflation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>All costs inflated annually at specified CPI rate</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Discount rate applied to future cash flows for NPV calculations</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12 print:mb-8">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Disclaimer</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              This report contains indicative projections based on data current as of January 2026. These projections are
              provided for information purposes only and should not be relied upon for investment decisions without professional
              verification. Actual results may differ materially from projections due to changes in market conditions, regulatory
              environment, technology costs, and other factors. This analysis assumes continuation of current policies and market
              conditions. Users should conduct their own due diligence and seek professional advice before making investment decisions.
              Savills Earth accepts no liability for decisions made based on this report.
            </p>
          </div>
        </section>

        <footer className="border-t-2 border-yellow-500 pt-8 mt-12 text-center text-gray-600 text-sm print:mt-8">
          <p className="mb-2">Produced by Savills Earth</p>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </footer>
      </div>
    </div>
  );
}
