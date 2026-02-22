import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportDashboardPDF(projectName: string) {
  try {
    // Get the main dashboard container
    const element = document.querySelector('#root');
    if (!element) {
      throw new Error('Dashboard element not found');
    }

    // Capture the dashboard as an image
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 1,
      useCORS: true,
      allowTaint: true,
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // Add image to PDF, splitting across pages if needed
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    // Save the PDF
    pdf.save(`${projectName || 'Solar Model'}-dashboard.pdf`);
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}
