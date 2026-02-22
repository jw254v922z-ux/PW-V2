import { jsPDF } from "jspdf";

export function generateMinimalPDF() {
  try {
    console.log('Creating minimal PDF...');
    const doc = new jsPDF();
    
    console.log('Adding text...');
    doc.setFontSize(16);
    doc.text("Test PDF", 10, 10);
    
    console.log('Saving PDF...');
    doc.save("test-minimal.pdf");
    console.log('PDF saved successfully');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}
