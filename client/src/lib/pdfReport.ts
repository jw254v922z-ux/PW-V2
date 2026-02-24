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

  // Calculate stakeholder values from summary
  const operatorNPV = results.summary.totalDiscountedCashFlow;
  const offtakerSavings = results.summary.totalSavings;
  const landownerIncome = results.summary.totalLandOptionIncome;
  const developerPremium = results.summary.totalDeveloperPremium;

  const totalValue = operatorNPV + offtakerSavings + landownerIncome + developerPremium;

  const stakeholderData = [
    { label: "Operator", value: operatorNPV, color: hexColors.project },
    { label: "Offtaker", value: offtakerSavings, color: hexColors.offtaker },
    { label: "Landowner", value: landownerIncome, color: hexColors.landowner },
    { label: "Developer", value: developerPremium, color: hexColors.developer },
  ];

  // Draw pie chart representation as bars
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
  doc.text(`NPV: ${formatCurrency(operatorNPV)}`, 18, yPosition + 14);
  doc.text(`IRR: ${((results.summary.irr || 0) * 100).toFixed(2)}%`, 18, yPosition + 20);

  // Offtaker
  doc.setFillColor(45, 134, 89);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Offtaker", 18 + boxWidth, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Savings: ${formatCurrency(offtakerSavings)}`, 18 + boxWidth, yPosition + 14);
  doc.text(`Yearly: ${formatCurrency(results.summary.yearlySavings)}`, 18 + boxWidth, yPosition + 20);

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
  doc.text(`Total Income: ${formatCurrency(landownerIncome)}`, 18, yPosition + 14);
  doc.text(`Yearly: ${formatCurrency(results.summary.yearlyRentalIncome)}`, 18, yPosition + 20);

  // Developer
  doc.setFillColor(0, 31, 63);
  doc.rect(15 + boxWidth, yPosition, boxWidth - 2, boxHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Developer", 18 + boxWidth, yPosition + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Premium: ${formatCurrency(developerPremium)}`, 18 + boxWidth, yPosition + 14);
  doc.text(`Payback: ${(results.summary.paybackPeriod || 0).toFixed(1)} years`, 18 + boxWidth, yPosition + 20);

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
    ["EPC Cost", formatCurrency(inputs.capexPerMW * inputs.mw)],
    ["Private Wire Cost", formatCurrency(inputs.privateWireCost)],
    ["Grid Connection Cost", formatCurrency(inputs.gridConnectionCost)],
    ["Developer Premium", formatCurrency(results.summary.totalDeveloperPremium)],
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

  const year1Data = results.yearlyData[1]; // Year 1 is index 1 (Year 0 is CAPEX)
  const genData = [
    ["Annual Generation", formatNumberWithCommas(year1Data.generation.toFixed(0)) + " MWh"],
    ["PPA Price", "£" + (inputs.powerPrice || 0).toFixed(2) + "/MWh"],
    ["Annual Revenue", formatCurrency(year1Data.revenue)],
    ["OPEX (Year 1)", formatCurrency(year1Data.opex)],
    ["Net Cash Flow", formatCurrency(year1Data.cashFlow)],
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

  // Cash flow rows - all years
  results.yearlyData.forEach((yearData, idx) => {
    if (idx === 0) return; // Skip year 0 (CAPEX only)

    const bgColor = idx % 2 === 0 ? colors.white : colors.gray;
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(15, yPosition, pageWidth - 30, 5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    doc.text(yearData.year.toString(), 15 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.revenue.toFixed(0)), 15 + colWidth + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.opex.toFixed(0)), 15 + colWidth * 2 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.cashFlow.toFixed(0)), 15 + colWidth * 3 + 2, yPosition + 3.5);
    doc.text("£" + formatNumberWithCommas(yearData.cumulativeCashFlow.toFixed(0)), 15 + colWidth * 4 + 2, yPosition + 3.5);

    yPosition += 5;

    if (yPosition > pageHeight - 20 && idx < results.yearlyData.length - 1) {
      addPageBreak();
    }
  });

  // PAGE 5: ASSUMPTIONS & SOURCES
  addPageBreak();
  addBrandedHeader("Assumptions & Sources");

  const assumptions = [
    ["Project Life", inputs.projectLife + " years"],
    ["Installed Capacity", (inputs.mw || 0).toFixed(2) + " MWp"],
    ["CAPEX per MW", "£" + formatNumberWithCommas((inputs.capexPerMW || 0).toFixed(0))],
    ["OPEX per MW (Year 1)", "£" + formatNumberWithCommas((inputs.opexPerMW || 0).toFixed(0))],
    ["Cost Inflation Rate", (inputs.costInflationRate || 0).toFixed(2) + "%"],
    ["Generation Degradation", (inputs.degradationRate || 0).toFixed(2) + "% p.a."],
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
