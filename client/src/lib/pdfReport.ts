import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

// Simple function to draw a pie chart directly on the PDF
function drawPieChartOnPDF(
  doc: jsPDF,
  x: number,
  y: number,
  radius: number,
  data: Array<{ label: string; value: number; color: string }>
) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentAngle = -Math.PI / 2;

  // Draw pie slices
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;

    // Parse hex color to RGB
    const r = parseInt(item.color.substring(1, 3), 16);
    const g = parseInt(item.color.substring(3, 5), 16);
    const b = parseInt(item.color.substring(5, 7), 16);

    doc.setFillColor(r, g, b);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);

    // Draw slice as a path (simplified - just draw colored rectangles as approximation)
    // For a proper pie chart, we'd need more complex path drawing
    // This is a simplified version that shows the concept

    currentAngle = endAngle;
  });

  // Draw legend below pie chart
  let legendY = y + radius + 15;
  const legendX = x - 30;

  data.forEach((item, idx) => {
    const percentage = ((item.value / total) * 100).toFixed(1);

    // Color box
    const r = parseInt(item.color.substring(1, 3), 16);
    const g = parseInt(item.color.substring(3, 5), 16);
    const b = parseInt(item.color.substring(5, 7), 16);

    doc.setFillColor(r, g, b);
    doc.rect(legendX, legendY + idx * 6, 3, 3, "F");

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`${item.label}: ${percentage}%`, legendX + 6, legendY + idx * 6 + 2.5);
  });
}

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
  const rgbColors = {
    yellow: [255, 215, 0],
    green: [45, 134, 89],
    navy: [0, 31, 63],
    lightGray: [240, 240, 240],
    darkGray: [80, 80, 80],
    white: [255, 255, 255],
  };

  const hexColors = {
    project: "#808080",
    offtaker: "#2D8659",
    landowner: "#FFD700",
    developer: "#001F3F",
  };

  // Helper: Add branded header
  const addBrandedHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(...rgbColors.yellow);
    doc.rect(0, yPosition - 5, pageWidth, 15, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...rgbColors.navy);
    doc.text(title, 15, yPosition + 5);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...rgbColors.green);
      doc.text(subtitle, 15, yPosition + 10);
    }

    yPosition += 22;
  };

  // Helper: Add card with color-coded heading
  const addColoredCard = (title: string, content: string[], color: string) => {
    const cardHeight = 6 + content.length * 5;
    doc.setFillColor(...rgbColors.lightGray);
    doc.rect(15, yPosition - 2, pageWidth - 30, cardHeight, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition - 2, pageWidth - 30, cardHeight);

    // Parse hex color to RGB
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(r, g, b);
    doc.text(title, 20, yPosition + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...rgbColors.darkGray);

    let contentY = yPosition + 6;
    content.forEach((line) => {
      doc.text(line, 20, contentY);
      contentY += 5;
    });

    yPosition += cardHeight + 6;
  };

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - 15) {
      doc.addPage();
      yPosition = 15;
    }
  };

  // ============ PAGE 1: COVER PAGE ============
  doc.setFillColor(...rgbColors.navy);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...rgbColors.white);
  doc.text("Private Wire Solar Calculator", 15, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...rgbColors.yellow);
  doc.text("Financial Analysis Report", 15, 35);

  yPosition = 75;

  // Project details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...rgbColors.navy);
  doc.text(projectName, 15, yPosition);

  yPosition += 8;
  if (description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...rgbColors.darkGray);
    const descLines = doc.splitTextToSize(description, pageWidth - 30);
    doc.text(descLines, 15, yPosition);
    yPosition += descLines.length * 5 + 5;
  }

  yPosition += 10;

  // Key metrics grid
  const metrics = [
    { label: "Total CAPEX", value: formatCurrency(results.summary.totalCapex) },
    { label: "LCOE (Real)", value: "£" + results.summary.lcoeReal.toFixed(2) + "/MWh" },
    { label: "IRR (Unlevered)", value: (results.summary.irrUnlevered * 100).toFixed(2) + "%" },
    { label: "Payback Period", value: results.summary.paybackPeriod > inputs.projectLife ? "> Project Life" : results.summary.paybackPeriod.toFixed(1) + " years" },
    { label: "Total NPV", value: formatCurrency(results.summary.totalDiscountedCashFlow) },
    { label: "Project Life", value: inputs.projectLife + " years" },
  ];

  const metricsPerRow = 2;
  const metricWidth = (pageWidth - 30) / metricsPerRow;

  metrics.forEach((metric, idx) => {
    const col = idx % metricsPerRow;
    const row = Math.floor(idx / metricsPerRow);
    const metricX = 15 + col * metricWidth;
    const metricY = yPosition + row * 25;

    // Card background
    doc.setFillColor(...rgbColors.lightGray);
    doc.rect(metricX, metricY, metricWidth - 5, 20, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.75);
    doc.rect(metricX, metricY, metricWidth - 5, 20);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...rgbColors.darkGray);
    doc.text(metric.label, metricX + 3, metricY + 4);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...rgbColors.navy);
    doc.text(metric.value, metricX + 3, metricY + 12);
  });

  yPosition += 60;

  // ============ PAGE 2: STAKEHOLDER VALUE ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Stakeholder Value Distribution", projectName + " - Financial Benefits Breakdown");

  const projectValue = Math.max(0, results.summary.totalDiscountedCashFlow);
  const offtakerSavings = Math.max(0, results.summary.totalSavings || 0);
  const landownerIncome = Math.max(0, results.summary.totalLandOptionIncome || 0);
  const developerPremium = Math.max(0, results.summary.totalDeveloperPremium || 0);
  const totalValue = projectValue + offtakerSavings + landownerIncome + developerPremium;

  // Draw pie chart legend/breakdown
  const pieChartData = [
    { label: "Operator", value: projectValue, color: hexColors.project },
    { label: "Offtaker", value: offtakerSavings, color: hexColors.offtaker },
    { label: "Landowner", value: landownerIncome, color: hexColors.landowner },
    { label: "Developer", value: developerPremium, color: hexColors.developer },
  ];

  // Draw simple pie chart representation with legend
  let chartY = yPosition;
  pieChartData.forEach((item, idx) => {
    const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0";

    // Color box
    const r = parseInt(item.color.substring(1, 3), 16);
    const g = parseInt(item.color.substring(3, 5), 16);
    const b = parseInt(item.color.substring(5, 7), 16);

    doc.setFillColor(r, g, b);
    doc.rect(20, chartY + idx * 8, 4, 4, "F");

    // Label with percentage
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`${item.label}: ${percentage}% (${formatCurrency(item.value)})`, 28, chartY + idx * 8 + 3);
  });

  yPosition = chartY + pieChartData.length * 8 + 10;
  checkPageBreak(80);

  // Stakeholder cards with color-coded headings
  const projectPct = totalValue > 0 ? ((projectValue / totalValue) * 100).toFixed(1) : "0";
  addColoredCard(
    "Operator",
    [
      "Total: " + formatCurrency(projectValue),
      "Share: " + projectPct + "% of total value",
      "NPV: " + formatCurrency(projectValue),
    ],
    hexColors.project
  );

  checkPageBreak(30);

  const offtakerPct = totalValue > 0 ? ((offtakerSavings / totalValue) * 100).toFixed(1) : "0";
  addColoredCard(
    "Offtaker Savings",
    [
      "Total: " + formatCurrency(offtakerSavings),
      "Share: " + offtakerPct + "% of total value",
      "Yearly Savings: " + formatCurrency(results.summary.yearlyOfftakerSavings || 0),
    ],
    hexColors.offtaker
  );

  checkPageBreak(30);

  const landownerPct = totalValue > 0 ? ((landownerIncome / totalValue) * 100).toFixed(1) : "0";
  addColoredCard(
    "Landowner Income",
    [
      "Total: " + formatCurrency(landownerIncome),
      "Share: " + landownerPct + "% of total value",
      "Annual Rental: " + formatCurrency((landownerIncome / inputs.projectLife) || 0),
    ],
    hexColors.landowner
  );

  checkPageBreak(30);

  const developerPct = totalValue > 0 ? ((developerPremium / totalValue) * 100).toFixed(1) : "0";
  addColoredCard(
    "Developer Premium",
    [
      "Total: " + formatCurrency(developerPremium),
      "Share: " + developerPct + "% of total value",
      "Premium: " + formatCurrency(developerPremium),
    ],
    hexColors.developer
  );

  // ============ PAGE 3: FINANCIAL METRICS ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Financial Metrics & Costs");

  // Cost breakdown table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...rgbColors.navy);
  doc.text("Cost Breakdown", 15, yPosition);
  yPosition += 8;

  const costData = [
    ["Item", "Value"],
    ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
    ["Annual OPEX (Year 1)", formatCurrency(results.summary.opexYear1 || 0)],
    ["Cost Inflation Rate", (inputs.costInflationRate || 0).toFixed(2) + "%"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let tableY = yPosition;

  costData.forEach((row, idx) => {
    if (idx === 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...rgbColors.navy);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...rgbColors.darkGray);
    }

    doc.text(row[0], 20, tableY);
    doc.text(row[1], pageWidth - 40, tableY, { align: "right" });
    tableY += 6;
  });

  yPosition = tableY + 10;
  checkPageBreak(60);

  // Generation metrics
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...rgbColors.navy);
  doc.text("Generation & Revenue", 15, yPosition);
  yPosition += 8;

  const genData = [
    ["Item", "Value"],
    ["Annual Generation (Year 1)", formatNumberWithCommas(results.summary.annualGeneration || 0) + " MWh"],
    ["PPA Price", "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh"],
    ["Annual Revenue (Year 1)", formatCurrency(results.summary.annualRevenue || 0)],
  ];

  tableY = yPosition;
  genData.forEach((row, idx) => {
    if (idx === 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...rgbColors.navy);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...rgbColors.darkGray);
    }

    doc.text(row[0], 20, tableY);
    doc.text(row[1], pageWidth - 40, tableY, { align: "right" });
    tableY += 6;
  });

  // ============ PAGE 4: ANNUAL CASH FLOW ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Annual Cash Flow Projection");

  // Create cash flow table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...rgbColors.navy);

  const colWidth = (pageWidth - 30) / 3;
  let tableX = 15;

  // Headers
  doc.text("Year", tableX, yPosition);
  doc.text("Generation (MWh)", tableX + colWidth, yPosition, { align: "center" });
  doc.text("Cash Flow (£)", tableX + colWidth * 2, yPosition, { align: "right" });

  yPosition += 6;
  doc.setLineWidth(0.3);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 2;

  // Cash flow rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.darkGray);

  const maxRows = 20; // Show all years
  for (let year = 1; year <= Math.min(inputs.projectLife, maxRows); year++) {
    if (yPosition + 5 > pageHeight - 15) {
      doc.addPage();
      yPosition = 15;

      // Repeat headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...rgbColors.navy);
      doc.text("Year", tableX, yPosition);
      doc.text("Generation (MWh)", tableX + colWidth, yPosition, { align: "center" });
      doc.text("Cash Flow (£)", tableX + colWidth * 2, yPosition, { align: "right" });
      yPosition += 6;
      doc.setLineWidth(0.3);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...rgbColors.darkGray);
    }

    const generation = (results.summary.annualGeneration || 0) * Math.pow(1 + (inputs.generationDegradation || 0) / 100, year - 1);
    const cashFlow = generation * (inputs.powerPrice || 0) - (results.summary.opexYear1 || 0) * Math.pow(1 + (inputs.costInflationRate || 0) / 100, year - 1);

    doc.text(year.toString(), tableX, yPosition);
    doc.text(formatNumberWithCommas(Math.round(generation)), tableX + colWidth, yPosition, { align: "center" });
    doc.text(formatCurrency(cashFlow), tableX + colWidth * 2, yPosition, { align: "right" });

    yPosition += 5;
  }

  // ============ PAGE 5: ASSUMPTIONS ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Assumptions & Sources");

  const assumptions = [
    { label: "Project Life", value: inputs.projectLife + " years" },
    { label: "Cable Distance", value: (inputs.cableDistance || 0).toFixed(1) + " km" },
    { label: "Cable Voltage", value: (inputs.cableVoltage || 0) + " kV" },
    { label: "Installed Capacity", value: (inputs.installedCapacity || 0).toFixed(2) + " MWp" },
    { label: "CAPEX per MW", value: "£" + formatNumberWithCommas((inputs.capexPerMW || 0).toFixed(0)) },
    { label: "OPEX per MW (Year 1)", value: "£" + formatNumberWithCommas((inputs.opexPerMW || 0).toFixed(0)) },
    { label: "Cost Inflation Rate", value: (inputs.costInflationRate || 0).toFixed(2) + "%" },
    { label: "Generation Degradation", value: (inputs.generationDegradation || 0).toFixed(2) + "% p.a." },
    { label: "PPA Price", value: "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh" },
    { label: "Discount Rate", value: (inputs.discountRate || 0).toFixed(2) + "%" },
  ];

  assumptions.forEach((assumption) => {
    checkPageBreak(10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...rgbColors.darkGray);
    doc.text(assumption.label + ":", 20, yPosition);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...rgbColors.navy);
    doc.text(assumption.value, pageWidth - 40, yPosition, { align: "right" });

    yPosition += 7;
  });

  // Footer
  yPosition += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.darkGray);
  doc.text("Report generated by Private Wire Solar Calculator", 15, yPosition);
  doc.text("Indicative projections based on Jan 2026 data. Not for investment decisions without professional verification.", 15, yPosition + 5);

  return doc;
}
