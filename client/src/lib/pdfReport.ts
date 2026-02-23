import jsPDF from "jspdf";
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
  const rgbColors = {
    yellow: [255, 215, 0],
    green: [45, 134, 89],
    navy: [0, 31, 63],
    lightGray: [240, 240, 240],
    darkGray: [80, 80, 80],
    white: [255, 255, 255],
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

  // Helper: Add card/box with background - using simple text without special characters
  const addCard = (title: string, content: string[]) => {
    const cardHeight = 6 + content.length * 5;
    doc.setFillColor(...rgbColors.lightGray);
    doc.rect(15, yPosition - 2, pageWidth - 30, cardHeight, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition - 2, pageWidth - 30, cardHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...rgbColors.green);
    // Use simple ASCII text only - no special characters
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
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFillColor(...rgbColors.yellow);
  doc.rect(0, 45, pageWidth, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...rgbColors.white);
  doc.text("Private Wire Solar Calculator", 15, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...rgbColors.white);
  doc.text("Financial Analysis Report", 15, 35);

  yPosition = 65;
  
  // Project name and description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...rgbColors.navy);
  doc.text("Project: " + projectName, 15, yPosition);
  yPosition += 10;

  if (description && description.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...rgbColors.darkGray);
    const lines = doc.splitTextToSize(description, pageWidth - 30);
    doc.text(lines, 15, yPosition);
    yPosition += lines.length * 5 + 5;
  }

  yPosition += 10;

  // Key metrics in 2x3 grid
  const metrics = [
    { label: "System Size", value: inputs.mw.toFixed(2) + " MW" },
    { label: "LCOE", value: "GBP " + results.summary.lcoe.toFixed(2) + "/MWh" },
    { label: "IRR", value: (results.summary.irr * 100).toFixed(2) + "%" },
    { label: "Payback Period", value: results.summary.paybackPeriod.toFixed(1) + " years" },
    { label: "Total NPV", value: formatCurrency(results.summary.totalDiscountedCashFlow) },
    { label: "Project Life", value: inputs.projectLife + " years" },
  ];

  for (let i = 0; i < metrics.length; i += 2) {
    const metric1 = metrics[i];
    const metric2 = metrics[i + 1];

    // Left card
    doc.setFillColor(...rgbColors.lightGray);
    doc.rect(15, yPosition - 2, (pageWidth - 45) / 2, 16, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition - 2, (pageWidth - 45) / 2, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...rgbColors.green);
    doc.text(metric1.label, 20, yPosition + 1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...rgbColors.navy);
    doc.text(metric1.value, 20, yPosition + 8);

    // Right card
    if (metric2) {
      doc.setFillColor(...rgbColors.lightGray);
      doc.rect(pageWidth / 2 + 7, yPosition - 2, (pageWidth - 45) / 2, 16, "F");
      doc.setDrawColor(...rgbColors.darkGray);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth / 2 + 7, yPosition - 2, (pageWidth - 45) / 2, 16);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...rgbColors.green);
      doc.text(metric2.label, pageWidth / 2 + 12, yPosition + 1);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...rgbColors.navy);
      doc.text(metric2.value, pageWidth / 2 + 12, yPosition + 8);
    }

    yPosition += 20;
  }

  // ============ PAGE 2: STAKEHOLDER VALUE ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Stakeholder Value Distribution", projectName + " - Financial Benefits Breakdown");

  const offtakerSavings = results.summary.totalSavings || 0;
  const landownerIncome = results.summary.totalLandOptionIncome || 0;
  const developerPremium = results.summary.totalDeveloperPremium || 0;
  const totalValue = offtakerSavings + landownerIncome + developerPremium;

  // Stakeholder cards - no pie chart
  checkPageBreak(30);

  const offtakerPct = totalValue > 0 ? ((offtakerSavings / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "Offtaker Savings",
    [
      "Total: " + formatCurrency(offtakerSavings),
      "Share: " + offtakerPct + "% of total value",
      "Yearly: " + formatCurrency(offtakerSavings / inputs.projectLife) + "/year",
    ]
  );

  checkPageBreak(30);

  const landownerPct = totalValue > 0 ? ((landownerIncome / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "Landowner Income",
    [
      "Total: " + formatCurrency(landownerIncome),
      "Share: " + landownerPct + "% of total value",
      "Yearly: " + formatCurrency(landownerIncome / inputs.projectLife) + "/year",
    ]
  );

  checkPageBreak(30);

  const developerPct = totalValue > 0 ? ((developerPremium / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "Developer Premium",
    [
      "Total: " + formatCurrency(developerPremium),
      "Share: " + developerPct + "% of total value",
      "Per MW: " + formatCurrency(developerPremium / inputs.mw) + "/MW",
    ]
  );

  checkPageBreak(30);

  // Project/Investor stakeholder
  const projectValue = results.summary.totalDiscountedCashFlow;
  addCard(
    "Project Investor",
    [
      "NPV: " + formatCurrency(projectValue),
      "IRR: " + (results.summary.irr * 100).toFixed(2) + "%",
      "Payback: " + results.summary.paybackPeriod.toFixed(1) + " years",
    ]
  );

  // ============ PAGE 3: FINANCIAL METRICS ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Financial Metrics", "Key Results and Analysis");

  addCard("Key Indicators", [
    "LCOE: GBP " + results.summary.lcoe.toFixed(2) + "/MWh",
    "IRR: " + (results.summary.irr * 100).toFixed(2) + "%",
    "Payback Period: " + results.summary.paybackPeriod.toFixed(1) + " years",
    "Project Life: " + inputs.projectLife + " years",
    "Discount Rate: " + (inputs.discountRate * 100).toFixed(2) + "%",
  ]);

  checkPageBreak(50);

  // Cost breakdown table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...rgbColors.green);
  doc.text("Cost Breakdown", 15, yPosition);
  yPosition += 7;

  const costData = [
    ["EPC Cost", formatCurrency(inputs.mw * inputs.capexPerMW)],
    ["Private Wire", formatCurrency(inputs.privateWireCost)],
    ["Grid Connection", formatCurrency(inputs.gridConnectionCost)],
    ["Total Capex", formatCurrency(results.summary.totalCapex)],
    ["Annual Opex Y1", formatCurrency(inputs.mw * inputs.opexPerMW)],
    ["Opex Escalation", (inputs.opexEscalation * 100).toFixed(2) + "%"],
  ];

  // Draw cost table
  doc.setFillColor(...rgbColors.navy);
  doc.rect(15, yPosition - 3, pageWidth - 30, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.white);
  doc.text("Cost Item", 18, yPosition);
  doc.text("Amount", pageWidth - 45, yPosition, { align: "right" });

  yPosition += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.darkGray);

  costData.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...rgbColors.lightGray);
      doc.rect(15, yPosition - 3, pageWidth - 30, 5, "F");
    }
    doc.text(row[0], 18, yPosition);
    doc.text(row[1], pageWidth - 18, yPosition, { align: "right" });
    yPosition += 5;
  });

  yPosition += 5;
  checkPageBreak(40);

  // Generation & Revenue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...rgbColors.green);
  doc.text("Generation and Revenue", 15, yPosition);
  yPosition += 7;

  const genData = [
    ["System Size", inputs.mw.toFixed(2) + " MW"],
    ["Generation per MW", inputs.generationPerMW.toFixed(0) + " MWh/year"],
    ["Total Generation Y1", (inputs.mw * inputs.generationPerMW).toFixed(0) + " MWh"],
    ["Panel Degradation", (inputs.degradationRate * 100).toFixed(2) + "%/year"],
    ["PPA Price", "GBP " + inputs.powerPrice.toFixed(2) + "/MWh"],
    ["Export Price", "GBP " + inputs.exportPrice.toFixed(2) + "/MWh"],
  ];

  doc.setFillColor(...rgbColors.navy);
  doc.rect(15, yPosition - 3, pageWidth - 30, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.white);
  doc.text("Parameter", 18, yPosition);
  doc.text("Value", pageWidth - 45, yPosition, { align: "right" });

  yPosition += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...rgbColors.darkGray);

  genData.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...rgbColors.lightGray);
      doc.rect(15, yPosition - 3, pageWidth - 30, 5, "F");
    }
    doc.text(row[0], 18, yPosition);
    doc.text(row[1], pageWidth - 18, yPosition, { align: "right" });
    yPosition += 5;
  });

  // ============ PAGE 4: CASH FLOW TABLE ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Annual Cash Flow", "Year-by-Year Financial Projections");

  // Draw cash flow table
  doc.setFillColor(...rgbColors.navy);
  doc.rect(15, yPosition - 3, pageWidth - 30, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...rgbColors.white);

  doc.text("Year", 18, yPosition);
  doc.text("Gen MWh", 35, yPosition);
  doc.text("Revenue", 60, yPosition);
  doc.text("Opex", 85, yPosition);
  doc.text("Cash Flow", 105, yPosition);
  doc.text("Cumulative", pageWidth - 18, yPosition, { align: "right" });

  yPosition += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...rgbColors.darkGray);

  // Show all years
  for (let i = 0; i < Math.min(results.yearlyData.length, inputs.projectLife); i++) {
    const yearData = results.yearlyData[i];

    if (i % 2 === 0) {
      doc.setFillColor(...rgbColors.lightGray);
      doc.rect(15, yPosition - 3, pageWidth - 30, 4, "F");
    }

    doc.text((i + 1).toString(), 18, yPosition);
    doc.text(formatNumberWithCommas(yearData.generation.toFixed(0)), 35, yPosition);
    doc.text(formatCurrency(yearData.revenue), 60, yPosition);
    doc.text(formatCurrency(yearData.opex), 85, yPosition);
    doc.text(formatCurrency(yearData.cashFlow), 105, yPosition);
    doc.text(formatCurrency(yearData.cumulativeCashFlow), pageWidth - 18, yPosition, { align: "right" });

    yPosition += 4;

    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 15;
    }
  }

  // ============ PAGE 5: ASSUMPTIONS ============
  doc.addPage();
  yPosition = 15;

  addBrandedHeader("Assumptions and Sources", "Project Parameters");

  // Cost inflation is already a percentage value (e.g., 2.5 means 2.5%)
  const costInflationDisplay = inputs.costInflationRate.toFixed(2) + "%";

  addCard("Key Assumptions", [
    "EPC Cost: GBP " + formatNumberWithCommas(inputs.capexPerMW) + "/MW",
    "Private Wire Cost: GBP " + formatNumberWithCommas(inputs.privateWireCost),
    "OPEX: GBP " + formatNumberWithCommas(inputs.opexPerMW) + "/MW/year",
    "PPA Price: GBP " + inputs.powerPrice.toFixed(2) + "/MWh",
    "Cost Inflation: " + costInflationDisplay,
  ]);

  checkPageBreak(30);

  addCard("Grid Connection Parameters", [
    "Cable Voltage: " + (inputs.cableVoltageKV || "N/A") + " kV",
    "Cable Distance: " + (inputs.distanceKm || "N/A") + " km",
    "Generation per MW: " + inputs.generationPerMW.toFixed(0) + " MWh/year",
    "OPEX Escalation: " + (inputs.opexEscalation * 100).toFixed(2) + "%/year",
    "Panel Degradation: " + (inputs.degradationRate * 100).toFixed(2) + "%/year",
  ]);

  checkPageBreak(30);

  addCard("Data Sources", [
    "SSEN Charging Statements 2024-25",
    "ENA Wayleave Rates",
    "UK Meteorological Data PVGIS",
    "Industry Standard Assumptions",
  ]);

  // Footer on all pages
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.text(
      "Page " + i + " of " + doc.getNumberOfPages() + " | Generated: " + new Date().toLocaleDateString() + " | Savills Earth",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}
