import jsPDF from 'jspdf';
import { ProjectData } from '@shared/types';

/**
 * Generate a clean, professional PDF report with proper page layout
 * Page 1: Cover with metrics and disclaimer
 * Page 2: Site Location Map
 * Page 3+: Financial data
 */
export function generateCleanPDFReport(
  data: any,
  mapScreenshot?: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // ============ PAGE 1: COVER ============
  let yPos = margin;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(25, 55, 109); // Dark blue
  doc.text('Solar Project Analysis', margin, yPos);
  yPos += 12;

  // Project name
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Project: ${data.projectName || 'My Solar Model'}`, margin, yPos);
  yPos += 8;

  // Disclaimer box
  doc.setFillColor(255, 243, 205); // Light yellow
  doc.setDrawColor(200, 180, 100);
  doc.rect(margin, yPos, contentWidth, 45, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(139, 109, 0); // Dark yellow
  doc.setFont(undefined, 'bold');
  doc.text('Tool Limitations & Disclaimer', margin + 3, yPos + 4);
  
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  const disclaimerText = 'This calculator provides indicative financial projections based on industry assumptions and publicly available data sources. All data and assumptions are valid as of January 2026. Results are for indicative purposes only and should not be relied upon for investment decisions. Grid costs, irradiance data, and technology assumptions may vary significantly by location. Site-specific conditions (soil, access, environmental) are not accounted for. Results should not be relied upon for investment decisions without independent professional verification from qualified engineers, surveyors, and financial advisors.';
  doc.setFontSize(8);
  doc.text(disclaimerText, margin + 3, yPos + 8, { maxWidth: contentWidth - 6, align: 'left' });
  yPos += 50;

  // Metrics grid (3 columns x 2 rows)
  yPos += 5;
  const metricBoxWidth = (contentWidth - 6) / 3; // 3 columns with small gaps
  const metricBoxHeight = 22;
  const metrics = [
    { label: 'Total CAPEX', value: `£${(data.totalCapex || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` },
    { label: 'LCOE (Real)', value: `£${(data.lcoe || 0).toFixed(2)}/MWh` },
    { label: 'IRR (Unlevered)', value: `${(data.irr || 0).toFixed(2)}%` },
    { label: 'Payback Period', value: data.paybackPeriod || '> Project Life' },
    { label: 'Total NPV', value: `£${(data.totalNpv || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` },
    { label: 'Project Life', value: `${data.projectLife || 15} years` },
  ];

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * (metricBoxWidth + 3);
    const y = yPos + row * (metricBoxHeight + 3);

    // Draw box
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, metricBoxWidth, metricBoxHeight, 'FD');

    // Label
    doc.setFont(undefined, 'normal');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.text(metric.label, x + 2, y + 5);

    // Value
    doc.setFont(undefined, 'bold');
    doc.setTextColor(25, 55, 109);
    doc.setFontSize(11);
    doc.text(metric.value, x + 2, y + 14);
  });

  // ============ PAGE 2: SITE LOCATION MAP ============
  if (mapScreenshot) {
    doc.addPage();
    yPos = margin;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(25, 55, 109);
    doc.setFont(undefined, 'bold');
    doc.text('Site Location Map', margin, yPos);
    yPos += 10;

    // Add map image - full width, centered
    try {
      const mapWidth = contentWidth;
      const mapHeight = (contentWidth * 3) / 4; // 4:3 aspect ratio
      
      // Detect format from data URL
      const format = mapScreenshot.includes('data:image/jpeg') ? 'JPEG' : 'PNG';
      
      doc.addImage(mapScreenshot, format, margin, yPos, mapWidth, mapHeight);
      yPos += mapHeight + 5;

      // Site information
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont(undefined, 'normal');
      doc.text(`Site: ${data.projectName || 'My Solar Model'}`, margin, yPos);
      yPos += 5;
      doc.text(`Capacity: ${data.systemSize || 28} MW`, margin, yPos);
      yPos += 5;
      doc.text(`Project Life: ${data.projectLife || 15} years`, margin, yPos);
    } catch (error) {
      console.error('Error adding map image:', error);
      doc.setFontSize(12);
      doc.setTextColor(200, 0, 0);
      doc.text('Map image could not be loaded', margin, yPos);
    }
  }

  // ============ PAGE 3: STAKEHOLDER VALUE ============
  doc.addPage();
  yPos = margin;

  doc.setFontSize(16);
  doc.setTextColor(25, 55, 109);
  doc.setFont(undefined, 'bold');
  doc.text('Stakeholder Value Distribution', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  const stakeholders = [
    { name: 'Operator', value: data.operatorNpv || 0, color: [100, 100, 100] },
    { name: 'Offtaker', value: data.offtakerSavings || 0, color: [76, 175, 80] },
    { name: 'Landowner', value: data.landownerIncome || 0, color: [255, 193, 7] },
    { name: 'Developer', value: data.developerPremium || 0, color: [244, 67, 54] },
  ];

  stakeholders.forEach((stakeholder, index) => {
    const y = yPos + index * 8;
    doc.setTextColor(...stakeholder.color);
    doc.setFont(undefined, 'bold');
    doc.text(`${stakeholder.name}:`, margin, y);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'normal');
    doc.text(`£${stakeholder.value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`, margin + 50, y);
  });

  // ============ PAGE 4: FINANCIAL METRICS ============
  doc.addPage();
  yPos = margin;

  doc.setFontSize(16);
  doc.setTextColor(25, 55, 109);
  doc.setFont(undefined, 'bold');
  doc.text('Financial Metrics', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');

  const financialMetrics = [
    { label: 'Total CAPEX', value: `£${(data.totalCapex || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` },
    { label: 'Annual OPEX', value: `£${(data.annualOpex || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` },
    { label: 'LCOE (Real)', value: `£${(data.lcoe || 0).toFixed(2)}/MWh` },
    { label: 'IRR (Unlevered)', value: `${(data.irr || 0).toFixed(2)}%` },
    { label: 'Payback Period', value: data.paybackPeriod || '> Project Life' },
    { label: 'Total NPV', value: `£${(data.totalNpv || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` },
  ];

  financialMetrics.forEach((metric, index) => {
    const y = yPos + index * 8;
    doc.setFont(undefined, 'bold');
    doc.text(`${metric.label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(metric.value, margin + 60, y);
  });

  // ============ FOOTER ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      'Produced by Savills Earth',
      margin,
      pageHeight - 8
    );
  }

  // Save PDF
  doc.save('My Solar Model-report.pdf');
}
