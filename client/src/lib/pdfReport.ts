import jsPDF from "jspdf";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

export function generatePDFReport(params: {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
  mapScreenshot?: string;
}): jsPDF {
  const { inputs, results, projectName, description, mapScreenshot } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  let currentPage = 1;

  // Savills Earth Brand Colors
  const colors = {
    yellow: [255, 215, 0],      // #FFD700
    green: [45, 134, 89],       // #2D8659
    navy: [0, 31, 63],          // #001F3F
    lightGray: [240, 240, 240],
    darkGray: [80, 80, 80],
    white: [255, 255, 255],
  };

  // Helper functions
  const addBrandedHeader = (title: string, subtitle?: string) => {
    // Yellow bar
    doc.setFillColor(...colors.yellow);
    doc.rect(0, yPosition - 5, pageWidth, 15, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...colors.navy);
    doc.text(title, 20, yPosition + 5);

    // Subtitle
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.green);
      doc.text(subtitle, 20, yPosition + 10);
    }

    yPosition += 20;
  };

  const addSection = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.green);
    doc.text(title, 20, yPosition);
    yPosition += 8;
  };

  const addText = (text: string, fontSize: number = 10, color = colors.darkGray) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * (fontSize / 2.5) + 2;
  };

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - 10) {
      doc.addPage();
      yPosition = 20;
      currentPage++;
    }
  };

  // PAGE 1: COVER PAGE
  // Header with brand colors
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFillColor(...colors.yellow);
  doc.rect(0, 50, pageWidth, 10, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...colors.white);
  doc.text("Private Wire Solar Calculator", 20, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...colors.white);
  doc.text("Financial Analysis Report", 20, 40);

  // Project name
  yPosition = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...colors.navy);
  doc.text(projectName, 20, yPosition);

  yPosition += 15;
  if (description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.darkGray);
    const lines = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Key metrics on cover
  yPosition += 10;
  doc.setFillColor(...colors.lightGray);
  doc.rect(20, yPosition - 5, pageWidth - 40, 60, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.navy);

  const metrics = [
    { label: "System Size", value: `${inputs.mw.toFixed(2)} MW` },
    { label: "LCOE", value: `£${results.summary.lcoe.toFixed(2)}/MWh` },
    { label: "IRR", value: `${(results.summary.irr * 100).toFixed(2)}%` },
    { label: "Payback Period", value: `${results.summary.paybackPeriod.toFixed(1)} years` },
    { label: "Total NPV", value: formatCurrency(results.summary.totalDiscountedCashFlow) },
  ];

  let metricY = yPosition;
  metrics.forEach((metric, idx) => {
    if (idx % 2 === 0) {
      doc.text(`${metric.label}:`, 25, metricY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.green);
      doc.text(metric.value, 85, metricY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.navy);
    } else {
      doc.text(`${metric.label}:`, pageWidth / 2 + 5, metricY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.green);
      doc.text(metric.value, pageWidth / 2 + 65, metricY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.navy);
      metricY += 10;
    }
  });

  // PAGE 2: FINANCIAL SUMMARY
  doc.addPage();
  yPosition = 20;
  currentPage++;

  addBrandedHeader("Financial Summary", "Key Results & Stakeholder Value");

  // Stakeholder value section
  addSection("Stakeholder Value Distribution");

  const offtakerSavings = results.summary.offtakerSavings;
  const landownerIncome = results.summary.landownerIncome;
  const developerPremium = results.summary.developerPremium;
  const totalValue = offtakerSavings + landownerIncome + developerPremium;

  const metrics_list = [
    { label: "Offtaker Savings", value: offtakerSavings, color: colors.green },
    { label: "Landowner Income", value: landownerIncome, color: colors.yellow },
    { label: "Developer Premium", value: developerPremium, color: colors.navy },
  ];

  metrics_list.forEach((metric) => {
    const percentage = totalValue > 0 ? ((metric.value / totalValue) * 100).toFixed(1) : "0";
    addText(
      `${metric.label}: ${formatCurrency(metric.value)} (${percentage}%)`,
      11,
      metric.color
    );
  });

  checkPageBreak(40);

  // Financial metrics
  addSection("Key Financial Metrics");
  addText(`Levelized Cost of Energy (LCOE): £${results.summary.lcoe.toFixed(2)}/MWh`, 11);
  addText(`Internal Rate of Return (IRR): ${(results.summary.irr * 100).toFixed(2)}%`, 11);
  addText(`Payback Period: ${results.summary.paybackPeriod.toFixed(1)} years`, 11);
  addText(`Total NPV (Discounted): ${formatCurrency(results.summary.totalDiscountedCashFlow)}`, 11);
  addText(`Project Life: ${inputs.projectLife} years`, 11);
  addText(`Discount Rate: ${(inputs.discountRate * 100).toFixed(2)}%`, 11);

  checkPageBreak(40);

  // Cost breakdown
  addSection("Cost Breakdown");
  addText(`Total Capex: ${formatCurrency(results.summary.totalCapex)}`, 11);
  addText(`  - EPC Cost: ${formatCurrency(inputs.mw * inputs.capexPerMW)}`, 10);
  addText(`  - Private Wire Cost: ${formatCurrency(inputs.privateWireCost)}`, 10);
  addText(`  - Grid Connection Cost: ${formatCurrency(inputs.gridConnectionCost)}`, 10);
  addText(`Annual Opex (Year 1): ${formatCurrency(inputs.mw * inputs.opexPerMW)}`, 11);
  addText(`Opex Escalation: ${(inputs.opexEscalation * 100).toFixed(2)}%/year`, 11);

  checkPageBreak(50);

  // Generation & Revenue
  addSection("Generation & Revenue");
  addText(`System Size: ${inputs.mw.toFixed(2)} MW`, 11);
  addText(`Generation per MW: ${inputs.generationPerMW.toFixed(0)} MWh/year`, 11);
  addText(`Total Year 1 Generation: ${(inputs.mw * inputs.generationPerMW).toFixed(0)} MWh`, 11);
  addText(`Panel Degradation: ${(inputs.degradationRate * 100).toFixed(2)}%/year`, 11);
  addText(`PPA Price: £${inputs.powerPrice.toFixed(2)}/MWh`, 11);
  addText(`Export Price: £${inputs.exportPrice.toFixed(2)}/MWh`, 11);
  addText(`PPA Consumption: ${inputs.percentConsumptionPPA.toFixed(0)}%`, 11);
  addText(`Export Consumption: ${inputs.percentConsumptionExport.toFixed(0)}%`, 11);

  // PAGE 3: CASH FLOW TABLE
  doc.addPage();
  yPosition = 20;
  currentPage++;

  addBrandedHeader("Annual Cash Flow", "Year-by-Year Financial Projections");

  // Table headers
  const colWidths = [15, 25, 25, 25, 25, 25];
  let xPos = 20;
  const headerY = yPosition;

  doc.setFillColor(...colors.navy);
  doc.rect(20, headerY - 5, pageWidth - 40, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...colors.white);

  const headers = ["Year", "Generation (MWh)", "Revenue (£)", "Opex (£)", "Cash Flow (£)"];
  headers.forEach((header, i) => {
    doc.text(header, xPos + colWidths[i] / 2, headerY + 2, { align: "center" });
    xPos += colWidths[i];
  });

  yPosition = headerY + 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.darkGray);

  for (let year = 0; year < Math.min(results.yearlyData.length, 20); year++) {
    checkPageBreak(8);

    const yearData = results.yearlyData[year];
    xPos = 20;

    const rowData = [
      (year + 1).toString(),
      formatNumberWithCommas(yearData.generation.toFixed(0)),
      formatCurrency(yearData.revenue),
      formatCurrency(yearData.opex),
      formatCurrency(yearData.cashFlow),
    ];

    rowData.forEach((data, i) => {
      doc.text(data, xPos + colWidths[i] / 2, yPosition + 3, { align: "center" });
      xPos += colWidths[i];
    });

    // Alternate row background
    if (year % 2 === 0) {
      doc.setFillColor(...colors.lightGray);
      doc.rect(20, yPosition - 2, pageWidth - 40, 6, "F");
    }

    yPosition += 7;
  }

  // PAGE 4: ASSUMPTIONS & SOURCES
  doc.addPage();
  yPosition = 20;
  currentPage++;
  addBrandedHeader("Assumptions & Sources", "Project Parameters");

  addSection("Key Assumptions");
  addText(`EPC Cost: £${formatNumberWithCommas(inputs.capexPerMW)}/MW`, 10);
  addText(`Private Wire Cost: £${formatNumberWithCommas(inputs.privateWireCost)}`, 10);
  addText(`OPEX: £${formatNumberWithCommas(inputs.opexPerMW)}/MW/year`, 10);
  addText(`PPA Price: £${inputs.powerPrice.toFixed(2)}/MWh`, 10);
  addText(`Export Price: £${inputs.exportPrice.toFixed(2)}/MWh`, 10);
  addText(`Offsetable Energy Cost: £${inputs.offsetableEnergyCost.toFixed(2)}/MWh`, 10);
  addText(`Cost Inflation (CPI): ${(inputs.costInflationRate * 100).toFixed(2)}%`, 10);
  addText(`Panel Degradation: ${(inputs.degradationRate * 100).toFixed(2)}%/year`, 10);

  checkPageBreak(30);

  addSection("Grid Connection Parameters");
  addText(`Cable Voltage: ${inputs.cableVoltageKV || "N/A"} kV`, 10);
  addText(`Cable Distance: ${inputs.distanceKm || "N/A"} km`, 10);
  addText(`Project Life: ${inputs.projectLife} years`, 10);
  addText(`Discount Rate: ${(inputs.discountRate * 100).toFixed(2)}%`, 10);
  addText(`Generation per MW: ${inputs.generationPerMW.toFixed(0)} MWh/year`, 10);
  addText(`OPEX Escalation: ${(inputs.opexEscalation * 100).toFixed(2)}%/year`, 10);

  checkPageBreak(30);

  addSection("Data Sources");
  addText("• SSEN Charging Statements (2024-25)", 10);
  addText("• ENA Wayleave Rates", 10);
  addText("• UK Meteorological Data (PVGIS)", 10);
  addText("• Industry Standard Assumptions", 10);

  // Footer on all pages
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${doc.getNumberOfPages()} | Generated: ${new Date().toLocaleDateString()} | Savills Earth`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}
