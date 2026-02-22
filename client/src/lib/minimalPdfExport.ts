import { jsPDF } from 'jspdf';
import { SolarInputs, SolarResults } from './calculator';
import { formatCurrency } from './formatters';

export function exportMinimalPDF(
  projectName: string,
  inputs: SolarInputs,
  results: SolarResults
) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    const margin = 10;
    const lineHeight = 5;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Solar Project Report', margin, yPos);
    yPos += 10;

    // Project name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Project: ${projectName}`, margin, yPos);
    yPos += 8;

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 10;

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Key Metrics Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Metrics', margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const metrics = [
      ['Total CAPEX:', formatCurrency(results.summary.totalCapex)],
      ['Total OPEX:', formatCurrency(results.summary.totalOpex)],
      ['Total Generation:', `${results.summary.totalGeneration.toFixed(0)} MWh`],
      ['Total Revenue:', formatCurrency(results.summary.totalRevenue)],
      ['LCOE:', `£${results.summary.lcoe.toFixed(0)}/MWh`],
      ['IRR:', `${results.summary.irr.toFixed(2)}%`],
      ['Payback Period:', results.summary.paybackPeriod > 100 ? '> Project Life' : `${results.summary.paybackPeriod.toFixed(1)} years`],
      ['NPV:', formatCurrency(results.summary.totalDiscountedCashFlow)],
    ];

    metrics.forEach(([label, value]) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }
      doc.text(label, margin, yPos);
      doc.text(value, margin + 60, yPos);
      yPos += lineHeight;
    });

    yPos += 5;

    // Stakeholder Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Stakeholder Value', margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const stakeholders = [
      ['Offtaker Savings:', formatCurrency(results.summary.totalSavings)],
      ['Landowner Income:', formatCurrency(results.summary.totalLandOptionIncome)],
      ['Developer Premium:', formatCurrency(results.summary.totalDeveloperPremium)],
    ];

    stakeholders.forEach(([label, value]) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }
      doc.text(label, margin, yPos);
      doc.text(value, margin + 60, yPos);
      yPos += lineHeight;
    });

    yPos += 5;

    // Input Parameters
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Parameters', margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const params = [
      ['Capacity:', `${inputs.mw} MW`],
      ['Project Life:', `${inputs.projectLife} years`],
      ['EPC Cost/MW:', formatCurrency(inputs.capexPerMW)],
      ['Private Wire Cost:', formatCurrency(inputs.privateWireCost)],
      ['Grid Connection:', formatCurrency(inputs.gridConnectionCost)],
      ['Opex/MW/year:', formatCurrency(inputs.opexPerMW)],
      ['PPA Price:', `£${inputs.powerPrice}/MWh`],
      ['Discount Rate:', `${inputs.discountRate}%`],
    ];

    params.forEach(([label, value]) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }
      doc.text(label, margin, yPos);
      doc.text(value, margin + 60, yPos);
      yPos += lineHeight;
    });

    // Footer
    if (yPos < pageHeight - 10) {
      yPos = pageHeight - 10;
    }
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Indicative projections. Not for investment decisions without professional verification.', margin, yPos);

    // Save
    doc.save(`${projectName}-report.pdf`);
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}
