import jsPDF from "jspdf";
import { SolarInputs, SolarResults } from "./calculator";
import { formatCurrency, formatNumberWithCommas } from "./formatters";

// Function to draw a pie chart on canvas and return as image
async function generatePieChartImage(
  data: Array<{ label: string; value: number; color: string }>,
  width: number = 300,
  height: number = 300
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let currentAngle = -Math.PI / 2;

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.65);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.65);

      const percentage = ((item.value / total) * 100).toFixed(0);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    resolve(canvas.toDataURL("image/png"));
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
  let yPosition = 20;

  // Savills Earth Brand Colors
  const colors = {
    yellow: "#FFD700",
    green: "#2D8659",
    navy: "#001F3F",
    lightGray: "#F0F0F0",
    darkGray: "#505050",
    white: "#FFFFFF",
    offtaker: "#2D8659",
    landowner: "#FFD700",
    developer: "#001F3F",
  };

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
    doc.text(title, 20, yPosition + 5);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...rgbColors.green);
      doc.text(subtitle, 20, yPosition + 10);
    }

    yPosition += 22;
  };

  // Helper: Add card/box with background
  const addCard = (
    title: string,
    content: string[],
    bgColor: [number, number, number] = rgbColors.lightGray,
    textColor: [number, number, number] = rgbColors.darkGray,
    titleColor: [number, number, number] = rgbColors.navy
  ) => {
    const cardHeight = 8 + content.length * 6;
    doc.setFillColor(...bgColor);
    doc.rect(20, yPosition - 3, pageWidth - 40, cardHeight, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 3, pageWidth - 40, cardHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...titleColor);
    doc.text(title, 25, yPosition + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textColor);

    let contentY = yPosition + 7;
    content.forEach((line) => {
      doc.text(line, 25, contentY);
      contentY += 5;
    });

    yPosition += cardHeight + 8;
  };

  // Helper: Add table
  const addTable = (
    headers: string[],
    rows: string[][],
    colWidths: number[]
  ) => {
    const headerHeight = 8;
    const rowHeight = 6;

    // Header
    doc.setFillColor(...rgbColors.navy);
    doc.rect(20, yPosition - 3, pageWidth - 40, headerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...rgbColors.white);

    let xPos = 20;
    headers.forEach((header, i) => {
      doc.text(header, xPos + colWidths[i] / 2, yPosition + 2, { align: "center" });
      xPos += colWidths[i];
    });

    yPosition += headerHeight + 2;

    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...rgbColors.darkGray);

    rows.forEach((row, rowIdx) => {
      xPos = 20;
      row.forEach((cell, colIdx) => {
        doc.text(cell, xPos + colWidths[colIdx] / 2, yPosition + 2, { align: "center" });
        xPos += colWidths[colIdx];
      });

      // Alternate row colors
      if (rowIdx % 2 === 0) {
        doc.setFillColor(...rgbColors.lightGray);
        doc.rect(20, yPosition - 3, pageWidth - 40, rowHeight, "F");
      }

      yPosition += rowHeight + 1;
    });

    yPosition += 5;
  };

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - 15) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // ============ PAGE 1: COVER PAGE ============
  doc.setFillColor(...rgbColors.navy);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFillColor(...rgbColors.yellow);
  doc.rect(0, 50, pageWidth, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...rgbColors.white);
  doc.text("Private Wire Solar Calculator", 20, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...rgbColors.white);
  doc.text("Financial Analysis Report", 20, 40);

  yPosition = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...rgbColors.navy);
  doc.text(projectName, 20, yPosition);

  yPosition += 15;
  if (description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...rgbColors.darkGray);
    const lines = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Key metrics cards
  yPosition += 10;
  const metrics = [
    { label: "System Size", value: `${inputs.mw.toFixed(2)} MW` },
    { label: "LCOE", value: `£${results.summary.lcoe.toFixed(2)}/MWh` },
    { label: "IRR", value: `${(results.summary.irr * 100).toFixed(2)}%` },
    { label: "Payback Period", value: `${results.summary.paybackPeriod.toFixed(1)} years` },
    { label: "Total NPV", value: formatCurrency(results.summary.totalDiscountedCashFlow) },
  ];

  // 2x3 grid of metrics
  for (let i = 0; i < metrics.length; i += 2) {
    const metric1 = metrics[i];
    const metric2 = metrics[i + 1];

    // Left card
    doc.setFillColor(...rgbColors.lightGray);
    doc.rect(20, yPosition - 3, (pageWidth - 50) / 2, 18, "F");
    doc.setDrawColor(...rgbColors.darkGray);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 3, (pageWidth - 50) / 2, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...rgbColors.green);
    doc.text(metric1.label, 25, yPosition + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...rgbColors.navy);
    doc.text(metric1.value, 25, yPosition + 9);

    // Right card
    if (metric2) {
      doc.setFillColor(...rgbColors.lightGray);
      doc.rect(pageWidth / 2 + 5, yPosition - 3, (pageWidth - 50) / 2, 18, "F");
      doc.setDrawColor(...rgbColors.darkGray);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth / 2 + 5, yPosition - 3, (pageWidth - 50) / 2, 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...rgbColors.green);
      doc.text(metric2.label, pageWidth / 2 + 10, yPosition + 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...rgbColors.navy);
      doc.text(metric2.value, pageWidth / 2 + 10, yPosition + 9);
    }

    yPosition += 22;
  }

  // ============ PAGE 2: STAKEHOLDER VALUE ============
  doc.addPage();
  yPosition = 20;

  addBrandedHeader("Stakeholder Value Distribution", "Financial Benefits Breakdown");

  const offtakerSavings = results.summary.offtakerSavings;
  const landownerIncome = results.summary.landownerIncome;
  const developerPremium = results.summary.developerPremium;
  const totalValue = offtakerSavings + landownerIncome + developerPremium;

  // Generate pie chart image
  const pieChartData = [
    { label: "Offtaker Savings", value: offtakerSavings, color: colors.offtaker },
    { label: "Landowner Income", value: landownerIncome, color: colors.landowner },
    { label: "Developer Premium", value: developerPremium, color: colors.developer },
  ];

  const pieChartImage = await generatePieChartImage(pieChartData);

  // Add pie chart image
  if (pieChartImage) {
    doc.addImage(pieChartImage, "PNG", 30, yPosition, 60, 60);
    yPosition += 65;
  }

  checkPageBreak(80);

  // Stakeholder cards
  const offtakerPct = totalValue > 0 ? ((offtakerSavings / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "🔋 Offtaker",
    [
      `Total Savings: ${formatCurrency(offtakerSavings)}`,
      `Share: ${offtakerPct}% of total value`,
      `Yearly Savings: ${formatCurrency(offtakerSavings / inputs.projectLife)}/year`,
    ],
    rgbColors.lightGray,
    rgbColors.darkGray,
    rgbColors.green
  );

  checkPageBreak(30);

  const landownerPct = totalValue > 0 ? ((landownerIncome / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "🌾 Landowner",
    [
      `Total Rental Income: ${formatCurrency(landownerIncome)}`,
      `Share: ${landownerPct}% of total value`,
      `Yearly Rental Income: ${formatCurrency(landownerIncome / inputs.projectLife)}/year`,
    ],
    rgbColors.lightGray,
    rgbColors.darkGray,
    rgbColors.yellow
  );

  checkPageBreak(30);

  const developerPct = totalValue > 0 ? ((developerPremium / totalValue) * 100).toFixed(1) : "0";
  addCard(
    "💼 Developer",
    [
      `Total Premium: ${formatCurrency(developerPremium)}`,
      `Share: ${developerPct}% of total value`,
      `Premium per MW: ${formatCurrency(developerPremium / inputs.mw)}/MW`,
    ],
    rgbColors.lightGray,
    rgbColors.darkGray,
    rgbColors.navy
  );

  // ============ PAGE 3: FINANCIAL METRICS ============
  doc.addPage();
  yPosition = 20;

  addBrandedHeader("Financial Metrics", "Key Results & Analysis");

  // Financial metrics cards
  addCard("Key Indicators", [
    `LCOE: £${results.summary.lcoe.toFixed(2)}/MWh`,
    `IRR: ${(results.summary.irr * 100).toFixed(2)}%`,
    `Payback Period: ${results.summary.paybackPeriod.toFixed(1)} years`,
    `Project Life: ${inputs.projectLife} years`,
    `Discount Rate: ${(inputs.discountRate * 100).toFixed(2)}%`,
  ]);

  checkPageBreak(40);

  // Cost breakdown table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...rgbColors.green);
  doc.text("Cost Breakdown", 20, yPosition);
  yPosition += 8;

  const costRows = [
    ["EPC Cost", formatCurrency(inputs.mw * inputs.capexPerMW)],
    ["Private Wire", formatCurrency(inputs.privateWireCost)],
    ["Grid Connection", formatCurrency(inputs.gridConnectionCost)],
    ["Total Capex", formatCurrency(results.summary.totalCapex)],
    ["Annual Opex (Y1)", formatCurrency(inputs.mw * inputs.opexPerMW)],
    ["Opex Escalation", `${(inputs.opexEscalation * 100).toFixed(2)}%/year`],
  ];

  addTable(["Cost Item", "Amount"], costRows, [pageWidth - 60, 40]);

  checkPageBreak(40);

  // Generation & Revenue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...rgbColors.green);
  doc.text("Generation & Revenue", 20, yPosition);
  yPosition += 8;

  const genRows = [
    ["System Size", `${inputs.mw.toFixed(2)} MW`],
    ["Generation/MW", `${inputs.generationPerMW.toFixed(0)} MWh/year`],
    ["Total Generation (Y1)", `${(inputs.mw * inputs.generationPerMW).toFixed(0)} MWh`],
    ["Panel Degradation", `${(inputs.degradationRate * 100).toFixed(2)}%/year`],
    ["PPA Price", `£${inputs.powerPrice.toFixed(2)}/MWh`],
    ["Export Price", `£${inputs.exportPrice.toFixed(2)}/MWh`],
  ];

  addTable(["Parameter", "Value"], genRows, [pageWidth - 60, 40]);

  // ============ PAGE 4: CASH FLOW TABLE ============
  doc.addPage();
  yPosition = 20;

  addBrandedHeader("Annual Cash Flow", "Year-by-Year Financial Projections");

  const colWidths = [12, 22, 22, 22, 22, 22];
  const cashFlowRows = results.yearlyData.slice(0, 20).map((year, idx) => [
    (idx + 1).toString(),
    formatNumberWithCommas(year.generation.toFixed(0)),
    formatCurrency(year.revenue),
    formatCurrency(year.opex),
    formatCurrency(year.cashFlow),
    formatCurrency(year.cumulativeCashFlow),
  ]);

  addTable(
    ["Year", "Gen (MWh)", "Revenue", "Opex", "Cash Flow", "Cumulative"],
    cashFlowRows,
    colWidths
  );

  // ============ PAGE 5: ASSUMPTIONS ============
  doc.addPage();
  yPosition = 20;

  addBrandedHeader("Assumptions & Sources", "Project Parameters");

  addCard("Key Assumptions", [
    `EPC Cost: £${formatNumberWithCommas(inputs.capexPerMW)}/MW`,
    `Private Wire Cost: £${formatNumberWithCommas(inputs.privateWireCost)}`,
    `OPEX: £${formatNumberWithCommas(inputs.opexPerMW)}/MW/year`,
    `PPA Price: £${inputs.powerPrice.toFixed(2)}/MWh`,
    `Offsetable Energy Cost: £${inputs.offsetableEnergyCost.toFixed(2)}/MWh`,
    `Cost Inflation: ${(inputs.costInflationRate * 100).toFixed(2)}%`,
  ]);

  checkPageBreak(30);

  addCard("Grid Connection Parameters", [
    `Cable Voltage: ${inputs.cableVoltageKV || "N/A"} kV`,
    `Cable Distance: ${inputs.distanceKm || "N/A"} km`,
    `Generation/MW: ${inputs.generationPerMW.toFixed(0)} MWh/year`,
    `OPEX Escalation: ${(inputs.opexEscalation * 100).toFixed(2)}%/year`,
    `Panel Degradation: ${(inputs.degradationRate * 100).toFixed(2)}%/year`,
  ]);

  checkPageBreak(30);

  addCard("Data Sources", [
    "• SSEN Charging Statements (2024-25)",
    "• ENA Wayleave Rates",
    "• UK Meteorological Data (PVGIS)",
    "• Industry Standard Assumptions",
  ]);

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
