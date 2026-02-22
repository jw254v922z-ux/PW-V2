import { jsPDF } from 'jspdf';
import { SolarInputs, SolarResults } from './calculator';
import { formatCurrency } from './formatters';

export function exportSimplePDFNoMap(projectName: string, inputs: SolarInputs, results: SolarResults) {
  try {
    console.log('[PDF] Starting PDF export for:', projectName);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Solar Project Report', margin, yPos);
    yPos += 15;

    // Project Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Project: ${projectName}`, margin, yPos);
    yPos += 8;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPos);
    yPos += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Key Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Financial Metrics', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const metrics = [
      ['Total CAPEX', formatCurrency(results.summary.totalCapex)],
      ['Total OPEX', formatCurrency(results.summary.totalOpex)],
      ['Total Generation', `${results.summary.totalGeneration.toFixed(0)} MWh`],
      ['Total Revenue', formatCurrency(results.summary.totalRevenue)],
      ['LCOE', `£${results.summary.lcoe.toFixed(0)}/MWh`],
      ['IRR', `${(results.summary.irr * 100).toFixed(2)}%`],
      ['Payback Period', results.summary.paybackPeriod > inputs.projectLife ? '> Project Life' : `${results.summary.paybackPeriod.toFixed(1)} years`],
      ['Total NPV', formatCurrency(results.summary.totalDiscountedCashFlow)]
    ];

    metrics.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Stakeholder Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Stakeholder Value', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const stakeholders = [
      ['Yearly Savings', formatCurrency(results.summary.yearlySavings)],
      ['Total Savings', formatCurrency(results.summary.totalSavings)],
      ['Yearly Rental Income', formatCurrency(results.summary.yearlyRentalIncome)],
      ['Total Rental Income', formatCurrency(results.summary.totalLandOptionIncome)],
      ['Developer Premium', formatCurrency(results.summary.totalDeveloperPremium)]
    ];

    stakeholders.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Cable Parameters
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('Cable Parameters', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const cableParams = [
      ['Cable Voltage', `${inputs.cableVoltageKV || 'N/A'} kV`],
      ['Cable Distance', `${inputs.distanceKm || 'N/A'} km`]
    ];

    cableParams.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPos);
      yPos += 6;
    });

    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report is indicative and based on Jan 2026 data. Not for investment decisions without professional verification.', margin, yPos);

    // Save
    console.log('[PDF] Saving PDF as:', `${projectName}-solar-report.pdf`);
    doc.save(`${projectName}-solar-report.pdf`);
    console.log('[PDF] PDF saved successfully');
  } catch (error) {
    console.error('[PDF] Export failed:', error);
    throw error;
  }
}
