
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { MedicalCertificate, PDFGenerationOptions } from '@/types/certificates';
import { PrescriptionWithRenewals } from '@/types/prescription';
import { logger } from '@/utils/logger';

export const pdfService = {
  // Generate PDF for prescription
  async generatePrescriptionPDF(prescription: PrescriptionWithRenewals, options?: PDFGenerationOptions): Promise<Blob> {
    logger.info("Generating prescription PDF", "PDFService", { id: prescription.id });
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEITA MÉDICA', pageWidth / 2, 30, { align: 'center' });
      
      // Prescription number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const prescriptionNumber = prescription.prescription_number || `RX-${prescription.id.slice(-8)}`;
      doc.text(`Receita Nº: ${prescriptionNumber}`, pageWidth - 20, 20, { align: 'right' });
      
      // Doctor info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Dr. ${prescription.doctor_name || 'Médico'}`, 20, 50);
      
      // Patient info
      doc.setFont('helvetica', 'normal');
      doc.text(`Paciente: ${prescription.patient_name || 'Paciente'}`, 20, 65);
      
      // Prescription date
      doc.text(`Data da Prescrição: ${new Date(prescription.prescribed_date).toLocaleDateString('pt-BR')}`, 20, 75);
      
      // Valid until
      if (prescription.valid_until) {
        doc.text(`Válida até: ${new Date(prescription.valid_until).toLocaleDateString('pt-BR')}`, 20, 85);
      }
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 95, pageWidth - 20, 95);
      
      // Medication details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Medicamento:', 20, 110);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(prescription.medication_name, 20, 125);
      
      doc.text(`Dosagem: ${prescription.dosage}`, 20, 140);
      doc.text(`Frequência: ${prescription.frequency}`, 20, 155);
      
      if (prescription.duration_days) {
        doc.text(`Duração: ${prescription.duration_days} dias`, 20, 170);
      }
      
      // Instructions
      if (prescription.instructions) {
        doc.setFont('helvetica', 'bold');
        doc.text('Instruções:', 20, 190);
        doc.setFont('helvetica', 'normal');
        
        const instructionsLines = doc.splitTextToSize(prescription.instructions, pageWidth - 40);
        doc.text(instructionsLines, 20, 205);
      }
      
      // QR Code for validation
      if (prescription.validation_hash && options?.includeQRCode !== false) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(prescription.validation_hash, {
            width: 100,
            margin: 1
          });
          
          doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 80, pageHeight - 80, 60, 60);
          doc.setFontSize(8);
          doc.text('Código de Validação', pageWidth - 80, pageHeight - 15, { align: 'left' });
        } catch (error) {
          logger.error("Error generating QR code", "PDFService", error);
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 10);
      
      return new Blob([doc.output('blob')], { type: 'application/pdf' });
    } catch (error) {
      logger.error("Error generating prescription PDF", "PDFService", error);
      throw new Error("Erro ao gerar PDF da receita");
    }
  },

  // Generate PDF for certificate
  async generateCertificatePDF(certificate: MedicalCertificate, options?: PDFGenerationOptions): Promise<Blob> {
    logger.info("Generating certificate PDF", "PDFService", { id: certificate.id });
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ATESTADO MÉDICO', pageWidth / 2, 30, { align: 'center' });
      
      // Certificate number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Certificado Nº: ${certificate.certificate_number}`, pageWidth - 20, 20, { align: 'right' });
      
      // Doctor info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Dr. ${certificate.doctor_name || 'Médico'}`, 20, 50);
      
      // Patient info
      doc.setFont('helvetica', 'normal');
      doc.text(`Paciente: ${certificate.patient_name || 'Paciente'}`, 20, 65);
      
      // Certificate date
      doc.text(`Data de Emissão: ${new Date(certificate.created_at).toLocaleDateString('pt-BR')}`, 20, 75);
      
      // Period if applicable
      if (certificate.start_date && certificate.end_date) {
        doc.text(`Período: ${new Date(certificate.start_date).toLocaleDateString('pt-BR')} a ${new Date(certificate.end_date).toLocaleDateString('pt-BR')}`, 20, 85);
      }
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 95, pageWidth - 20, 95);
      
      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(certificate.title, 20, 110);
      
      // Content
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(certificate.content, pageWidth - 40);
      doc.text(contentLines, 20, 130);
      
      // Diagnosis
      if (certificate.diagnosis) {
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnóstico:', 20, 180);
        doc.setFont('helvetica', 'normal');
        const diagnosisLines = doc.splitTextToSize(certificate.diagnosis, pageWidth - 40);
        doc.text(diagnosisLines, 20, 195);
      }
      
      // Recommendations
      if (certificate.recommendations) {
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendações:', 20, 220);
        doc.setFont('helvetica', 'normal');
        const recommendationsLines = doc.splitTextToSize(certificate.recommendations, pageWidth - 40);
        doc.text(recommendationsLines, 20, 235);
      }
      
      // QR Code for validation
      if (options?.includeQRCode !== false) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(certificate.validation_hash, {
            width: 100,
            margin: 1
          });
          
          doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 80, pageHeight - 80, 60, 60);
          doc.setFontSize(8);
          doc.text('Código de Validação', pageWidth - 80, pageHeight - 15, { align: 'left' });
        } catch (error) {
          logger.error("Error generating QR code", "PDFService", error);
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 10);
      
      return new Blob([doc.output('blob')], { type: 'application/pdf' });
    } catch (error) {
      logger.error("Error generating certificate PDF", "PDFService", error);
      throw new Error("Erro ao gerar PDF do atestado");
    }
  },

  // Download PDF blob
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
