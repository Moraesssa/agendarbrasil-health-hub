/**
 * Enhanced Email Notification Service with Location Details
 * Handles appointment confirmations, reminders, and cancellations with comprehensive location information
 * replaced by kiro @2025-02-08T19:50:00Z
 */

import { supabase } from '@/lib/supabase';
import type { EnhancedLocation, LocationFacility } from '@/types/location';

export interface AppointmentEmailData {
  id: string;
  data_consulta: string;
  tipo_consulta: string;
  status: string;
  motivo?: string;
  local_consulta?: string;
  location_id?: string;
  patient_profile?: {
    id: string;
    email: string;
    display_name: string;
    telefone?: string;
  };
  doctor_profile?: {
    id: string;
    email: string;
    display_name: string;
    especialidade?: string;
  };
  enhanced_location?: EnhancedLocation;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Get enhanced appointment data with location details
   */
  async getEnhancedAppointmentData(appointmentId: string): Promise<AppointmentEmailData | null> {
    try {
      // Fetch appointment with patient and doctor profiles
      const { data: appointment, error: appointmentError } = await supabase
        .from('consultas')
        .select(`
          *,
          patient_profile:profiles!consultas_paciente_id_fkey (
            id,
            email,
            display_name,
            telefone
          ),
          doctor_profile:profiles!consultas_medico_id_fkey (
            id,
            email,
            display_name,
            especialidade
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        console.error('Erro ao buscar consulta:', appointmentError);
        return null;
      }

      // If appointment has a location_id, fetch enhanced location data
      let enhancedLocation: EnhancedLocation | undefined;
      if (appointment.location_id) {
        const { data: locationData, error: locationError } = await supabase
          .from('locais_atendimento')
          .select('*')
          .eq('id', appointment.location_id)
          .single();

        if (!locationError && locationData) {
          enhancedLocation = {
            id: locationData.id,
            nome_local: locationData.nome_local,
            endereco: locationData.endereco,
            endereco_completo: locationData.endereco_completo || locationData.endereco,
            bairro: locationData.bairro,
            cidade: locationData.cidade,
            estado: locationData.estado,
            cep: locationData.cep,
            telefone: locationData.telefone,
            whatsapp: locationData.whatsapp,
            email: locationData.email,
            website: locationData.website,
            coordenadas: locationData.coordenadas,
            horario_funcionamento: locationData.horario_funcionamento,
            facilidades: locationData.facilidades || [],
            status: locationData.status || 'ativo',
            motivo_fechamento: locationData.motivo_fechamento,
            previsao_reabertura: locationData.previsao_reabertura,
            descricao: locationData.descricao,
            instrucoes_acesso: locationData.instrucoes_acesso,
            observacoes_especiais: locationData.observacoes_especiais,
            ultima_atualizacao: locationData.ultima_atualizacao,
            verificado_em: locationData.verificado_em,
            fonte_dados: locationData.fonte_dados || 'manual',
            medico_id: locationData.medico_id,
            ativo: locationData.ativo
          };
        }
      }

      return {
        ...appointment,
        enhanced_location: enhancedLocation
      };

    } catch (error) {
      console.error('Erro ao buscar dados da consulta:', error);
      return null;
    }
  }  
/**
   * Generate location details HTML for email templates
   */
  private generateLocationDetailsHTML(location: EnhancedLocation): string {
    const facilitiesHTML = this.generateFacilitiesHTML(location.facilidades);
    const operatingHoursHTML = this.generateOperatingHoursHTML(location.horario_funcionamento);
    const contactHTML = this.generateContactHTML(location);
    const directionsHTML = this.generateDirectionsHTML(location);

    return `
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">📍 Informações do Local</h3>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">${location.nome_local}</h4>
          <p style="margin: 5px 0; color: #475569;">
            <strong>📍 Endereço:</strong> ${location.endereco_completo || location.endereco}
          </p>
          ${location.bairro ? `<p style="margin: 5px 0; color: #475569;"><strong>🏘️ Bairro:</strong> ${location.bairro}</p>` : ''}
          ${location.cidade && location.estado ? `<p style="margin: 5px 0; color: #475569;"><strong>🌆 Cidade:</strong> ${location.cidade}, ${location.estado}</p>` : ''}
          ${location.cep ? `<p style="margin: 5px 0; color: #475569;"><strong>📮 CEP:</strong> ${location.cep}</p>` : ''}
        </div>

        ${contactHTML}
        ${operatingHoursHTML}
        ${facilitiesHTML}
        ${directionsHTML}
        
        ${location.instrucoes_acesso ? `
          <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>ℹ️ Instruções de Acesso:</strong><br>
              ${location.instrucoes_acesso}
            </p>
          </div>
        ` : ''}

        ${location.observacoes_especiais ? `
          <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📝 Observações Especiais:</strong><br>
              ${location.observacoes_especiais}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate contact information HTML
   */
  private generateContactHTML(location: EnhancedLocation): string {
    const contacts = [];
    
    if (location.telefone) {
      contacts.push(`<strong>📞 Telefone:</strong> <a href="tel:${location.telefone}" style="color: #3b82f6; text-decoration: none;">${location.telefone}</a>`);
    }
    
    if (location.whatsapp) {
      contacts.push(`<strong>📱 WhatsApp:</strong> <a href="https://wa.me/${location.whatsapp.replace(/\D/g, '')}" style="color: #10b981; text-decoration: none;">${location.whatsapp}</a>`);
    }
    
    if (location.email) {
      contacts.push(`<strong>📧 Email:</strong> <a href="mailto:${location.email}" style="color: #3b82f6; text-decoration: none;">${location.email}</a>`);
    }
    
    if (location.website) {
      contacts.push(`<strong>🌐 Website:</strong> <a href="${location.website}" style="color: #3b82f6; text-decoration: none;" target="_blank">Visitar site</a>`);
    }

    if (contacts.length === 0) return '';

    return `
      <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">📞 Contato</h4>
        ${contacts.map(contact => `<p style="margin: 5px 0; color: #475569;">${contact}</p>`).join('')}
      </div>
    `;
  }

  /**
   * Generate operating hours HTML
   */
  private generateOperatingHoursHTML(horario_funcionamento: any): string {
    if (!horario_funcionamento || typeof horario_funcionamento !== 'object') {
      return '';
    }

    const dayNames = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };

    const hoursHTML = Object.entries(dayNames).map(([key, dayName]) => {
      const hours = horario_funcionamento[key];
      if (!hours) return '';
      
      if (hours === 'fechado' || hours === 'closed') {
        return `<p style="margin: 3px 0; color: #64748b; font-size: 14px;"><strong>${dayName}:</strong> Fechado</p>`;
      }
      
      return `<p style="margin: 3px 0; color: #475569; font-size: 14px;"><strong>${dayName}:</strong> ${hours}</p>`;
    }).filter(Boolean);

    if (hoursHTML.length === 0) return '';

    return `
      <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">🕒 Horário de Funcionamento</h4>
        ${hoursHTML.join('')}
      </div>
    `;
  }  /*
*
   * Generate facilities HTML
   */
  private generateFacilitiesHTML(facilidades: LocationFacility[]): string {
    if (!facilidades || facilidades.length === 0) return '';

    const facilityIcons = {
      estacionamento: '🅿️',
      acessibilidade: '♿',
      farmacia: '💊',
      laboratorio: '🔬',
      wifi: '📶',
      ar_condicionado: '❄️',
      elevador: '🛗',
      cafe: '☕',
      banheiro_adaptado: '🚻',
      sala_espera_criancas: '🧸'
    };

    const facilityNames = {
      estacionamento: 'Estacionamento',
      acessibilidade: 'Acessibilidade',
      farmacia: 'Farmácia',
      laboratorio: 'Laboratório',
      wifi: 'Wi-Fi',
      ar_condicionado: 'Ar Condicionado',
      elevador: 'Elevador',
      cafe: 'Café/Lanchonete',
      banheiro_adaptado: 'Banheiro Adaptado',
      sala_espera_criancas: 'Sala de Espera Infantil'
    };

    const availableFacilities = facilidades
      .filter(facility => facility.available)
      .map(facility => {
        const icon = facilityIcons[facility.type as keyof typeof facilityIcons] || '✅';
        const name = facilityNames[facility.type as keyof typeof facilityNames] || facility.type;
        const cost = facility.cost === 'pago' ? ' (Pago)' : facility.cost === 'gratuito' ? ' (Gratuito)' : '';
        
        return `<span style="display: inline-block; background: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${icon} ${name}${cost}</span>`;
      });

    if (availableFacilities.length === 0) return '';

    return `
      <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">🏢 Facilidades Disponíveis</h4>
        <div style="line-height: 1.6;">
          ${availableFacilities.join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate directions and maps HTML
   */
  private generateDirectionsHTML(location: EnhancedLocation): string {
    if (!location.coordenadas || !location.coordenadas.lat || !location.coordenadas.lng) {
      return '';
    }

    const { lat, lng } = location.coordenadas;
    const address = encodeURIComponent(location.endereco_completo || location.endereco);
    
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    const appleMapsUrl = `https://maps.apple.com/?q=${address}&ll=${lat},${lng}`;

    return `
      <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">🗺️ Como Chegar</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <a href="${googleMapsUrl}" target="_blank" style="background: #4285f4; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; display: inline-block;">📍 Google Maps</a>
          <a href="${wazeUrl}" target="_blank" style="background: #00d4ff; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; display: inline-block;">🚗 Waze</a>
          <a href="${appleMapsUrl}" target="_blank" style="background: #007aff; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; display: inline-block;">🍎 Apple Maps</a>
        </div>
      </div>
    `;
  }  /**

   * Generate appointment confirmation email template
   */
  generateConfirmationEmail(appointmentData: AppointmentEmailData): EmailTemplate {
    const appointmentDate = new Date(appointmentData.data_consulta);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const locationHTML = appointmentData.enhanced_location 
      ? this.generateLocationDetailsHTML(appointmentData.enhanced_location)
      : appointmentData.local_consulta 
        ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📍 Local:</strong> ${appointmentData.local_consulta}</p>`
        : '';

    const subject = `✅ Consulta Confirmada - ${formattedDate} às ${formattedTime}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Consulta Confirmada!</h1>
        </div>
        
        <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointmentData.patient_profile?.display_name || 'Paciente'}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Sua consulta foi confirmada com sucesso! Aqui estão todos os detalhes:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
            <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointmentData.doctor_profile?.display_name || 'Não informado'}</p>
            ${appointmentData.doctor_profile?.especialidade ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🩺 Especialidade:</strong> ${appointmentData.doctor_profile.especialidade}</p>` : ''}
            <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🏥 Tipo:</strong> ${appointmentData.tipo_consulta || 'Consulta geral'}</p>
            ${appointmentData.motivo ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📝 Motivo:</strong> ${appointmentData.motivo}</p>` : ''}
          </div>
        </div>

        ${locationHTML}
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⚠️ <strong>Importante:</strong> Chegue com 15 minutos de antecedência e traga seus documentos, cartão do convênio e exames anteriores.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px;">
            Em caso de dúvidas ou necessidade de reagendamento, entre em contato conosco.
          </p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            AgendarBrasil - Cuidando da sua saúde com excelência
          </p>
        </div>
      </div>
    `;

    const text = `
CONSULTA CONFIRMADA!

Olá, ${appointmentData.patient_profile?.display_name || 'Paciente'}!

Sua consulta foi confirmada com sucesso:

📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
👨‍⚕️ Médico: ${appointmentData.doctor_profile?.display_name || 'Não informado'}
🏥 Tipo: ${appointmentData.tipo_consulta || 'Consulta geral'}
${appointmentData.motivo ? `📝 Motivo: ${appointmentData.motivo}` : ''}

${appointmentData.enhanced_location ? `
INFORMAÇÕES DO LOCAL:
📍 ${appointmentData.enhanced_location.nome_local}
🏠 ${appointmentData.enhanced_location.endereco_completo || appointmentData.enhanced_location.endereco}
${appointmentData.enhanced_location.telefone ? `📞 ${appointmentData.enhanced_location.telefone}` : ''}
${appointmentData.enhanced_location.whatsapp ? `📱 ${appointmentData.enhanced_location.whatsapp}` : ''}
` : appointmentData.local_consulta ? `📍 Local: ${appointmentData.local_consulta}` : ''}

⚠️ IMPORTANTE: Chegue com 15 minutos de antecedência e traga seus documentos, cartão do convênio e exames anteriores.

AgendarBrasil - Cuidando da sua saúde com excelência
    `;

    return { subject, html, text };
  }

  /**
   * Send appointment confirmation email
   */
  async sendConfirmationEmail(appointmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-enhanced-email', {
        body: {
          appointmentId,
          emailType: 'confirmation',
          recipientType: 'patient'
        }
      });

      if (error) {
        console.error('Erro ao enviar email de confirmação:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no serviço de email de confirmação:', error);
      return false;
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendReminderEmail(appointmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-enhanced-email', {
        body: {
          appointmentId,
          emailType: 'reminder',
          recipientType: 'patient'
        }
      });

      if (error) {
        console.error('Erro ao enviar email de lembrete:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no serviço de email de lembrete:', error);
      return false;
    }
  }

  /**
   * Send appointment cancellation email
   */
  async sendCancellationEmail(appointmentId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-enhanced-email', {
        body: {
          appointmentId,
          emailType: 'cancellation',
          recipientType: 'patient',
          cancellationReason: reason
        }
      });

      if (error) {
        console.error('Erro ao enviar email de cancelamento:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no serviço de email de cancelamento:', error);
      return false;
    }
  }

  /**
   * Send location change notification email
   */
  async sendLocationChangeEmail(appointmentId: string, oldLocationName?: string, newLocationName?: string): Promise<boolean> {
    try {
      const appointmentData = await this.getEnhancedAppointmentData(appointmentId);
      if (!appointmentData || !appointmentData.patient_profile?.email) {
        console.error('Dados da consulta ou email do paciente não encontrados');
        return false;
      }

      const appointmentDate = new Date(appointmentData.data_consulta);
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const locationHTML = appointmentData.enhanced_location 
        ? this.generateLocationDetailsHTML(appointmentData.enhanced_location)
        : '';

      const subject = `📍 Alteração de Local - Consulta ${formattedDate} às ${formattedTime}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #3b82f6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📍 Alteração de Local</h1>
          </div>
          
          <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointmentData.patient_profile?.display_name || 'Paciente'}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Informamos que houve uma alteração no local da sua consulta:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointmentData.doctor_profile?.display_name || 'Não informado'}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🏥 Tipo:</strong> ${appointmentData.tipo_consulta || 'Consulta geral'}</p>
              ${oldLocationName ? `<p style="margin: 10px 0 0 0; color: #ef4444;"><strong>📍 Local Anterior:</strong> ${oldLocationName}</p>` : ''}
              ${newLocationName ? `<p style="margin: 10px 0 0 0; color: #10b981;"><strong>📍 Novo Local:</strong> ${newLocationName}</p>` : ''}
            </div>
          </div>

          ${locationHTML}
          
          <div style="background: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              ⚠️ <strong>Atenção:</strong> Verifique o novo endereço e planeje sua rota com antecedência.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              Em caso de dúvidas sobre o novo local, entre em contato conosco.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              AgendarBrasil - Cuidando da sua saúde
            </p>
          </div>
        </div>
      `;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: appointmentData.patient_profile.email,
          subject: subject,
          html: html
        }
      });

      if (error) {
        console.error('Erro ao enviar email de alteração de local:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro no serviço de email de alteração de local:', error);
      return false;
    }
  }
}

export const emailNotificationService = EmailNotificationService.getInstance();