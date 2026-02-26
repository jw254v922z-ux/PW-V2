import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

export async function generatePDFReport(params: {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
  mapScreenshot?: string;
}): Promise<jsPDF> {
  const { inputs, results, projectName, description } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Savills Earth Brand Colors
  const colors = {
    yellow: { r: 255, g: 215, b: 0 },
    green: { r: 45, g: 134, b: 89 },
    navy: { r: 0, g: 31, b: 63 },
    gray: { r: 240, g: 240, b: 240 },
    darkGray: { r: 80, g: 80, b: 80 },
    white: { r: 255, g: 255, b: 255 },
  };

  const hexColors = {
    project: "#808080",
    offtaker: "#2D8659",
    landowner: "#FFD700",
    developer: "#001F3F",
  };

  // Helper: Add page break
  const addPageBreak = () => {
    doc.addPage();
    yPosition = 15;
  };

  // Helper: Add branded header
  const addBrandedHeader = (title: string) => {
    doc.setFillColor(colors.yellow.r, colors.yellow.g, colors.yellow.b);
    doc.rect(0, yPosition - 5, pageWidth, 12, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 15, yPosition + 4);
    yPosition += 18;
  };

  // Helper: Draw pie chart with improved labels
  const drawPieChart = (
    x: number,
    y: number,
    radius: number,
    data: Array<{ value: number; color: string; label: string; percentage: number }>
  ) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2; // Start from top

    // First pass: draw pie slices
    data.forEach((item) => {
      if (item.value === 0) return;

      const sliceAngle = (item.value / totalValue) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;

      // Convert hex color to RGB
      const hexColor = item.color;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      doc.setFillColor(r, g, b);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);

      // Draw pie slice
      const startX = x + radius * Math.cos(currentAngle);
      const startY = y + radius * Math.sin(currentAngle);

      doc.moveTo(x, y);
      doc.lineTo(startX, startY);

      // Draw arc using multiple line segments
      const steps = Math.ceil((sliceAngle * 180) / Math.PI / 5); // 5 degree segments
      for (let i = 1; i <= steps; i++) {
        const angle = currentAngle + (sliceAngle * i) / steps;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        doc.lineTo(px, py);
      }

      doc.lineTo(x, y);
      doc.fill("FD");

      currentAngle = endAngle;
    });

    // Second pass: draw labels with better visibility
    currentAngle = -Math.PI / 2;
    data.forEach((item) => {
      if (item.value === 0) return;

      const sliceAngle = (item.value / totalValue) * 2 * Math.PI;
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = x + labelRadius * Math.cos(labelAngle);
      const labelY = y + labelRadius * Math.sin(labelAngle);

      // Draw white background box for label
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      
      const labelText = `${item.label} (${item.percentage.toFixed(1)}%)`;
      const textWidth = doc.getTextWidth(labelText);
      const boxWidth = textWidth + 2;
      const boxHeight = 5;

      doc.rect(labelX - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight, "FD");

      // Draw label text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(labelText, labelX, labelY + 1.5, { align: "center" });

      currentAngle += sliceAngle;
    });
  };

  // PAGE 1: COVER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 31, 63);
  doc.text("Solar Project Analysis", 15, yPosition);
  yPosition += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(projectName, 15, yPosition);
  yPosition += 8;

  if (description) {
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(description, pageWidth - 30);
    doc.text(descLines, 15, yPosition);
    yPosition += descLines.length * 5 + 5;
  }

  // Add full disclaimer
  yPosition += 3;
  doc.setFillColor(255, 243, 205);
  doc.rect(15, yPosition, pageWidth - 30, 50, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(184, 134, 11);
  doc.text("Tool Limitations & Disclaimer", 18, yPosition + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  
  const disclaimerText = doc.splitTextToSize(
    "This calculator provides indicative financial projections based on industry assumptions and publicly available data sources. All data and assumptions are valid as of January 2026. Results are for indicative purposes only and should not be relied upon for investment decisions. Grid costs, irradiance data, and technology assumptions may vary significantly by location. Costs and pricing may change over time. Site-specific conditions (soil, access, environmental) are not accounted for. This tool does not include all potential costs (e.g., planning, environmental surveys, financing). Results should not be relied upon for investment decisions without independent professional verification from qualified engineers, surveyors, and financial advisors.",
    pageWidth - 36
  );
  doc.text(disclaimerText, 18, yPosition + 10);
  yPosition += 56;

  // Key metrics grid
  yPosition += 3;
  const metrics = [
    { label: "Total CAPEX", value: formatCurrency(results.summary.totalCapex) },
    { label: "LCOE (Real)", value: "£" + (results.summary.lcoe || 0).toFixed(2) + "/MWh" },
    { label: "IRR (Unlevered)", value: ((results.summary.irr || 0) * 100).toFixed(2) + "%" },
    { label: "Payback Period", value: (results.summary.paybackPeriod || 0) > inputs.projectLife ? "> Project Life" : (results.summary.paybackPeriod || 0).toFixed(1) + " years" },
    { label: "Total NPV", value: formatCurrency(results.summary.totalDiscountedCashFlow) },
    { label: "Project Life", value: inputs.projectLife + " years" },
  ];

  const metricsPerRow = 2;
  const metricWidth = (pageWidth - 30) / metricsPerRow;

  metrics.forEach((metric, idx) => {
    const row = Math.floor(idx / metricsPerRow);
    const col = idx % metricsPerRow;
    const x = 15 + col * metricWidth;
    const y = yPosition + row * 20;

    // Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(x, y, metricWidth - 5, 18);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(metric.label, x + 3, y + 5);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(metric.value, x + 3, y + 14);
  });

  yPosition += 8;

  // Add map section on same page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 31, 63);
  doc.text("Site Location Map", 15, yPosition);
  yPosition += 8;
  
  // Add map image if available, otherwise show placeholder
  if (params.mapScreenshot) {
    try {
      const mapHeight = 50; // Smaller map to fit on page 1
      doc.addImage(params.mapScreenshot, "PNG", 15, yPosition, pageWidth - 30, mapHeight);
      yPosition += mapHeight + 5;
    } catch (e) {
      console.error("Failed to add map image:", e);
      // Fall back to placeholder
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, yPosition, pageWidth - 30, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Map screenshot unavailable", pageWidth / 2, yPosition + 25, { align: "center" });
      yPosition += 55;
    }
  } else {
    // Show placeholder when no map screenshot
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, yPosition, pageWidth - 30, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Map will appear here when polygon is drawn", pageWidth / 2, yPosition + 25, { align: "center" });
    yPosition += 55;
  }

  // Add page break before stakeholder section
  addPageBreak();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 31, 63);
  doc.text("Site Information", 15, yPosition);
  yPosition += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`System Size: ${inputs.capacity} MW`, 15, yPosition);
  yPosition += 6;
  doc.text(`Project Life: ${inputs.projectLife} years`, 15, yPosition);
  yPosition += 6;
  doc.text(`Annual Generation: ${(results.yearlyData[0]?.generation || 0).toFixed(0)} MWh`, 15, yPosition);
  yPosition += 15;

  // PAGE 2: STAKEHOLDER VALUE
  addPageBreak();
  addBrandedHeader("Stakeholder Value Distribution");

  // Calculate stakeholder values from summary
  const operatorNPV = Math.max(0, results.summary.totalDiscountedCashFlow);
  const offtakerSavings = Math.max(0, results.summary.totalSavings);
  const landownerIncome = Math.max(0, results.summary.totalLandOptionIncome);
  const developerPremium = Math.max(0, results.summary.totalDeveloperPremium);

  const totalValue = operatorNPV + offtakerSavings + landownerIncome + developerPremium;

  const stakeholderData = [
    { 
      label: "Operator", 
      value: operatorNPV, 
      color: hexColors.project,
      percentage: totalValue > 0 ? (operatorNPV / totalValue) * 100 : 0
    },
    { 
      label: "Offtaker", 
      value: offtakerSavings, 
      color: hexColors.offtaker,
      percentage: totalValue > 0 ? (offtakerSavings / totalValue) * 100 : 0
    },
    { 
      label: "Landowner", 
      value: landownerIncome, 
      color: hexColors.landowner,
      percentage: totalValue > 0 ? (landownerIncome / totalValue) * 100 : 0
    },
    { 
      label: "Developer", 
      value: developerPremium, 
      color: hexColors.developer,
      percentage: totalValue > 0 ? (developerPremium / totalValue) * 100 : 0
    },
  ];

  // Draw pie chart
  const chartCenterX = pageWidth / 2;
  const chartCenterY = yPosition + 28;
  const chartRadius = 24;

  drawPieChart(chartCenterX, chartCenterY, chartRadius, stakeholderData);

  yPosition += 65;

  // Stakeholder metric cards
  const boxHeight = 24;
  const boxWidth = (pageWidth - 30) / 2;

  // Operator
  doc.setFillColor(200, 200, 200);
  doc.rect(15, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Operator", 18, yPosition + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Value: ${formatCurrency(operatorNPV)}`, 18, yPosition + 12);
  doc.text(`Percentage: ${((operatorNPV / totalValue) * 100).toFixed(1)}%`, 18, yPosition + 19);

  // Offtaker
  doc.setFillColor(45, 134, 89);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Offtaker", 18 + boxWidth, yPosition + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Total Savings: ${formatCurrency(offtakerSavings)}`, 18 + boxWidth, yPosition + 12);
  doc.text(`Percentage: ${((offtakerSavings / totalValue) * 100).toFixed(1)}%`, 18 + boxWidth, yPosition + 19);

  yPosition += boxHeight + 3;

  // Landowner
  doc.setFillColor(255, 215, 0);
  doc.rect(15, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Landowner", 18, yPosition + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Total Income: ${formatCurrency(landownerIncome)}`, 18, yPosition + 12);
  doc.text(`Percentage: ${((landownerIncome / totalValue) * 100).toFixed(1)}%`, 18, yPosition + 19);

  // Developer
  doc.setFillColor(0, 31, 63);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Developer", 18 + boxWidth, yPosition + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Premium: ${formatCurrency(developerPremium)}`, 18 + boxWidth, yPosition + 12);
  doc.text(`Percentage: ${((developerPremium / totalValue) * 100).toFixed(1)}%`, 18 + boxWidth, yPosition + 19);

  yPosition += boxHeight + 8;

  // PAGE 3: FINANCIAL METRICS
  addPageBreak();
  addBrandedHeader("Financial Metrics");

  // Generation & Revenue table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 31, 63);
  doc.text("Annual Generation & Revenue (Year 1)", 15, yPosition);
  yPosition += 6;

  // Get Year 1 data from yearly data
  const year1Data = results.yearlyData.find(y => y.year === 1);
  const genRevData = [
    ["Annual Generation (Year 1)", (year1Data?.generation || 0).toFixed(0) + " MWh"],
    ["Annual Revenue (Year 1)", formatCurrency(year1Data?.revenue || 0)],
    ["Annual OPEX (Year 1)", formatCurrency(year1Data?.opex || 0)],
  ];

  genRevData.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 6, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 18, yPosition + 4);
    doc.text(row[1], pageWidth - 25, yPosition + 4, { align: "right" });

    yPosition += 6;
  });

  yPosition += 6;

  // Cost Breakdown table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 31, 63);
  doc.text("Cost Breakdown", 15, yPosition);
  yPosition += 6;

  // Calculate individual costs from inputs
  const epcCost = inputs.capexPerMW * inputs.mw;
  const devPremiumAmount = inputs.developmentPremiumEnabled 
    ? inputs.developmentPremiumPerMW * inputs.mw * (1 - inputs.developmentPremiumDiscount / 100)
    : 0;
  const gridCost = inputs.gridCostOverrideEnabled ? inputs.gridCostOverride : inputs.gridConnectionCost;
  
  const costData = [
    ["EPC Cost", formatCurrency(epcCost)],
    ["Private Wire Cost", formatCurrency(inputs.privateWireCost)],
    ["Grid Connection Cost", formatCurrency(gridCost)],
    ["Developer Premium", formatCurrency(devPremiumAmount)],
    ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
  ];

  costData.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 6, "F");

    doc.setFont("helvetica", idx === costData.length - 1 ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 18, yPosition + 4);
    doc.text(row[1], pageWidth - 25, yPosition + 4, { align: "right" });

    yPosition += 6;
  });

  // PAGE 4: CASH FLOW ANALYSIS
  addPageBreak();
  addBrandedHeader("Annual Cash Flow Analysis");

  // Cash flow table header
  doc.setFillColor(colors.navy.r, colors.navy.g, colors.navy.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  const colWidth = (pageWidth - 30) / 7;
  const headerY = yPosition;
  const headerHeight = 8;
  
  // Draw full header background
  doc.rect(15, headerY, pageWidth - 30, headerHeight, "F");
  
  // Draw header text for each column
  doc.text("Year", 15 + 2, headerY + 6);
  doc.text("Generation", 15 + colWidth + 2, headerY + 6);
  doc.text("Revenue", 15 + colWidth * 2 + 2, headerY + 6);
  doc.text("OPEX", 15 + colWidth * 3 + 2, headerY + 6);
  doc.text("Net CF", 15 + colWidth * 4 + 2, headerY + 6);
  doc.text("Disc CF", 15 + colWidth * 5 + 2, headerY + 6);
  doc.text("Cum CF", 15 + colWidth * 6 + 2, headerY + 6);

  yPosition += headerHeight;

  // Cash flow rows - all years
  results.yearlyData.forEach((yearData, idx) => {
    if (idx === 0) return; // Skip year 0 (CAPEX only)

    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(0, 0, 0);
    
    doc.text(yearData.year.toString(), 15 + 2, yPosition + 3.5);
    doc.text(formatNumberWithCommas(yearData.generation.toFixed(0)), 15 + colWidth + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.revenue.toFixed(0)), 15 + colWidth * 2 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.opex.toFixed(0)), 15 + colWidth * 3 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.cashFlow.toFixed(0)), 15 + colWidth * 4 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.discountedCashFlow.toFixed(0)), 15 + colWidth * 5 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.cumulativeCashFlow.toFixed(0)), 15 + colWidth * 6 + 2, yPosition + 3.5);

    yPosition += 5;

    if (yPosition > pageHeight - 20 && idx < results.yearlyData.length - 1) {
      addPageBreak();
    }
  });

  // Stakeholder cash flow summary
  if (yPosition > pageHeight - 50) {
    addPageBreak();
  }

  yPosition += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 31, 63);
  doc.text("Cash Flow Summary by Stakeholder", 15, yPosition);
  yPosition += 8;

  const stakeholders = [
    { name: "Operator", npv: results.summary.totalDiscountedCashFlow || 0, irr: results.summary.irr || 0, color: hexColors.project },
    { name: "Offtaker", npv: results.summary.totalSavings || 0, irr: 0, color: hexColors.offtaker },
    { name: "Landowner", npv: results.summary.totalLandOptionIncome || 0, irr: 0, color: hexColors.landowner },
    { name: "Developer", npv: results.summary.totalDeveloperPremium || 0, irr: 0, color: hexColors.developer },
  ];

  stakeholders.forEach((stakeholder) => {
    const hexColor = stakeholder.color;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    doc.setFillColor(r, g, b);
    doc.rect(15, yPosition, pageWidth - 30, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(stakeholder.name, 18, yPosition + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("NPV: " + formatCurrency(stakeholder.npv), pageWidth - 25, yPosition + 3, { align: "right" });
    doc.text("IRR: " + ((stakeholder.irr || 0) * 100).toFixed(2) + "%", pageWidth - 25, yPosition + 6, { align: "right" });
    yPosition += 9;
  });

  // PAGE 5: ASSUMPTIONS & SOURCES
  addPageBreak();
  addBrandedHeader("Assumptions & Data Sources");

  // Assumptions section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 31, 63);
  doc.text("Project Assumptions", 15, yPosition);
  yPosition += 6;

  const assumptions = [
    ["Project Life", inputs.projectLife + " years"],
    ["Installed Capacity", (inputs.mw || 0).toFixed(2) + " MWp"],
    ["CAPEX per MW", "£" + formatNumberWithCommas((inputs.capexPerMW || 0).toFixed(0))],
    ["OPEX per MW (Year 1)", "£" + formatNumberWithCommas((inputs.opexPerMW || 0).toFixed(0))],
    ["Cost Inflation Rate", (inputs.costInflationRate || 0).toFixed(2) + "%"],
    ["Generation Degradation", (inputs.degradationRate || 0).toFixed(4) + "% p.a."],
    ["PPA Price", "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh"],
    ["Discount Rate", (inputs.discountRate || 0).toFixed(2) + "%"],
  ];

  assumptions.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 6, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 18, yPosition + 4);
    doc.text(row[1], pageWidth - 25, yPosition + 4, { align: "right" });

    yPosition += 6;
  });

  yPosition += 6;

  // Data Sources section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 31, 63);
  doc.text("Data Sources & Methodology", 15, yPosition);
  yPosition += 6;

  const sourcesList = [
    "Grid connection costs: SSEN Distribution Cost Estimates (2025)",
    "Solar irradiance: UK Met Office historical averages",
    "EPC costs: Industry benchmarks (2026)",
    "Transformer costs: Manufacturer quotes",
    "Cable costs: Supplier pricing data",
    "Financial calculations: NPV at specified discount rate, IRR via iterative method",
    "All costs are updated in real-time as parameters are adjusted",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);

  sourcesList.forEach((source) => {
    const lines = doc.splitTextToSize("• " + source, pageWidth - 35);
    lines.forEach((line) => {
      if (yPosition > pageHeight - 15) {
        addPageBreak();
      }
      doc.text(line, 18, yPosition);
      yPosition += 4;
    });
  });

  // Add page numbers and footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
    
    // Add "Produced by Savills Earth" on left
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Produced by Savills Earth", 15, pageHeight - 7);
    
    // Add page number on right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 7, { align: "right" });
  }

  return doc;
}
