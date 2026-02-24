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

  // Helper: Add callout box
  const addCalloutBox = (label: string, value: string, x: number, y: number, width: number, color: { r: number; g: number; b: number }) => {
    // Background
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(x, y, width, 20, "F");

    // Border
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, 20);

    // Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(label, x + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 3, y + 15);
  };

  // PAGE 1: COVER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 31, 63);
  doc.text("Private Wire Solar Calculator", 15, yPosition);
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

  // Add disclaimer
  doc.setFillColor(255, 243, 205);
  doc.rect(15, yPosition, pageWidth - 30, 20, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(184, 134, 11);
  doc.text("Disclaimer:", 18, yPosition + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimerText = doc.splitTextToSize(
    "Indicative projections based on Jan 2026 data. Not for investment decisions without professional verification.",
    pageWidth - 36
  );
  doc.text(disclaimerText, 18, yPosition + 10);
  yPosition += 28;

  // Key metrics grid
  yPosition += 5;
  const metrics = [
    { label: "Total CAPEX", value: formatCurrency(results.summary.totalCapex) },
    { label: "LCOE (Real)", value: "£" + (results.summary.lcoeReal || 0).toFixed(2) + "/MWh" },
    { label: "IRR (Unlevered)", value: ((results.summary.irrUnlevered || 0) * 100).toFixed(2) + "%" },
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
    const y = yPosition + row * 25;

    // Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(x, y, metricWidth - 5, 20);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(metric.label, x + 3, y + 6);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(metric.value, x + 3, y + 15);
  });

  yPosition += 55;

  // PAGE 2: STAKEHOLDER VALUE
  addPageBreak();
  addBrandedHeader("Stakeholder Value Distribution");

  // Pie chart representation (visual bars)
  const totalValue = results.stakeholders.operatorNPV + results.stakeholders.offtakerSavings + results.stakeholders.landownerIncome + results.stakeholders.developerPremium;

  const stakeholderData = [
    { label: "Operator", value: results.stakeholders.operatorNPV, color: hexColors.project },
    { label: "Offtaker", value: results.stakeholders.offtakerSavings, color: hexColors.offtaker },
    { label: "Landowner", value: results.stakeholders.landownerIncome, color: hexColors.landowner },
    { label: "Developer", value: results.stakeholders.developerPremium, color: hexColors.developer },
  ];

  // Draw pie chart representation
  let pieY = yPosition;
  stakeholderData.forEach((item, idx) => {
    const percentage = totalValue > 0 ? ((item.value / totalValue) * 100) : 0;
    const barWidth = (percentage / 100) * (pageWidth - 30);

    // Color bar
    const rgb = item.color === hexColors.project ? colors.darkGray : 
                item.color === hexColors.offtaker ? colors.green :
                item.color === hexColors.landowner ? colors.yellow :
                colors.navy;

    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(15, pieY, barWidth, 8, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${item.label}: ${percentage.toFixed(1)}%`, 15 + barWidth + 3, pieY + 6);

    pieY += 12;
  });

  yPosition = pieY + 10;

  // Stakeholder callout boxes
  const boxHeight = 25;
  const boxWidth = (pageWidth - 30) / 2;

  // Operator
  doc.setFillColor(200, 200, 200);
  doc.rect(15, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Operator", 18, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`NPV: ${formatCurrency(results.stakeholders.operatorNPV)}`, 18, yPosition + 14);
  doc.text(`IRR: ${((results.stakeholders.operatorIRR || 0) * 100).toFixed(2)}%`, 18, yPosition + 20);

  // Offtaker
  doc.setFillColor(45, 134, 89);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Offtaker", 18 + boxWidth, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Savings: ${formatCurrency(results.stakeholders.offtakerSavings)}`, 18 + boxWidth, yPosition + 14);
  doc.text(`Yearly: ${formatCurrency(results.stakeholders.offtakerYearlySavings)}`, 18 + boxWidth, yPosition + 20);

  yPosition += boxHeight + 5;

  // Landowner
  doc.setFillColor(255, 215, 0);
  doc.rect(15, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Landowner", 18, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Income: ${formatCurrency(results.stakeholders.landownerIncome)}`, 18, yPosition + 14);
  doc.text(`Yearly: ${formatCurrency(results.stakeholders.landownerYearlyIncome)}`, 18, yPosition + 20);

  // Developer
  doc.setFillColor(0, 31, 63);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Developer", 18 + boxWidth, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Premium: ${formatCurrency(results.stakeholders.developerPremium)}`, 18 + boxWidth, yPosition + 14);
  doc.text(`Payback: ${(results.stakeholders.developerPayback || 0).toFixed(1)} years`, 18 + boxWidth, yPosition + 20);

  yPosition += boxHeight + 10;

  // PAGE 3: FINANCIAL METRICS
  addPageBreak();
  addBrandedHeader("Financial Metrics");

  // Cost Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 31, 63);
  doc.text("Cost Breakdown", 15, yPosition);
  yPosition += 8;

  const costData = [
    ["Cable Cost", formatCurrency(results.gridConnection.cableCost)],
    ["Step-Up Transformer", formatCurrency(results.gridConnection.stepUpTransformerCost)],
    ["Step-Down Transformer", formatCurrency(results.gridConnection.stepDownTransformerCost)],
    ["Grid Connection Cost", formatCurrency(results.gridConnection.totalGridConnectionCost)],
    ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
  ];

  costData.forEach((row, idx) => {
    const isTotal = idx === costData.length - 1;
    const bgColor = isTotal ? colors.yellow : colors.gray;
    
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 7, "F");

    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 18, yPosition + 5);
    doc.text(row[1], pageWidth - 25, yPosition + 5, { align: "right" });

    yPosition += 7;
  });

  yPosition += 5;

  // Generation & Revenue Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 31, 63);
  doc.text("Generation & Revenue (Year 1)", 15, yPosition);
  yPosition += 8;

  const genData = [
    ["Annual Generation", formatNumberWithCommas(results.generation.annualGeneration.toFixed(0)) + " MWh"],
    ["PPA Price", "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh"],
    ["Annual Revenue", formatCurrency(results.generation.annualRevenue)],
    ["OPEX (Year 1)", formatCurrency(results.costs.opexYear1)],
    ["Net Cash Flow", formatCurrency(results.generation.annualRevenue - results.costs.opexYear1)],
  ];

  genData.forEach((row, idx) => {
    const isTotal = idx === genData.length - 1;
    const bgColor = isTotal ? colors.green : colors.gray;
    
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 7, "F");

    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(isTotal ? 255 : 0, isTotal ? 255 : 0, isTotal ? 255 : 0);
    doc.text(row[0], 18, yPosition + 5);
    doc.text(row[1], pageWidth - 25, yPosition + 5, { align: "right" });

    yPosition += 7;
  });

  yPosition += 10;

  // PAGE 4: ANNUAL CASH FLOW
  addPageBreak();
  addBrandedHeader("Annual Cash Flow Projection");

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setFillColor(0, 31, 63);
  doc.setTextColor(255, 255, 255);
  
  const colWidth = (pageWidth - 30) / 5;
  doc.rect(15, yPosition, colWidth, 6, "F");
  doc.text("Year", 15 + 2, yPosition + 4);
  
  doc.rect(15 + colWidth, yPosition, colWidth, 6, "F");
  doc.text("Revenue", 15 + colWidth + 2, yPosition + 4);
  
  doc.rect(15 + colWidth * 2, yPosition, colWidth, 6, "F");
  doc.text("OPEX", 15 + colWidth * 2 + 2, yPosition + 4);
  
  doc.rect(15 + colWidth * 3, yPosition, colWidth, 6, "F");
  doc.text("Net CF", 15 + colWidth * 3 + 2, yPosition + 4);
  
  doc.rect(15 + colWidth * 4, yPosition, colWidth, 6, "F");
  doc.text("Cumulative", 15 + colWidth * 4 + 2, yPosition + 4);

  yPosition += 6;

  // Cash flow rows
  let cumulativeCF = -results.summary.totalCapex;
  
  for (let year = 0; year < inputs.projectLife; year++) {
    const revenue = results.generation.annualRevenue * Math.pow(1 - (inputs.generationDegradation || 0) / 100, year);
    const opex = results.costs.opexYear1 * Math.pow(1 + (inputs.costInflationRate || 0) / 100, year);
    const netCF = revenue - opex;
    cumulativeCF += netCF;

    const bgColor = year % 2 === 0 ? colors.white : colors.gray;
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    doc.text((year + 1).toString(), 15 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(revenue.toFixed(0)), 15 + colWidth + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(opex.toFixed(0)), 15 + colWidth * 2 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(netCF.toFixed(0)), 15 + colWidth * 3 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(cumulativeCF.toFixed(0)), 15 + colWidth * 4 + 2, yPosition + 3.5);

    yPosition += 5;

    if (yPosition > pageHeight - 20 && year < inputs.projectLife - 1) {
      addPageBreak();
    }
  }

  // PAGE 5: ASSUMPTIONS & SOURCES
  addPageBreak();
  addBrandedHeader("Assumptions & Sources");

  const assumptions = [
    ["Project Life", inputs.projectLife + " years"],
    ["Cable Distance", (inputs.cableDistance || 0).toFixed(1) + " km"],
    ["Cable Voltage", (inputs.cableVoltage || 0) + " kV"],
    ["Installed Capacity", (inputs.installedCapacity || 0).toFixed(2) + " MWp"],
    ["CAPEX per MW", "£" + formatNumberWithCommas((inputs.capexPerMW || 0).toFixed(0))],
    ["OPEX per MW (Year 1)", "£" + formatNumberWithCommas((inputs.opexPerMW || 0).toFixed(0))],
    ["Cost Inflation Rate", (inputs.costInflationRate || 0).toFixed(2) + "%"],
    ["Generation Degradation", (inputs.generationDegradation || 0).toFixed(2) + "% p.a."],
    ["PPA Price", "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh"],
    ["Discount Rate", (inputs.discountRate || 0).toFixed(2) + "%"],
  ];

  assumptions.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 6, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 18, yPosition + 4);
    doc.text(row[1], pageWidth - 25, yPosition + 4, { align: "right" });

    yPosition += 6;
  });

  return doc;
}
