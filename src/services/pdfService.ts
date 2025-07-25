
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { MedicalCertificate } from '@/types/certificates';
import { MedicalPrescription } from '@/types/prescription';
import { PDFGenerationOptions } from '@/types/certificates';

export const pdfService = {
  // Generate PDF for medical certificate
  async generateCertificatePDF(certificate: MedicalCertificate, options: PDFGenerationOptions = {}): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = options.margin || 20;
    const fontSize = options.fontSize || 12;
    
    // Header
    doc.setFontSize(16);
    doc.text('ATESTADO MÉDICO', pageWidth / 2, 30, { align: 'center' });
    
    // Certificate number
    doc.setFontSize(10);
    doc.text(`Certificado Nº: ${certificate.certificate_number}`, margin, 50);
    
    // Doctor info
    doc.setFontSize(fontSize);
    doc.text(`Dr(a). ${certificate.doctor_name}`, margin, 70);
    
    // Patient info
    doc.text(`Paciente: ${certificate.patient_name}`, margin, 85);
    
    // Certificate type
    const typeLabels = {
      'medical_leave': 'Atestado de Afastamento',
      'fitness_certificate': 'Atestado de Aptidão',
      'vaccination_certificate': 'Atestado de Vacinação',
      'medical_report': 'Relatório Médico'
    };
    doc.text(`Tipo: ${typeLabels[certificate.certificate_type]}`, margin, 100);
    
    // Title
    doc.setFontSize(14);
    doc.text(certificate.title, margin, 120);
    
    // Content
    doc.setFontSize(fontSize);
    const contentLines = doc.splitTextToSize(certificate.content, pageWidth - 2 * margin);
    doc.text(contentLines, margin, 140);
    
    let currentY = 140 + (contentLines.length * 7);
    
    // Period if exists
    if (certificate.start_date && certificate.end_date) {
      currentY += 15;
      doc.text(`Período: ${certificate.start_date} a ${certificate.end_date}`, margin, currentY);
    }
    
    // Diagnosis if exists
    if (certificate.diagnosis) {
      currentY += 15;
      doc.text('Diagnóstico:', margin, currentY);
      currentY += 10;
      const diagnosisLines = doc.splitTextToSize(certificate.diagnosis, pageWidth - 2 * margin);
      doc.text(diagnosisLines, margin, currentY);
      currentY += diagnosisLines.length * 7;
    }
    
    // Recommendations if exists
    if (certificate.recommendations) {
      currentY += 15;
      doc.text('Recomendações:', margin, currentY);
      currentY += 10;
      const recLines = doc.splitTextToSize(certificate.recommendations, pageWidth - 2 * margin);
      doc.text(recLines, margin, currentY);
      currentY += recLines.length * 7;
    }
    
    // Date
    currentY += 20;
    const issueDate = new Date(certificate.created_at).toLocaleDateString('pt-BR');
    doc.text(`Data de emissão: ${issueDate}`, margin, currentY);
    
    // QR Code for validation
    if (options.includeQRCode !== false) {
      try {
        const qrCodeUrl = `${window.location.origin}/validar-documento/${certificate.validation_hash}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, { width: 100 });
        doc.addImage(qrCodeDataURL, 'PNG', pageWidth - 50, currentY + 20, 30, 30);
        
        doc.setFontSize(8);
        doc.text('Código de Validação:', pageWidth - 50, currentY + 55);
        doc.text(certificate.validation_hash.substring(0, 16) + '...', pageWidth - 50, currentY + 65);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Este documento foi gerado eletronicamente e possui validade legal.', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    
    return doc.output('blob');
  },

  // Generate PDF for prescription
  async generatePrescriptionPDF(prescription: MedicalPrescription, options: PDFGenerationOptions = {}): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = options.margin || 20;
    const fontSize = options.fontSize || 12;
    
    // Header
    doc.setFontSize(16);
    doc.text('RECEITA MÉDICA', pageWidth / 2, 30, { align: 'center' });
    
    // Prescription number
    doc.setFontSize(10);
    doc.text(`Receita Nº: ${prescription.prescription_number || 'N/A'}`, margin, 50);
    
    // Doctor info
    doc.setFontSize(fontSize);
    doc.text(`Dr(a). ${prescription.doctor_name}`, margin, 70);
    
    // Patient info
    doc.text(`Paciente: ${prescription.patient_name}`, margin, 85);
    
    // Prescription date
    const prescriptionDate = new Date(prescription.prescribed_date).toLocaleDateString('pt-BR');
    doc.text(`Data: ${prescriptionDate}`, margin, 100);
    
    // Valid until
    if (prescription.valid_until) {
      const validUntil = new Date(prescription.valid_until).toLocaleDateString('pt-BR');
      doc.text(`Válida até: ${validUntil}`, margin, 115);
    }
    
    // Medication details
    doc.setFontSize(14);
    doc.text('MEDICAMENTO PRESCRITO:', margin, 140);
    
    doc.setFontSize(fontSize);
    doc.text(`Medicamento: ${prescription.medication_name}`, margin, 160);
    doc.text(`Dosagem: ${prescription.dosage}`, margin, 175);
    doc.text(`Frequência: ${prescription.frequency}`, margin, 190);
    
    if (prescription.duration_days) {
      doc.text(`Duração: ${prescription.duration_days} dias`, margin, 205);
    }
    
    // Instructions
    if (prescription.instructions) {
      doc.text('Instruções:', margin, 225);
      const instructionLines = doc.splitTextToSize(prescription.instructions, pageWidth - 2 * margin);
      doc.text(instructionLines, margin, 240);
    }
    
    // QR Code for validation
    if (options.includeQRCode !== false && prescription.validation_hash) {
      try {
        const qrCodeUrl = `${window.location.origin}/validar-documento/${prescription.validation_hash}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, { width: 100 });
        doc.addImage(qrCodeDataURL, 'PNG', pageWidth - 50, 160, 30, 30);
        
        doc.setFontSize(8);
        doc.text('Código de Validação:', pageWidth - 50, 200);
        doc.text(prescription.validation_hash.substring(0, 16) + '...', pageWidth - 50, 210);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Esta receita foi gerada eletronicamente e possui validade legal.', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    
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
  },

  // Print PDF
  async printPDF(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
    }
  }
};
