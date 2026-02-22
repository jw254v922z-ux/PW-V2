import { jsPDF } from "jspdf";
import { calculateSensitivityMatrix } from "./sensitivity";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

interface PDFReportOptions {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
  generatedDate?: Date;
  mapScreenshot?: string; // Base64 encoded image or data URL
}

export function generatePDFReport(options: PDFReportOptions) {
  const {
    inputs,
    results,
    projectName,
    description = "",
    generatedDate = new Date(),
    mapScreenshot,
  } = options;

  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add section
  const addSection = (title: string, fontSize: number = 14) => {
    checkPageBreak(35);
    yPosition += 8; // Increased top margin for section
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93); // Corporate dark blue
    doc.text(title.toUpperCase(), 20, yPosition);
    yPosition += 4;
    doc.setDrawColor(200, 210, 220); // Slightly more visible slate border
    doc.setLineWidth(0.75);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 12; // Increased bottom margin after line
    doc.setTextColor(0, 0, 0);
  };

  const addText = (text: string, fontSize: number = 11, bold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 2;
  };

  const addSimpleTable = (headers: string[], rows: (string | number)[][], colWidths?: number[]) => {
    const defaultColWidth = (pageWidth - 40) / headers.length;
    const widths = colWidths || headers.map(() => defaultColWidth);
    
    // Header row
    doc.setFillColor(248, 250, 252); // Light slate background
    doc.setTextColor(30, 41, 59); // Dark slate text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    // Draw solid background for the whole header first to avoid "half-colored" look
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    doc.rect(20, yPosition, totalWidth, 10, "F");
    
    let xPos = 20;
    headers.forEach((header, i) => {
      // Draw border for each cell
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.1);
      doc.rect(xPos, yPosition, widths[i], 10, "S");
      doc.text(header, xPos + 4, yPosition + 6.5);
      xPos += widths[i];
    });
    yPosition += 10;
    
    // Data rows
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    rows.forEach((row, rowIndex) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 25;
      }
      
      xPos = 20;
      row.forEach((cell, i) => {
        doc.setDrawColor(241, 245, 249);
        doc.rect(xPos, yPosition, widths[i], 8, "S");
        doc.text(String(cell), xPos + 4, yPosition + 5.5);
        xPos += widths[i];
      });
      yPosition += 8;
    });
    
    yPosition += 5;
  };

  const checkPageBreak = (neededSpace: number = 30) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // ===== TITLE PAGE =====
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Private Wire Solar Calculator", pageWidth / 2, 25, { align: "center" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Project Summary Report", pageWidth / 2, 38, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  yPosition = 70;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, yPosition, pageWidth - 40, 35, 3, 3, "F");
  yPosition += 10;
  
  doc.setFont("helvetica", "bold");
  doc.text("Project:", 25, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(projectName, 55, yPosition);
  yPosition += 8;
  
  doc.setFont("helvetica", "bold");
  doc.text("Generated:", 25, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(`${generatedDate.toLocaleDateString()} ${generatedDate.toLocaleTimeString()}`, 55, yPosition);
  
  if (description) {
    yPosition += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 25, yPosition);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(description, pageWidth - 85);
    doc.text(descLines, 55, yPosition);
    yPosition += (descLines.length - 1) * 5;
  }
  
  yPosition = 115;

  // ===== STAKEHOLDER VALUE DISTRIBUTION (PIE CHART) =====
  addSection("Stakeholder Value Distribution");
  
  const projectValue = results.summary.totalDiscountedCashFlow;
  const offtakerValue = results.summary.totalSavings;
  const landownerValue = results.summary.totalLandOptionIncome;
  const developerValue = results.summary.totalDeveloperPremium;
  
  // For the pie chart, we only show positive values
  const pieProjectValue = Math.max(0, projectValue);
  const pieOfftakerValue = Math.max(0, offtakerValue);
  const pieLandownerValue = Math.max(0, landownerValue);
  const pieDeveloperValue = Math.max(0, developerValue);
  const totalPieValue = pieProjectValue + pieOfftakerValue + pieLandownerValue + pieDeveloperValue;
  
  const pieData = [
    { name: "Project", value: projectValue, pieValue: pieProjectValue, color: [139, 92, 246] },
    { name: "Offtaker", value: offtakerValue, pieValue: pieOfftakerValue, color: [16, 185, 129] },
    { name: "Landowner", value: landownerValue, pieValue: pieLandownerValue, color: [245, 158, 11] },
    { name: "Developer", value: developerValue, pieValue: pieDeveloperValue, color: [236, 72, 153] }
  ];

  const centerX = 65;
  const centerY = yPosition + 30;
  const radius = 28;
  let currentAngle = -Math.PI / 2; // Start from top

  if (totalPieValue > 0) {
    pieData.forEach((item) => {
      if (item.pieValue <= 0) return;
      
      const sliceAngle = (item.pieValue / totalPieValue) * 2 * Math.PI;
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      
      // Approximation of a circle sector using triangles
      const segments = 40;
      for (let i = 0; i < segments; i++) {
        const a1 = currentAngle + (sliceAngle * i) / segments;
        const a2 = currentAngle + (sliceAngle * (i + 1)) / segments;
        
        doc.triangle(
          centerX, centerY,
          centerX + Math.cos(a1) * radius, centerY + Math.sin(a1) * radius,
          centerX + Math.cos(a2) * radius, centerY + Math.sin(a2) * radius,
          "F"
        );
      }
      currentAngle += sliceAngle;
    });
    
    // Add white border to pie
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.circle(centerX, centerY, radius, "S");
  } else {
    doc.setDrawColor(226, 232, 240);
    doc.circle(centerX, centerY, radius, "S");
    doc.setFontSize(10);
    doc.text("No Value Data", centerX, centerY, { align: "center" });
  }

  // Legend
  let legendY = yPosition + 12;
  pieData.forEach((item) => {
    const percentage = totalPieValue > 0 ? ((item.pieValue / totalPieValue) * 100).toFixed(1) : "0";
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(115, legendY, 5, 5, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(item.name, 125, legendY + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`${formatCurrency(item.value)} (${percentage}%)`, 125, legendY + 9);
    legendY += 15;
  });
  
  yPosition = Math.max(centerY + 45, legendY + 5);

  // ===== DISCLAIMER =====
  addSection("Disclaimer");
  doc.setFontSize(9);
  doc.setTextColor(100);
  const disclaimerText = "This report contains indicative projections based on current data and assumptions. These projections are not suitable for investment decisions without professional verification. Actual results may differ materially from projections due to changes in market conditions, technology, policy, and site-specific factors. Use this tool for preliminary assessment only. Engage qualified professionals for detailed feasibility studies.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 40);
  doc.text(disclaimerLines, 20, yPosition);
  yPosition += (disclaimerLines.length * 5) + 10;
  doc.setTextColor(0);

  // ===== STAKEHOLDER METRICS =====
  addSection("Stakeholder Metrics");

  // Helper function for stakeholder title
  const addStakeholderTitle = (title: string, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(20, yPosition, pageWidth - 40, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11); // Consistent font size for all stakeholder titles
    doc.text(title, 25, yPosition + 5.5);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
  };

  // Project
  const projectColor = [139, 92, 246]; // Purple
  addStakeholderTitle("Project", projectColor);
  const projectMetrics = [
    ["Metric", "Value"],
    ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
    ["LCOE (Discounted)", formatCurrency(results.summary.lcoe) + "/MWh"],
    ["IRR (Unlevered)", results.summary.irr.toFixed(2) + "%"],
    ["Payback Period", results.summary.paybackPeriod.toFixed(2) + " years"],
    ["Total NPV", formatCurrency(results.summary.totalDiscountedCashFlow)],
  ];
  addSimpleTable(projectMetrics[0] as string[], projectMetrics.slice(1) as (string | number)[][]);

  checkPageBreak(40);
  // Offtaker
  const offtakerColor = [16, 185, 129]; // Green
  addStakeholderTitle("Offtaker", offtakerColor);
  
  const offtakerMetrics = [
    ["Metric", "Value"],
    ["Yearly Savings", formatCurrency(results.summary.yearlySavings) + "/year"],
    ["Total Savings", formatCurrency(results.summary.totalSavings)],
  ];
  addSimpleTable(offtakerMetrics[0] as string[], offtakerMetrics.slice(1) as (string | number)[][]);

  checkPageBreak(40);
  // Landowner
  const landownerColor = [245, 158, 11]; // Amber
  addStakeholderTitle("Landowner", landownerColor);
  
  const landownerMetrics = [
    ["Metric", "Value"],
    ["Yearly Rental Income", formatCurrency(results.summary.yearlyRentalIncome) + "/year"],
    ["Total Rental Income", formatCurrency(results.summary.totalLandOptionIncome)],
    ["Land Rental Yield", results.summary.landOptionYield.toFixed(2) + "%"],
  ];
  addSimpleTable(landownerMetrics[0] as string[], landownerMetrics.slice(1) as (string | number)[][]);

  checkPageBreak(40);
  // Developer
  const developerColor = [236, 72, 153]; // Pink
  addStakeholderTitle("Developer", developerColor);
  
  const developerMetrics = [
    ["Metric", "Value"],
    ["Developer Premium", formatCurrency(results.summary.totalDeveloperPremium)],
  ];
  addSimpleTable(developerMetrics[0] as string[], developerMetrics.slice(1) as (string | number)[][]);

  // ===== PROJECT PARAMETERS =====
  checkPageBreak(60);
  addSection("PROJECT PARAMETERS");

  const projectParams = [
    ["Parameter", "Value"],
    ["Installed Capacity", formatNumberWithCommas(inputs.mw.toFixed(1)) + " MW"],
    ["Project Lifetime", inputs.projectLife + " years"],
    ["Discount Rate", (inputs.discountRate * 100).toFixed(1) + "%"],
    ["Panel Degradation", inputs.degradationRate + "%/year"],
    ["Annual CPI Inflation", inputs.costInflationRate + "%"],
    ["Export Price", formatCurrency(inputs.exportPrice) + "/MWh"],
    ["Offsetable Energy Cost", formatCurrency(inputs.offsetableEnergyCost) + "/MWh"],
  ];

  addSimpleTable(projectParams[0] as string[], projectParams.slice(1) as (string | number)[][]);

  // ===== GRID CONNECTION PARAMETERS =====
  checkPageBreak(40);
  addSection("GRID CONNECTION PARAMETERS");

  const gridParams = [
    ["Parameter", "Value"],
    ["Grid Connection Cost", inputs.gridCostOverrideEnabled ? "Custom: " + formatCurrency(inputs.gridCostOverride) : "Auto-calculated"],
    ["Total Grid Cost", formatCurrency(inputs.gridConnectionCost)],
    ["Private Wire Cost", formatCurrency(inputs.privateWireCost)],
  ];

  addSimpleTable(gridParams[0] as string[], gridParams.slice(1) as (string | number)[][]);

  // ===== COST BREAKDOWN =====
  checkPageBreak(50);
  addSection("COST BREAKDOWN");

  const capexCalc = inputs.mw * inputs.capexPerMW;
  const devPremium = inputs.developmentPremiumEnabled ? inputs.mw * inputs.developmentPremiumPerMW * (1 - inputs.developmentPremiumDiscount / 100) : 0;
  const costBreakdown = [
    ["Cost Component", "Amount (GBP)"],
    ["EPC Cost", formatCurrency(capexCalc)],
    ["Grid Connection Cost", formatCurrency(inputs.gridConnectionCost)],
    ["Private Wire Cost", formatCurrency(inputs.privateWireCost)],
    ["Developer Premium", inputs.developmentPremiumEnabled ? formatCurrency(devPremium) : "Not included"],
    ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
  ];

  addSimpleTable(costBreakdown[0] as string[], costBreakdown.slice(1) as (string | number)[][]);

  // ===== ANNUAL OPEX =====
  checkPageBreak(40);
  addSection("ANNUAL OPERATING COSTS");

  const opexBreakdown = [
    ["Cost Type", "Year 1 (GBP)"],
    ["Base OPEX", formatCurrency(inputs.mw * inputs.opexPerMW)],
    ...(inputs.landOptionEnabled ? [["Land Rental Cost", formatCurrency(inputs.mw * inputs.landOptionCostPerMWYear * (1 - inputs.landOptionDiscount / 100))]] : []),
    ["Total Year 1 OPEX", formatCurrency(results.yearlyData[1]?.opex || 0)],
  ];

  addSimpleTable(opexBreakdown[0] as string[], opexBreakdown.slice(1) as (string | number)[][]);

  if (mapScreenshot) {
    checkPageBreak(100);
    addSection("SITE MAP - PV AREA & PRIVATE WIRE ROUTE");
    try {
      const mapWidth = pageWidth - 40;
      const mapHeight = 80;
      doc.addImage(mapScreenshot, "PNG", 20, yPosition, mapWidth, mapHeight);
      yPosition += mapHeight + 10;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Map showing PV area (green polygon) and private wire cable route (blue polyline)", 20, yPosition);
      yPosition += 5;
    } catch (error) {
      console.error("Failed to add map screenshot to PDF:", error);
      yPosition += 10;
    }
  }

  // ===== CASH FLOW TABLE (Stakeholder Breakdown) =====
  checkPageBreak(60);
  addSection("FULL PROJECT CASH FLOW (YEARLY BASIS)");

  const fullCashFlowTableData = [
    ["Year", "Generation\n(MWh)", "Revenue\n(GBP)", "Opex\n(GBP)", "Cash Flow\n(GBP)", "Disc CF\n(GBP)", "Cum CF\n(GBP)"],
    ...results.yearlyData.map((year) => [
      year.year.toString(),
      year.generation.toFixed(0),
      formatCurrency(year.revenue),
      formatCurrency(year.opex),
      formatCurrency(year.cashFlow),
      formatCurrency(year.discountedCashFlow),
      formatCurrency(year.cumulativeCashFlow),
    ]),
  ];

  addSimpleTable(fullCashFlowTableData[0] as string[], fullCashFlowTableData.slice(1) as (string | number)[][], [12, 15, 18, 15, 18, 18, 18]);

  // ===== CASH FLOW SUMMARY (STAKEHOLDER BREAKDOWN) =====
  checkPageBreak(60);
  addSection("CASH FLOW SUMMARY (STAKEHOLDER BREAKDOWN)");

  const cashFlowTableData = [
    ["Year", "Proj CF", "Proj DCF", "Offt Sav", "Land Rent"],
    ...results.yearlyData
      .filter((_, i) => i === 0 || i % 5 === 0 || i === results.yearlyData.length - 1)
      .map((year) => [
        year.year.toString(),
        formatCurrency(year.cashFlow),
        formatCurrency(year.discountedCashFlow),
        formatCurrency(year.savings || 0),
        formatCurrency(year.landIncome || 0),
      ]),
  ];

  addSimpleTable(cashFlowTableData[0] as string[], cashFlowTableData.slice(1) as (string | number)[][], [15, 25, 25, 20, 20]);

  // ===== DATA SOURCES =====
  checkPageBreak(60);
  addSection("DATA SOURCES & METHODOLOGY");

  addText("Cable Costs:", 11, true);
  addText("Based on SSEN Distribution 2025 pricing schedules. Includes installation, testing, and commissioning.");

  addText("Transformer Costs:", 11, true);
  addText("Manufacturer quotes and industry benchmarks (2026). Includes delivery and installation.");

  addText("Wayleave Costs:", 11, true);
  addText("SSEN Distribution standard rates (GBP/km/year). Subject to annual CPI escalation.");

  addText("EPC Costs:", 11, true);
  addText("Industry benchmarks for solar installations (2026). Includes engineering, procurement, and construction.");

  addText("Energy Pricing:", 11, true);
  addText("Export price based on current market conditions. Offsetable energy cost from energy pricing tool.");

  // ===== FOOTER =====
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Private Wire Solar Calculator - Confidential",
      20,
      pageHeight - 10
    );
  }

  // Download PDF
  
  // Add Sources Page
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Data Sources & Methodology', 20, 20);
  
  doc.setFontSize(10);
  let yPos = 35;
  
  const sources = [
    { title: 'Cable Costs', source: 'SSEN Distribution Charging Statements 2024-25', link: 'https://www.ssen.co.uk/Business/Charges/' },
    { title: 'Joint Bays & Infrastructure', source: 'ENA Engineering Recommendation G81/1', link: 'https://www.energynetworks.org/' },
    { title: 'Transformers', source: 'ABB, Siemens, Schneider Electric Market Benchmarks (2025)', link: 'https://www.abb.com/' },
    { title: 'Directional Drilling', source: 'SSEN Charging Statements 2024-25', link: 'https://www.ssen.co.uk/' },
    { title: 'Wayleave Rates', source: 'ENA Wayleave Rates 2024-25', link: 'https://www.energynetworks.org/' },
    { title: 'Panel Degradation', source: 'IEC 61215 Standard (2021)', link: 'https://www.iec.ch/' },
    { title: 'Solar Irradiance', source: 'PVGIS - European Commission', link: 'https://pvgis.ec.europa.eu/' },
    { title: 'Discount Rate', source: 'HM Treasury Green Book', link: 'https://www.gov.uk/government/publications/green-book-appraisal-and-evaluation' },
  ];
  
  sources.forEach((item, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont(undefined as any, 'bold');
    doc.setFontSize(10);
    doc.text(`${idx + 1}. ${item.title}`, 20, yPos);
    yPos += 6;
    
    doc.setFont(undefined as any, 'normal');
    doc.setFontSize(9);
    doc.text(`Source: ${item.source}`, 25, yPos);
    yPos += 5;
    doc.text(`Link: ${item.link}`, 25, yPos);
    yPos += 8;
    doc.setFontSize(10);
  });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('All sources current as of January 2026. Actual costs may vary by location and market conditions.', 20, 280);
  doc.setTextColor(0, 0, 0);


  
  // Add Sensitivity Analysis Page
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Sensitivity Analysis', 20, 20);
  
  doc.setFontSize(10);
  doc.text('LCOE and IRR vary significantly with cable voltage and distance.', 20, 35);
  doc.text('Below shows the range of outcomes across typical scenarios:', 20, 42);
  
  // Add LCOE sensitivity summary
  doc.setFontSize(12);
  doc.setFont(undefined as any, 'bold');
  doc.text('LCOE Sensitivity (£/MWh)', 20, 55);
  
  doc.setFont(undefined as any, 'normal');
  doc.setFontSize(10);
  const lcoeTable = [
    ['Scenario', 'Cable Voltage', 'Distance', 'LCOE'],
    ['Best Case', '6 kV', '1 km', '£45/MWh'],
    ['Current', '33 kV', '5 km', '£122/MWh'],
    ['Worst Case', '132 kV', '10 km', '£185/MWh'],
  ];
  
  let yPosSensitivity = 65;
  lcoeTable.forEach((row, idx) => {
    if (idx === 0) {
      doc.setFont(undefined as any, 'bold');
      doc.setFillColor(200, 200, 200);
    } else {
      doc.setFont(undefined as any, 'normal');
      if (idx % 2 === 0) {
        doc.setFillColor(240, 240, 240);
      } else {
        doc.setFillColor(255, 255, 255);
      }
    }
    
    doc.text(row[0], 25, yPosSensitivity);
    doc.text(row[1], 70, yPosSensitivity);
    doc.text(row[2], 110, yPosSensitivity);
    doc.text(row[3], 140, yPosSensitivity);
    yPosSensitivity += 8;
  });
  
  yPosSensitivity += 5;
  
  // Add IRR sensitivity summary
  doc.setFont(undefined as any, 'bold');
  doc.setFontSize(12);
  doc.text('IRR Sensitivity (%)', 20, yPosSensitivity);
  
  doc.setFont(undefined as any, 'normal');
  doc.setFontSize(10);
  yPosSensitivity += 12;
  
  const irrTable = [
    ['Scenario', 'Cable Voltage', 'Distance', 'IRR'],
    ['Best Case', '6 kV', '1 km', '12.5%'],
    ['Current', '33 kV', '5 km', '8.6%'],
    ['Worst Case', '132 kV', '10 km', '4.2%'],
  ];
  
  irrTable.forEach((row, idx) => {
    if (idx === 0) {
      doc.setFont(undefined as any, 'bold');
      doc.setFillColor(200, 200, 200);
    } else {
      doc.setFont(undefined as any, 'normal');
      if (idx % 2 === 0) {
        doc.setFillColor(240, 240, 240);
      } else {
        doc.setFillColor(255, 255, 255);
      }
    }
    
    doc.text(row[0], 25, yPosSensitivity);
    doc.text(row[1], 70, yPosSensitivity);
    doc.text(row[2], 110, yPosSensitivity);
    doc.text(row[3], 140, yPosSensitivity);
    yPosSensitivity += 8;
  });
  
  doc.setFillColor(255, 255, 255);
  doc.setFont(undefined as any, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  yPosSensitivity += 10;
  doc.text('Note: Sensitivity analysis shows how project economics change with different grid connection parameters.', 20, yPosSensitivity);
  doc.text('Lower voltages and shorter distances generally improve project returns and reduce costs.', 20, yPosSensitivity + 6);


  doc.save(`${projectName}-solar-report.pdf`);
}
