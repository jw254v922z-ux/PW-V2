import jsPDF from "jspdf";
import { calculateSensitivityMatrix } from "./sensitivity";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

interface PDFReportOptions {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
  generatedDate?: Date;
  mapScreenshot?: string;
}

// Savills Earth Brand Colors
const BRAND_COLORS = {
  yellow: [255, 215, 0],           // #FFD700 - Primary Yellow
  green: [45, 134, 89],             // #2D8659 - Forest Green
  limeGreen: [127, 191, 63],        // #7FBF3F - Lime Green
  darkNavy: [0, 31, 63],            // #001F3F - Dark Navy
  gray: [128, 128, 128],            // #808080 - Gray
  lightGray: [240, 240, 240],       // #F0F0F0 - Light Gray
  offtaker: [70, 180, 150],         // Teal for Offtaker
  landowner: [100, 150, 100],       // Green for Landowner
  developer: [100, 120, 150],       // Blue for Developer
};

export function generatePDFReport(options: PDFReportOptions) {
  const {
    inputs,
    results,
    projectName,
    description = "",
    generatedDate = new Date(),
    mapScreenshot,
  } = options;

  // Debug: Check if results and summary exist
  if (!results || !results.summary) {
    throw new Error('Invalid results object: results or results.summary is missing');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  let currentPage = 1;

  // Helper: Check and add page break
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      currentPage++;
      addFooter();
    }
  };

  // Helper: Add footer with page number
  const addFooter = () => {
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Private Wire Solar Calculator - Confidential | Page ${currentPage} of 4`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  };

  // Helper: Add branded header
  const addBrandedHeader = (title: string, subtitle: string = "") => {
    // Yellow background bar
    doc.setFillColor(255, 215, 0);
    doc.rect(0, 0, pageWidth, 35, "F");
    
    // Green accent bar on right
    doc.setFillColor(45, 134, 89);
    doc.rect(pageWidth - 8, 0, 8, pageHeight, "F");

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 31, 63);
    doc.text(title, 20, 22);

    // Subtitle
    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(subtitle, 20, 30);
    }

    yPosition = 45;
  };

  // Helper: Add section with green accent
  const addSection = (title: string, fontSize: number = 14) => {
    checkPageBreak(20);
    yPosition += 8;
    
    // Green left border
    doc.setFillColor(45, 134, 89);
    doc.rect(15, yPosition - 4, 3, fontSize + 4, "F");

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 31, 63);
    doc.text(title.toUpperCase(), 22, yPosition + fontSize - 3);
    
    yPosition += fontSize + 6;
    doc.setTextColor(0, 0, 0);
  };

  // Helper: Add text
  const addText = (text: string, fontSize: number = 11, bold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const safeColor = color || [0, 0, 0];
    doc.setTextColor(...safeColor);
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    lines.forEach((line: string) => {
      checkPageBreak(8);
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
  };

  // Helper: Add metric box with yellow highlight
  const addMetricBox = (label: string, value: string, color: number[] = BRAND_COLORS.yellow) => {
    checkPageBreak(16);
    
    // Background box
    const safeColor = color || BRAND_COLORS.yellow;
    doc.setFillColor(...safeColor);
    doc.rect(20, yPosition - 2, pageWidth - 40, 12, "F");
    
    // Border
    doc.setDrawColor(45, 134, 89);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 2, pageWidth - 40, 12);

    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(label, 24, yPosition + 2);

    // Value
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 31, 63);
    doc.text(value, pageWidth - 24, yPosition + 2, { align: "right" });

    yPosition += 16;
  };

  // PAGE 1: TITLE & SUMMARY
  addBrandedHeader("Private Wire Solar Calculator", "Project Summary Report");

  // Project info box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, pageWidth - 40, 20, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 31, 63);
  doc.text("Project: " + projectName, 24, yPosition + 7);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text("Generated: " + generatedDate.toLocaleString(), 24, yPosition + 14);
  
  yPosition += 28;

  // Key metrics
  addSection("Key Financial Metrics");
  addMetricBox("Total CAPEX", formatCurrency(results.summary.totalCapex));
  addMetricBox("LCOE (Discounted)", `£${results.summary.lcoe.toFixed(2)}/MWh`, BRAND_COLORS.offtaker);
  addMetricBox("IRR (Unlevered)", `${(results.summary.irr * 100).toFixed(2)}%`, BRAND_COLORS.landowner);
  addMetricBox("Total NPV", formatCurrency(results.summary.totalNpv), BRAND_COLORS.developer);
  addMetricBox("Payback Period", `${results.summary.paybackPeriod.toFixed(1)} years`);

  // Stakeholder section
  addSection("Stakeholder Value Distribution");
  
  // Offtaker
  doc.setFillColor(70, 180, 150);
  doc.rect(20, yPosition - 2, 3, 12, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(70, 180, 150);
  doc.text("OFFTAKER", 26, yPosition + 3);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const yearlySavings = results.summary.yearlySavings || 0;
  doc.text(`Yearly Savings: ${formatCurrency(yearlySavings)}/year`, 26, yPosition + 9);
  yPosition += 16;

  // Landowner
  doc.setFillColor(100, 150, 100);
  doc.rect(20, yPosition - 2, 3, 12, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 150, 100);
  doc.text("LANDOWNER", 26, yPosition + 3);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const yearlyRental = results.summary.yearlyRentalIncome || 0;
  doc.text(`Yearly Rental Income: ${formatCurrency(yearlyRental)}/year`, 26, yPosition + 9);
  yPosition += 16;

  // Developer
  doc.setFillColor(100, 120, 150);
  doc.rect(20, yPosition - 2, 3, 12, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 120, 150);
  doc.text("DEVELOPER", 26, yPosition + 3);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const developerPremium = results.summary.totalDeveloperPremium || 0;
  doc.text(`Developer Premium: ${formatCurrency(developerPremium)}`, 26, yPosition + 9);
  yPosition += 16;

  // PAGE 2: DETAILED METRICS & CASH FLOW
  doc.addPage();
  yPosition = 20;
  currentPage++;
  addBrandedHeader("Detailed Analysis", "Financial Projections");

  addSection("Project Metrics");
  addMetricBox("System Size", `${inputs.mw} MW`);
  addMetricBox("Project Life", `${inputs.projectLife} years`);
  addMetricBox("Discount Rate", `${(inputs.discountRate * 100).toFixed(1)}%`);
  addMetricBox("Total Generation (25yr)", `${formatNumberWithCommas(results.summary.totalGeneration)} MWh`);
  addMetricBox("Total Revenue (25yr)", formatCurrency(results.summary.totalRevenue));

  // Cash flow table header
  addSection("Annual Cash Flow (5-Year Intervals)");
  
  // Table header
  doc.setFillColor(45, 134, 89);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  const colWidths = [25, 30, 30, 30, 30];
  const cols = ["Year", "Generation (MWh)", "Revenue (£)", "OPEX (£)", "Cash Flow (£)"];
  let xPos = 20;
  
  cols.forEach((col, i) => {
    doc.text(col, xPos + colWidths[i] / 2, yPosition + 4, { align: "center" });
    xPos += colWidths[i];
  });
  
  yPosition += 8;

  // Table rows (5-year intervals)
  doc.setTextColor(0, 31, 63);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  for (let year = 0; year <= inputs.projectLife; year += 5) {
    checkPageBreak(8);
    
    const yearData = results.cashFlow[year] || results.cashFlow[results.cashFlow.length - 1];
    xPos = 20;
    
    const rowData = [
      year.toString(),
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
    if (year % 10 === 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 2, pageWidth - 40, 6, "F");
    }
    
    yPosition += 7;
  }

  // PAGE 3: ASSUMPTIONS & SOURCES
  doc.addPage();
  yPosition = 20;
  currentPage++;
  addBrandedHeader("Assumptions & Sources", "Project Parameters");

  addSection("Key Assumptions");
  addText(`EPC Cost: £${formatNumberWithCommas(inputs.epcCostPerMw)}/MW`, 10);
  addText(`Private Wire Cost: £${formatNumberWithCommas(inputs.gridConnectionCost)}`, 10);
  addText(`OPEX: £${formatNumberWithCommas(inputs.opexPerMw)}/MW/year`, 10);
  addText(`PPA Price: £${inputs.ppaPrice}/MWh`, 10);
  addText(`Export Price: £${inputs.exportPrice}/MWh`, 10);
  addText(`Offsetable Energy Cost: £${inputs.offsetableEnergyCost}/MWh`, 10);
  addText(`Cost Inflation (CPI): ${(inputs.costInflation * 100).toFixed(2)}%`, 10);
  addText(`Panel Degradation: ${(inputs.panelDegradation * 100).toFixed(2)}%/year`, 10);

  addSection("Grid Connection Parameters");
  addText(`Cable Voltage: ${inputs.cableVoltage} kV`, 10);
  addText(`Cable Distance: ${inputs.cableDistance} km`, 10);
  addText(`Road Percentage: ${(inputs.roadPercentage * 100).toFixed(1)}%`, 10);
  addText(`Step-Up Transformers: ${inputs.stepUpTransformers}`, 10);
  addText(`Step-Down Transformers: ${inputs.stepDownTransformers}`, 10);
  addText(`Major Road Crossings: ${inputs.majorRoadCrossings}`, 10);

  addSection("Data Sources");
  addText("• SSEN Charging Statements (2024-25)", 10);
  addText("• ENA Wayleave Rates", 10);
  addText("• UK Meteorological Data (PVGIS)", 10);
  addText("• Industry Standard Assumptions", 10);

  // PAGE 4: DISCLAIMER & MAP
  doc.addPage();
  yPosition = 20;
  currentPage++;
  addBrandedHeader("Important Information", "Disclaimer & Map");

  addSection("Disclaimer");
  addText(
    "This report contains indicative projections based on current data and assumptions. These projections are not suitable for investment decisions without professional verification. Actual results may differ materially from projections due to changes in market conditions, technology, policy, and site-specific factors. Use this tool for preliminary assessment only. Engage qualified professionals for detailed feasibility studies.",
    10,
    false,
    BRAND_COLORS.gray
  );

  // Map screenshot if available
  if (mapScreenshot) {
    addSection("Site Mapping");
    try {
      doc.addImage(mapScreenshot, "PNG", 20, yPosition, pageWidth - 40, 100);
      yPosition += 105;
    } catch (error) {
      addText("Map screenshot unavailable", 10, false, BRAND_COLORS.gray);
    }
  }

  // Add footers to all pages
  for (let i = 1; i <= currentPage; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Save the PDF
  doc.save(`${projectName}-solar-report.pdf`);
}
