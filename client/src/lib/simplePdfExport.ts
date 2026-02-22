import { jsPDF } from 'jspdf';
import { SolarInputs, SolarResults } from './calculator';
import { formatCurrency } from './formatters';

interface SimplePDFOptions {
  inputs: SolarInputs;
  results: SolarResults;
  projectName: string;
  description?: string;
}

export function exportSimplePDF(options: SimplePDFOptions) {
  const { inputs, results, projectName, description } = options;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPos = 20;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Solar Project Report', margin, yPos);
    yPos += 12;

    // Project Name
    doc.setFontSize(14);
    doc.text(projectName || 'Solar Project', margin, yPos);
    yPos += 8;

    // Date
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 12;

    // Key Metrics
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Key Financial Metrics', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const metrics = [
      ['Total CAPEX:', formatCurrency(results.summary.totalCapex)],
      ['LCOE (Real):', `£${results.summary.lcoe.toFixed(0)}/MWh`],
      ['IRR (Unlevered):', `${results.summary.irr.toFixed(2)}%`],
      ['Payback Period:', results.summary.paybackPeriod > 100 ? '> Project Life' : `${results.summary.paybackPeriod.toFixed(1)} years`],
    ];

    metrics.forEach(([label, value]) => {
      doc.text(label, margin, yPos);
      doc.text(value, margin + 80, yPos);
      yPos += 6;
    });

    yPos += 8;

    // Stakeholder Value
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Stakeholder Value', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const stakeholders = [
      ['Offtaker Savings:', formatCurrency(results.summary.totalSavings)],
      ['Landowner Income:', formatCurrency(results.summary.totalLandOptionIncome)],
      ['Developer Premium:', formatCurrency(results.summary.totalDeveloperPremium)],
    ];

    stakeholders.forEach(([label, value]) => {
      doc.text(label, margin, yPos);
      doc.text(value, margin + 80, yPos);
      yPos += 6;
    });

    yPos += 8;

    // Cable Parameters
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Private Wire Parameters', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const cableParams = [
      ['Cable Voltage:', '33 kV'],
      ['Cable Distance:', `${(inputs.distanceKm || 3).toFixed(2)} km`],
      ['Road Percentage:', '50%'],
      ['Major Road Crossings:', '2'],
    ];

    cableParams.forEach(([label, value]) => {
      doc.text(label, margin, yPos);
      doc.text(value, margin + 80, yPos);
      yPos += 6;
    });

    yPos += 8;

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Yearly Cash Flow Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Yearly Cash Flow (First 10 Years)', margin, yPos);
    yPos += 10;

    // Table headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(26, 54, 93);

    const headers = ['Year', 'Gen (MWh)', 'Revenue', 'Opex', 'Cash Flow'];
    const colWidths = [18, 22, 28, 28, 28];
    let xPos = margin;

    headers.forEach((header, i) => {
      doc.rect(xPos, yPos, colWidths[i], 7, 'F');
      doc.text(header, xPos + 1, yPos + 5);
      xPos += colWidths[i];
    });
    yPos += 7;

    // Table data
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);

    results.yearlyData.slice(0, 10).forEach((year) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
      }

      xPos = margin;
      const rowData = [
        year.year.toString(),
        (year.generation || 0).toFixed(0),
        formatCurrency(year.revenue || 0),
        formatCurrency(year.opex || 0),
        formatCurrency(year.cashFlow || 0)
      ];

      rowData.forEach((cell, i) => {
        doc.rect(xPos, yPos, colWidths[i], 6, 'S');
        doc.text(cell, xPos + 1, yPos + 4);
        xPos += colWidths[i];
      });
      yPos += 6;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Indicative projections. Not for investment decisions without professional verification.', margin, pageHeight - 10);

    // Save the PDF
    doc.save(`${projectName || 'Solar Model'}-report.pdf`);
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}
