import { jsPDF } from 'jspdf';
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

export function generatePDFReport(options: PDFReportOptions) {
  try {
    console.log('[PDF] Starting PDF generation');
    const {
      inputs,
      results,
      projectName,
      description = "",
      generatedDate = new Date(),
      mapScreenshot,
    } = options;

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    console.log('[PDF] jsPDF instance created');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Solar Project Report", margin, yPos);
    yPos += 15;

    // Project Name
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Project: ${projectName}`, margin, yPos);
    yPos += 8;

    // Description
    if (description) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const descLines = doc.splitTextToSize(description, contentWidth);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 5 + 5;
    }

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${generatedDate.toLocaleDateString()}`, margin, yPos);
    yPos += 10;

    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Key Metrics", margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const metrics = [
      [`System Size: ${inputs.mw} MW`, `LCOE: £${results.summary.lcoe.toFixed(0)}/MWh`],
      [`Project Life: ${inputs.projectLife} years`, `IRR: ${(results.summary.irr * 100).toFixed(2)}%`],
      [`Total CAPEX: ${formatCurrency(results.summary.totalCapex)}`, `Total NPV: ${formatCurrency(results.summary.totalDiscountedCashFlow)}`],
      [`Payback Period: ${results.summary.paybackPeriod > inputs.projectLife ? '> Project Life' : results.summary.paybackPeriod.toFixed(1) + ' years'}`, `Discount Rate: ${(inputs.discountRate * 100).toFixed(1)}%`]
    ];

    metrics.forEach(([left, right]) => {
      doc.text(left, margin, yPos);
      doc.text(right, pageWidth / 2, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Stakeholder Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Stakeholder Value", margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const stakeholders = [
      [`Offtaker Savings: ${formatCurrency(results.summary.totalSavings)}`, `Yearly: ${formatCurrency(results.summary.yearlySavings)}`],
      [`Landowner Income: ${formatCurrency(results.summary.totalLandOptionIncome)}`, `Yearly: ${formatCurrency(results.summary.yearlyRentalIncome)}`],
      [`Developer Premium: ${formatCurrency(results.summary.totalDeveloperPremium)}`, ``]
    ];

    stakeholders.forEach(([left, right]) => {
      doc.text(left, margin, yPos);
      if (right) doc.text(right, pageWidth / 2, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Cable Parameters Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Cable Parameters", margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const cableParams = [
      [`Cable Voltage: ${inputs.cableVoltageKV || 'N/A'} kV`, `Cable Distance: ${inputs.distanceKm || 'N/A'} km`]
    ];

    cableParams.forEach(([left, right]) => {
      doc.text(left, margin, yPos);
      doc.text(right, pageWidth / 2, yPos);
      yPos += 6;
    });

    // Add map screenshot if available
    if (mapScreenshot) {
      yPos += 10;
      
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 54, 93);
      doc.text("Site Map", margin, yPos);
      yPos += 10;

      try {
        // Add image - adjust size to fit page
        const imgWidth = contentWidth;
        const imgHeight = 80;
        doc.addImage(mapScreenshot, 'PNG', margin, yPos, imgWidth, imgHeight);
        console.log('[PDF] Map screenshot added');
      } catch (imgError) {
        console.error('[PDF] Failed to add map screenshot:', imgError);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Map screenshot unavailable', margin, yPos);
      }
      yPos += 85;
    }

    // Add yearly cash flow table
    yPos += 10;
    
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 54, 93);
    doc.text("Yearly Cash Flow", margin, yPos);
    yPos += 10;

    // Table headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.setFillColor(248, 250, 252);

    const headers = ['Year', 'Generation (MWh)', 'Revenue (£)', 'Opex (£)', 'Cash Flow (£)'];
    const colWidths = [15, 30, 35, 30, 35];
    let xPos = margin;

    headers.forEach((header, i) => {
      doc.rect(xPos, yPos, colWidths[i], 8, 'F');
      doc.text(header, xPos + 2, yPos + 5);
      xPos += colWidths[i];
    });
    yPos += 8;

    // Table data - show first 5 years and last year
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);

    const yearsToShow = [
      ...results.yearlyData.slice(0, 5),
      ...(results.yearlyData.length > 6 ? [results.yearlyData[results.yearlyData.length - 1]] : [])
    ];

    yearsToShow.forEach((year, idx) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
      }

      if (idx === 5 && results.yearlyData.length > 6) {
        doc.text('...', margin + 2, yPos + 5);
        yPos += 6;
      }

      xPos = margin;
      const rowData = [
        year.year.toString(),
        year.generation.toFixed(0),
        formatCurrency(year.revenue),
        formatCurrency(year.opex),
        formatCurrency(year.cashFlow)
      ];

      rowData.forEach((cell, i) => {
        doc.rect(xPos, yPos, colWidths[i], 6, 'S');
        doc.text(cell, xPos + 2, yPos + 4);
        xPos += colWidths[i];
      });
      yPos += 6;
    });

    // Footer
    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report is indicative and based on Jan 2026 data. Not for investment decisions without professional verification.', margin, pageHeight - 10);

    console.log('[PDF] Saving PDF...');
    doc.save(`${projectName}-solar-report.pdf`);
    console.log('[PDF] PDF saved successfully');
    
  } catch (error) {
    console.error('[PDF] PDF generation failed:', error);
    alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
