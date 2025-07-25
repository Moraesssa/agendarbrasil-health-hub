
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { MedicalCertificate } from '@/types/certificates';
import { MedicalPrescription } from '@/types/prescription';
import { PDFGenerationOptions } from '@/types/certificates';

export const pdfService = {
  // Generate PDF for prescription
  async generatePrescriptionPDF(prescription: MedicalPrescription, options: PDFGenerationOptions = {}): Promise<Blob> {
    const doc = new jsPDF();
    const { includeQRCode = true, fontSize = 12, margin = 20 } = options;

    // Header
    doc.setFontSize(16);
    doc.text('RECEITA MÉDICA', margin, margin);
    
    // Prescription number
    doc.setFontSize(10);
    doc.text(`Receita Nº: ${prescription.prescription_number || 'N/A'}`, margin, margin + 10);
    
    // Doctor info
    doc.setFontSize(12);
    doc.text(`Médico: ${prescription.doctor_name || 'N/A'}`, margin, margin + 25);
    
    // Patient info
    doc.text(`Paciente: ${prescription.patient_name || 'N/A'}`, margin, margin + 35);
    
    // Date
    doc.text(`Data: ${new Date(prescription.prescribed_date).toLocaleDateString('pt-BR')}`, margin, margin + 45);
    
    // Prescription content
    doc.setFontSize(14);
    doc.text('PRESCRIÇÃO:', margin, margin + 60);
    
    doc.setFontSize(12);
    doc.text(`Medicamento: ${prescription.medication_name}`, margin, margin + 75);
    doc.text(`Dosagem: ${prescription.dosage}`, margin, margin + 85);
    doc.text(`Frequência: ${prescription.frequency}`, margin, margin + 95);
    
    if (prescription.instructions) {
      doc.text('Instruções:', margin, margin + 110);
      const instructionLines = doc.splitTextToSize(prescription.instructions, 170);
      doc.text(instructionLines, margin, margin + 120);
    }
    
    // Validity
    if (prescription.valid_until) {
      doc.text(`Válida até: ${new Date(prescription.valid_until).toLocaleDateString('pt-BR')}`, margin, margin + 150);
    }
    
    // QR Code for validation
    if (includeQRCode && prescription.validation_hash) {
      const qrCodeDataUrl = await QRCode.toDataURL(
        `${window.location.origin}/validar/${prescription.validation_hash}`,
        { width: 100, margin: 1 }
      );
      doc.addImage(qrCodeDataUrl, 'PNG', margin + 120, margin + 160, 30, 30);
      doc.setFontSize(8);
      doc.text('Código de validação', margin + 120, margin + 195);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Este documento foi gerado eletronicamente e possui validade legal.', margin, 280);
    
    return doc.output('blob');
  },

  // Generate PDF for certificate
  async generateCertificatePDF(certificate: MedicalCertificate, options: PDFGenerationOptions = {}): Promise<Blob> {
    const doc = new jsPDF();
    const { includeQRCode = true, fontSize = 12, margin = 20 } = options;

    // Header
    doc.setFontSize(16);
    doc.text('ATESTADO MÉDICO', margin, margin);
    
    // Certificate number
    doc.setFontSize(10);
    doc.text(`Atestado Nº: ${certificate.certificate_number}`, margin, margin + 10);
    
    // Doctor info
    doc.setFontSize(12);
    doc.text(`Médico: ${certificate.doctor_name || 'N/A'}`, margin, margin + 25);
    
    // Patient info
    doc.text(`Paciente: ${certificate.patient_name || 'N/A'}`, margin, margin + 35);
    
    // Date
    doc.text(`Data: ${new Date(certificate.created_at).toLocaleDateString('pt-BR')}`, margin, margin + 45);
    
    // Certificate type
    const typeMap = {
      'medical_leave': 'Atestado de Afastamento',
      'fitness_certificate': 'Atestado de Aptidão',
      'vaccination_certificate': 'Atestado de Vacinação',
      'medical_report': 'Relatório Médico'
    };
    
    doc.setFontSize(14);
    doc.text(`Tipo: ${typeMap[certificate.certificate_type]}`, margin, margin + 60);
    
    // Title
    doc.setFontSize(16);
    doc.text(certificate.title, margin, margin + 80);
    
    // Content
    doc.setFontSize(12);
    const contentLines = doc.splitTextToSize(certificate.content, 170);
    doc.text(contentLines, margin, margin + 100);
    
    // Dates
    let currentY = margin + 100 + (contentLines.length * 5) + 20;
    
    if (certificate.start_date && certificate.end_date) {
      doc.text(`Período: ${new Date(certificate.start_date).toLocaleDateString('pt-BR')} a ${new Date(certificate.end_date).toLocaleDateString('pt-BR')}`, margin, currentY);
      currentY += 15;
    }
    
    // Diagnosis
    if (certificate.diagnosis) {
      doc.text('Diagnóstico:', margin, currentY);
      const diagnosisLines = doc.splitTextToSize(certificate.diagnosis, 170);
      doc.text(diagnosisLines, margin, currentY + 10);
      currentY += 10 + (diagnosisLines.length * 5) + 10;
    }
    
    // Recommendations
    if (certificate.recommendations) {
      doc.text('Recomendações:', margin, currentY);
      const recommendationLines = doc.splitTextToSize(certificate.recommendations, 170);
      doc.text(recommendationLines, margin, currentY + 10);
      currentY += 10 + (recommendationLines.length * 5) + 10;
    }
    
    // QR Code for validation
    if (includeQRCode && certificate.validation_hash) {
      const qrCodeDataUrl = await QRCode.toDataURL(
        `${window.location.origin}/validar/${certificate.validation_hash}`,
        { width: 100, margin: 1 }
      );
      doc.addImage(qrCodeDataUrl, 'PNG', margin + 120, currentY, 30, 30);
      doc.setFontSize(8);
      doc.text('Código de validação', margin + 120, currentY + 35);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Este documento foi gerado eletronicamente e possui validade legal.', margin, 280);
    
    return doc.output('blob');
  },

  // Download PDF
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
