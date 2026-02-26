import html2pdf from 'html2pdf.js';
import { SolarInputs, SolarResults } from './calculator';
import { formatCurrency, formatNumberWithCommas } from './formatters';

export async function generatePDFReportHtml2pdf(params: {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
  mapScreenshot?: string;
}): Promise<void> {
  const { inputs, results, projectName, description, mapScreenshot } = params;

  // Create HTML content for the PDF
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .page {
          page-break-after: always;
          padding: 20mm;
          min-height: 297mm;
          background: white;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .header {
          background-color: #FFD700;
          padding: 12px 15px;
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: bold;
          color: #000;
        }
        
        .title {
          font-size: 32px;
          font-weight: bold;
          color: #001F3F;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
        }
        
        .disclaimer {
          background-color: #FFFACD;
          border: 1px solid #FFD700;
          padding: 15px;
          margin-bottom: 20px;
          font-size: 12px;
          line-height: 1.5;
        }
        
        .disclaimer-title {
          font-weight: bold;
          color: #FFB700;
          margin-bottom: 8px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-box {
          border: 1px solid #ccc;
          padding: 15px;
          background: #f9f9f9;
        }
        
        .metric-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .metric-value {
          font-size: 20px;
          font-weight: bold;
          color: #001F3F;
        }
        
        .map-container {
          text-align: center;
          margin: 20px 0;
        }
        
        .map-image {
          max-width: 100%;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .stakeholder-section {
          margin-bottom: 30px;
        }
        
        .stakeholder-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .stakeholder-box {
          padding: 15px;
          color: white;
          border-radius: 4px;
        }
        
        .stakeholder-box.operator {
          background-color: #808080;
        }
        
        .stakeholder-box.offtaker {
          background-color: #2D8659;
        }
        
        .stakeholder-box.landowner {
          background-color: #FFD700;
          color: #000;
        }
        
        .stakeholder-box.developer {
          background-color: #001F3F;
        }
        
        .stakeholder-label {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .stakeholder-value {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stakeholder-percentage {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .chart-container {
          text-align: center;
          margin: 20px 0;
        }
        
        .chart-container img {
          max-width: 100%;
          height: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
  `;

  // PAGE 1: Cover with Map
  htmlContent += `
    <div class="page">
      <div class="title">Solar Project Analysis</div>
      <div class="subtitle">${projectName}</div>
      
      <div class="disclaimer">
        <div class="disclaimer-title">Tool Limitations & Disclaimer</div>
        <div>This calculator provides indicative financial projections based on industry assumptions and publicly available data sources. All data and assumptions are valid as of January 2026. Results are for indicative purposes only and should not be relied upon for investment decisions. Grid costs, irradiance data, and technology assumptions may vary significantly by location. Costs and pricing may change over time. Site-specific conditions (soil, access, environmental) are not accounted for. This does not include all potential costs (e.g., planning, environmental surveys, financing). Results should not be relied upon for investment decisions without independent professional verification from qualified engineers, surveyors, and financial advisors.</div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Total CAPEX</div>
          <div class="metric-value">${formatCurrency(results.summary.totalCapex)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">LCOE (Real)</div>
          <div class="metric-value">£${(results.summary.lcoe || 0).toFixed(0)}/MWh</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">IRR (Unlevered)</div>
          <div class="metric-value">${((results.summary.irr || 0) * 100).toFixed(2)}%</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Payback Period</div>
          <div class="metric-value">${(results.summary.paybackPeriod || 0) > 15 ? '> Project Life' : (results.summary.paybackPeriod || 0).toFixed(1) + ' Years'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Total NPV</div>
          <div class="metric-value">${formatCurrency(results.summary.totalDiscountedCashFlow)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Project Life</div>
          <div class="metric-value">${inputs.projectLife} years</div>
        </div>
      </div>
      
      ${mapScreenshot ? `
        <div class="header">Site Location Map</div>
        <div class="map-container">
          <img src="${mapScreenshot}" alt="Site Location Map" class="map-image" style="max-height: 250px;">
        </div>
      ` : ''}
      
      <div class="footer">
        <div>Produced by Savills Earth</div>
        <div>Page 1</div>
      </div>
    </div>
  `;

  // PAGE 2: Stakeholder Value
  htmlContent += `
    <div class="page">
      <div class="header">Stakeholder Value Distribution</div>
      
      <div class="stakeholder-section">
        <div class="stakeholder-grid">
          <div class="stakeholder-box operator">
            <div class="stakeholder-label">Operator</div>
            <div class="stakeholder-value">${formatCurrency(Math.max(0, results.summary.totalDiscountedCashFlow))}</div>
            <div class="stakeholder-percentage">${((Math.max(0, results.summary.totalDiscountedCashFlow) / (Math.max(0, results.summary.totalDiscountedCashFlow) + 1)) * 100).toFixed(1)}% of total</div>
          </div>
          <div class="stakeholder-box offtaker">
            <div class="stakeholder-label">Offtaker</div>
            <div class="stakeholder-value">${formatCurrency(results.summary.totalOfftakerSavings)}</div>
            <div class="stakeholder-percentage">${((results.summary.totalOfftakerSavings / (Math.max(0, results.summary.totalDiscountedCashFlow) + results.summary.totalOfftakerSavings + results.summary.totalLandownerRental + results.summary.developerPremium)) * 100).toFixed(1)}% of total</div>
          </div>
          <div class="stakeholder-box landowner">
            <div class="stakeholder-label">Landowner</div>
            <div class="stakeholder-value">${formatCurrency(results.summary.totalLandownerRental)}</div>
            <div class="stakeholder-percentage">${((results.summary.totalLandownerRental / (Math.max(0, results.summary.totalDiscountedCashFlow) + results.summary.totalOfftakerSavings + results.summary.totalLandownerRental + results.summary.developerPremium)) * 100).toFixed(1)}% of total</div>
          </div>
          <div class="stakeholder-box developer">
            <div class="stakeholder-label">Developer</div>
            <div class="stakeholder-value">${formatCurrency(results.summary.developerPremium)}</div>
            <div class="stakeholder-percentage">${((results.summary.developerPremium / (Math.max(0, results.summary.totalDiscountedCashFlow) + results.summary.totalOfftakerSavings + results.summary.totalLandownerRental + results.summary.developerPremium)) * 100).toFixed(1)}% of total</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div>Produced by Savills Earth</div>
        <div>Page 2</div>
      </div>
    </div>
  `;

  // PAGE 3: Financial Metrics
  htmlContent += `
    <div class="page">
      <div class="header">Financial Metrics</div>
      
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Total CAPEX</td>
          <td>${formatCurrency(results.summary.totalCapex)}</td>
        </tr>
        <tr>
          <td>Total OPEX (Year 1)</td>
          <td>${formatCurrency(results.summary.opexYear1 || 0)}</td>
        </tr>
        <tr>
          <td>LCOE (Real)</td>
          <td>£${(results.summary.lcoe || 0).toFixed(2)}/MWh</td>
        </tr>
        <tr>
          <td>IRR (Unlevered)</td>
          <td>${((results.summary.irr || 0) * 100).toFixed(2)}%</td>
        </tr>
        <tr>
          <td>NPV (at ${(inputs.discountRate * 100).toFixed(1)}% discount)</td>
          <td>${formatCurrency(results.summary.totalDiscountedCashFlow)}</td>
        </tr>
        <tr>
          <td>Payback Period</td>
          <td>${(results.summary.paybackPeriod || 0) > 15 ? '> Project Life' : (results.summary.paybackPeriod || 0).toFixed(1) + ' years'}</td>
        </tr>
      </table>
      
      <div class="footer">
        <div>Produced by Savills Earth</div>
        <div>Page 3</div>
      </div>
    </div>
  `;

  // PAGE 4: Assumptions
  htmlContent += `
    <div class="page">
      <div class="header">Assumptions & Data Sources</div>
      
      <h3 style="margin-top: 20px; margin-bottom: 10px; color: #001F3F;">Project Assumptions</h3>
      <table>
        <tr>
          <th>Parameter</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Project Life</td>
          <td>${inputs.projectLife} years</td>
        </tr>
        <tr>
          <td>Installed Capacity</td>
          <td>${inputs.capacity.toFixed(2)} MWp</td>
        </tr>
        <tr>
          <td>CAPEX per MW</td>
          <td>${formatCurrency(inputs.epcCostPerMW)}</td>
        </tr>
        <tr>
          <td>OPEX per MW (Year 1)</td>
          <td>${formatCurrency(inputs.opexPerMW)}</td>
        </tr>
        <tr>
          <td>Cost Inflation Rate</td>
          <td>${(inputs.costInflationRate * 100).toFixed(2)}%</td>
        </tr>
        <tr>
          <td>PPA Price</td>
          <td>£${inputs.ppaPrice.toFixed(2)}/MWh</td>
        </tr>
        <tr>
          <td>Discount Rate</td>
          <td>${(inputs.discountRate * 100).toFixed(2)}%</td>
        </tr>
      </table>
      
      <h3 style="margin-top: 20px; margin-bottom: 10px; color: #001F3F;">Data Sources & Methodology</h3>
      <ul style="margin-left: 20px; font-size: 12px; line-height: 1.8;">
        <li>Grid connection costs: SSEN Distribution Cost Estimates (2025)</li>
        <li>Solar irradiance: UK Met Office historical averages</li>
        <li>EPC costs: Industry benchmarks (2026)</li>
        <li>Transformer costs: Manufacturer quotes</li>
        <li>Cable costs: Supplier pricing data</li>
        <li>Financial calculations: NPV at specified discount rate, IRR via iterative method</li>
        <li>All costs are updated in real-time as parameters are adjusted</li>
      </ul>
      
      <div class="footer">
        <div>Produced by Savills Earth</div>
        <div>Page 4</div>
      </div>
    </div>
  `;

  htmlContent += `
    </body>
    </html>
  `;

  // Generate PDF using html2pdf
  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: 0,
    filename: `${projectName}-report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}
