/**
 * Communication Service
 * Handles phone calls, WhatsApp, SMS, email, and system-level sharing integrations
 * Provides unified interface for all communication methods with location data
 * Enhanced with comprehensive communication features for location details
 * replaced by kiro @2025-01-08T15:30:00Z
 */

import { EnhancedLocation } from '@/types/location';

export interface ShareLocationData {
  location: EnhancedLocation;
  appointmentDate?: string;
  appointmentTime?: string;
  doctorName?: string;
  specialty?: string;
  patientName?: string;
  additionalNotes?: string;
}

export interface CommunicationResult {
  success: boolean;
  error?: string;
  message?: string;
  provider?: string;
  fallbackUsed?: boolean;
}

export interface PhoneCallOptions {
  useWhatsApp?: boolean;
  fallbackToWhatsApp?: boolean;
  showConfirmation?: boolean;
}

export interface ShareOptions {
  includeDirections?: boolean;
  includeOperatingHours?: boolean;
  includeFacilities?: boolean;
  customMessage?: string;
  format?: 'simple' | 'detailed' | 'appointment';
}

/**
 * Serviço de comunicação para integração com telefone, WhatsApp, email, SMS e compartilhamento do sistema
 */
export class CommunicationService {
  /**
   * Inicia uma chamada telefônica para o local com opções avançadas
   */
  static async makePhoneCall(phoneNumber: string, options: PhoneCallOptions = {}): Promise<CommunicationResult> {
    try {
      // Remove caracteres não numéricos do telefone
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      if (!cleanPhone) {
        return {
          success: false,
          error: 'Número de telefone inválido'
        };
      }

      // Formata o número para exibição
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Verifica se é um ambiente móvel
      const isMobile = this.canMakePhoneCalls();
      
      if (isMobile) {
        // Tenta usar WhatsApp se solicitado
        if (options.useWhatsApp) {
          const whatsappResult = await this.openWhatsAppChat(cleanPhone);
          if (whatsappResult.success) {
            return whatsappResult;
          }
          
          // Se falhou e não tem fallback, retorna erro
          if (!options.fallbackToWhatsApp) {
            return whatsappResult;
          }
        }

        // Em dispositivos móveis, abre o discador
        try {
          window.location.href = `tel:${cleanPhone}`;
          return {
            success: true,
            message: `Abrindo discador para ${formattedPhone}`,
            provider: 'telefone'
          };
        } catch (error) {
          // Fallback para WhatsApp se disponível
          if (options.fallbackToWhatsApp) {
            return await this.openWhatsAppChat(cleanPhone);
          }
          throw error;
        }
      } else {
        // Em desktop, tenta diferentes abordagens
        const strategies = [
          () => {
            // Tenta abrir protocolo tel:
            window.location.href = `tel:${cleanPhone}`;
            return { success: true, message: `Tentando abrir aplicativo de telefone para ${formattedPhone}`, provider: 'sistema' };
          },
          () => {
            // Tenta abrir em nova aba
            const newWindow = window.open(`tel:${cleanPhone}`, '_blank');
            if (newWindow) {
              newWindow.close(); // Fecha imediatamente, o protocolo já foi acionado
              return { success: true, message: `Tentando abrir aplicativo de telefone para ${formattedPhone}`, provider: 'sistema' };
            }
            throw new Error('Não foi possível abrir aplicativo');
          }
        ];

        // Tenta cada estratégia
        for (const strategy of strategies) {
          try {
            return strategy();
          } catch (error) {
            continue;
          }
        }

        // Se todas falharam, oferece alternativas
        return {
          success: false,
          error: `Não foi possível abrir o aplicativo de telefone automaticamente. Ligue para: ${formattedPhone}`,
          message: `Copie o número: ${formattedPhone}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao tentar fazer a ligação',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Abre chat do WhatsApp com número específico
   */
  static async openWhatsAppChat(phoneNumber: string, message?: string): Promise<CommunicationResult> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Adiciona código do país se não tiver
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      
      let whatsappUrl = `https://wa.me/${fullPhone}`;
      
      if (message) {
        whatsappUrl += `?text=${encodeURIComponent(message)}`;
      }
      
      // Tenta abrir WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (!newWindow) {
        return {
          success: false,
          error: 'Não foi possível abrir o WhatsApp. Verifique se está instalado.'
        };
      }
      
      return {
        success: true,
        message: 'Abrindo WhatsApp...',
        provider: 'whatsapp'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao abrir WhatsApp'
      };
    }
  }

  /**
   * Compartilha informações do local via WhatsApp com formatação aprimorada
   */
  static async shareViaWhatsApp(data: ShareLocationData, options: ShareOptions = {}): Promise<CommunicationResult> {
    try {
      const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName, additionalNotes } = data;
      const { format = 'detailed', customMessage, includeDirections = true, includeOperatingHours = true, includeFacilities = true } = options;
      
      let message = '';
      
      if (customMessage) {
        message = customMessage;
      } else {
        // Cabeçalho
        message = `🏥 *${location.nome_local}*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Informações básicas
        message += `📍 *Endereço:*\n${location.endereco_completo}\n`;
        
        if (location.bairro && location.cidade) {
          message += `${location.bairro}, ${location.cidade} - ${location.estado}\n`;
        }
        
        if (location.cep) {
          message += `CEP: ${location.cep}\n`;
        }
        
        message += `\n`;
        
        // Contato
        if (location.telefone) {
          message += `📞 *Telefone:* ${this.formatPhoneNumber(location.telefone)}\n`;
        }
        
        if (location.whatsapp && location.whatsapp !== location.telefone) {
          message += `💬 *WhatsApp:* ${this.formatPhoneNumber(location.whatsapp)}\n`;
        }
        
        if (location.email) {
          message += `📧 *Email:* ${location.email}\n`;
        }
        
        if (location.website) {
          message += `🌐 *Site:* ${location.website}\n`;
        }
        
        // Horário de funcionamento
        if (includeOperatingHours && location.horario_funcionamento) {
          message += `\n🕒 *Horário de Funcionamento:*\n`;
          message += this.formatOperatingHours(location.horario_funcionamento);
        }
        
        // Facilidades
        if (includeFacilities && location.facilidades && location.facilidades.length > 0) {
          message += `\n✨ *Facilidades:*\n`;
          location.facilidades.forEach(facility => {
            const icon = this.getFacilityIcon(facility.type);
            const status = facility.available ? '✅' : '❌';
            message += `${status} ${icon} ${this.getFacilityName(facility.type)}`;
            if (facility.details) {
              message += ` - ${facility.details}`;
            }
            if (facility.cost) {
              message += ` (${facility.cost})`;
            }
            message += `\n`;
          });
        }
        
        // Informações da consulta
        if (appointmentDate && appointmentTime) {
          message += `\n📅 *CONSULTA AGENDADA*\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n`;
          message += `📆 *Data:* ${appointmentDate}\n`;
          message += `⏰ *Horário:* ${appointmentTime}\n`;
          
          if (patientName) {
            message += `👤 *Paciente:* ${patientName}\n`;
          }
          
          if (doctorName) {
            message += `👨‍⚕️ *Médico:* ${doctorName}\n`;
          }
          
          if (specialty) {
            message += `🩺 *Especialidade:* ${specialty}\n`;
          }
          
          if (additionalNotes) {
            message += `📝 *Observações:* ${additionalNotes}\n`;
          }
        }
        
        // Instruções de acesso
        if (location.instrucoes_acesso) {
          message += `\n🚪 *Como Chegar:*\n${location.instrucoes_acesso}\n`;
        }
        
        // Direções
        if (includeDirections && location.coordenadas) {
          message += `\n🗺️ *Ver no Mapa:*\n`;
          message += `https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}\n`;
        }
        
        // Rodapé
        message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📱 Agendado via *AgendarBrasil*\n`;
        message += `🌐 Sua saúde em primeiro lugar! 💙`;
      }
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // Tenta abrir WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (!newWindow) {
        // Fallback: copia para clipboard
        try {
          await navigator.clipboard.writeText(message);
          return {
            success: true,
            message: 'WhatsApp não pôde ser aberto. Mensagem copiada para área de transferência.',
            fallbackUsed: true
          };
        } catch (clipboardError) {
          return {
            success: false,
            error: 'Não foi possível abrir WhatsApp nem copiar mensagem'
          };
        }
      }
      
      return {
        success: true,
        message: 'Abrindo WhatsApp...',
        provider: 'whatsapp'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao compartilhar via WhatsApp',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Compartilha informações do local via email com formatação HTML
   */
  static async shareViaEmail(data: ShareLocationData, options: ShareOptions = {}): Promise<CommunicationResult> {
    try {
      const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName, additionalNotes } = data;
      const { includeDirections = true, includeOperatingHours = true, includeFacilities = true, customMessage } = options;
      
      let subject = '';
      let body = '';
      
      if (customMessage) {
        subject = `Informações - ${location.nome_local}`;
        body = customMessage;
      } else {
        // Assunto do email
        if (appointmentDate && appointmentTime) {
          subject = `Consulta Agendada - ${location.nome_local} - ${appointmentDate}`;
        } else {
          subject = `Informações do Estabelecimento - ${location.nome_local}`;
        }
        
        // Corpo do email em formato texto estruturado
        body = `INFORMAÇÕES DO ESTABELECIMENTO\n`;
        body += `${'='.repeat(50)}\n\n`;
        
        // Informações básicas
        body += `ESTABELECIMENTO: ${location.nome_local}\n`;
        body += `ENDEREÇO: ${location.endereco_completo}\n`;
        
        if (location.bairro && location.cidade) {
          body += `LOCALIZAÇÃO: ${location.bairro}, ${location.cidade} - ${location.estado}\n`;
        }
        
        if (location.cep) {
          body += `CEP: ${location.cep}\n`;
        }
        
        body += `\n`;
        
        // Contato
        body += `CONTATO:\n`;
        body += `${'-'.repeat(20)}\n`;
        
        if (location.telefone) {
          body += `Telefone: ${this.formatPhoneNumber(location.telefone)}\n`;
        }
        
        if (location.whatsapp && location.whatsapp !== location.telefone) {
          body += `WhatsApp: ${this.formatPhoneNumber(location.whatsapp)}\n`;
        }
        
        if (location.email) {
          body += `Email: ${location.email}\n`;
        }
        
        if (location.website) {
          body += `Website: ${location.website}\n`;
        }
        
        // Horário de funcionamento
        if (includeOperatingHours && location.horario_funcionamento) {
          body += `\nHORÁRIO DE FUNCIONAMENTO:\n`;
          body += `${'-'.repeat(30)}\n`;
          body += this.formatOperatingHoursText(location.horario_funcionamento);
        }
        
        // Facilidades
        if (includeFacilities && location.facilidades && location.facilidades.length > 0) {
          body += `\nFACILIDADES DISPONÍVEIS:\n`;
          body += `${'-'.repeat(25)}\n`;
          location.facilidades.forEach(facility => {
            const status = facility.available ? '[DISPONÍVEL]' : '[INDISPONÍVEL]';
            body += `${status} ${this.getFacilityName(facility.type)}`;
            if (facility.details) {
              body += ` - ${facility.details}`;
            }
            if (facility.cost) {
              body += ` (${facility.cost})`;
            }
            body += `\n`;
          });
        }
        
        // Informações da consulta
        if (appointmentDate && appointmentTime) {
          body += `\nDETALHES DA CONSULTA:\n`;
          body += `${'='.repeat(25)}\n`;
          body += `Data: ${appointmentDate}\n`;
          body += `Horário: ${appointmentTime}\n`;
          
          if (patientName) {
            body += `Paciente: ${patientName}\n`;
          }
          
          if (doctorName) {
            body += `Médico: ${doctorName}\n`;
          }
          
          if (specialty) {
            body += `Especialidade: ${specialty}\n`;
          }
          
          if (additionalNotes) {
            body += `Observações: ${additionalNotes}\n`;
          }
        }
        
        // Instruções de acesso
        if (location.instrucoes_acesso) {
          body += `\nCOMO CHEGAR:\n`;
          body += `${'-'.repeat(15)}\n`;
          body += `${location.instrucoes_acesso}\n`;
        }
        
        // Direções
        if (includeDirections && location.coordenadas) {
          body += `\nLOCALIZAÇÃO NO MAPA:\n`;
          body += `${'-'.repeat(20)}\n`;
          body += `Google Maps: https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}\n`;
          body += `Coordenadas: ${location.coordenadas.lat}, ${location.coordenadas.lng}\n`;
        }
        
        // Observações especiais
        if (location.observacoes_especiais) {
          body += `\nOBSERVAÇÕES ESPECIAIS:\n`;
          body += `${'-'.repeat(25)}\n`;
          body += `${location.observacoes_especiais}\n`;
        }
        
        // Rodapé
        body += `\n${'='.repeat(50)}\n`;
        body += `Agendado via AgendarBrasil - Sua saúde em primeiro lugar!\n`;
        body += `Data de envio: ${new Date().toLocaleString('pt-BR')}\n`;
        
        if (location.ultima_atualizacao) {
          body += `Última atualização dos dados: ${new Date(location.ultima_atualizacao).toLocaleString('pt-BR')}\n`;
        }
      }
      
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Verifica se o URL não é muito longo (limite de ~2000 caracteres)
      if (mailtoUrl.length > 2000) {
        // Fallback: copia para clipboard
        try {
          const shortBody = `${subject}\n\n${body}`;
          await navigator.clipboard.writeText(shortBody);
          return {
            success: true,
            message: 'Informações copiadas para área de transferência (email muito longo para abrir automaticamente)',
            fallbackUsed: true
          };
        } catch (clipboardError) {
          return {
            success: false,
            error: 'Email muito longo e não foi possível copiar para área de transferência'
          };
        }
      }
      
      // Tenta abrir cliente de email
      try {
        window.location.href = mailtoUrl;
        return {
          success: true,
          message: 'Abrindo cliente de email...',
          provider: 'email'
        };
      } catch (error) {
        // Fallback: copia para clipboard
        const fullContent = `${subject}\n\n${body}`;
        await navigator.clipboard.writeText(fullContent);
        return {
          success: true,
          message: 'Não foi possível abrir cliente de email. Informações copiadas para área de transferência.',
          fallbackUsed: true
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao compartilhar via email',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Compartilha informações do local via SMS com formatação otimizada
   */
  static async shareViaSMS(data: ShareLocationData, options: ShareOptions = {}): Promise<CommunicationResult> {
    try {
      const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName } = data;
      const { format = 'simple', customMessage, includeDirections = false } = options;
      
      let message = '';
      
      if (customMessage) {
        message = customMessage;
      } else {
        // Formato compacto para SMS (limite de caracteres)
        if (format === 'simple') {
          message = `🏥 ${location.nome_local}\n`;
          message += `📍 ${location.endereco_completo}\n`;
          
          if (location.telefone) {
            message += `📞 ${this.formatPhoneNumber(location.telefone)}\n`;
          }
          
          if (appointmentDate && appointmentTime) {
            message += `📅 ${appointmentDate} ${appointmentTime}`;
            if (doctorName) {
              message += ` - Dr. ${doctorName}`;
            }
          }
        } else {
          // Formato detalhado
          message = `🏥 ${location.nome_local}\n`;
          message += `━━━━━━━━━━━━━━━━━━━━\n`;
          message += `📍 ${location.endereco_completo}\n`;
          
          if (location.bairro && location.cidade) {
            message += `${location.bairro}, ${location.cidade}\n`;
          }
          
          if (location.telefone) {
            message += `📞 ${this.formatPhoneNumber(location.telefone)}\n`;
          }
          
          if (appointmentDate && appointmentTime) {
            message += `\n📅 CONSULTA:\n`;
            message += `${appointmentDate} às ${appointmentTime}\n`;
            
            if (patientName) {
              message += `Paciente: ${patientName}\n`;
            }
            
            if (doctorName) {
              message += `Médico: Dr. ${doctorName}\n`;
            }
            
            if (specialty) {
              message += `${specialty}\n`;
            }
          }
          
          if (includeDirections && location.coordenadas) {
            message += `\n🗺️ Mapa: https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}`;
          }
        }
        
        // Adiciona rodapé se houver espaço
        if (message.length < 140) {
          message += `\n\nVia AgendarBrasil 💙`;
        }
      }
      
      // Verifica limite de caracteres do SMS (160 caracteres padrão)
      if (message.length > 160) {
        // Versão ultra compacta
        message = `🏥 ${location.nome_local}\n📍 ${location.endereco_completo}`;
        
        if (location.telefone) {
          message += `\n📞 ${this.formatPhoneNumber(location.telefone)}`;
        }
        
        if (appointmentDate && appointmentTime) {
          message += `\n📅 ${appointmentDate} ${appointmentTime}`;
        }
      }
      
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:?body=${encodedMessage}`;
      
      // Verifica se é dispositivo móvel
      if (!this.canSendSMS()) {
        // Fallback para desktop: copia para clipboard
        try {
          await navigator.clipboard.writeText(message);
          return {
            success: true,
            message: 'SMS não disponível neste dispositivo. Mensagem copiada para área de transferência.',
            fallbackUsed: true
          };
        } catch (clipboardError) {
          return {
            success: false,
            error: 'SMS não disponível e não foi possível copiar mensagem'
          };
        }
      }
      
      // Tenta abrir aplicativo de SMS
      try {
        window.location.href = smsUrl;
        return {
          success: true,
          message: 'Abrindo aplicativo de SMS...',
          provider: 'sms'
        };
      } catch (error) {
        // Fallback: copia para clipboard
        await navigator.clipboard.writeText(message);
        return {
          success: true,
          message: 'Não foi possível abrir SMS. Mensagem copiada para área de transferência.',
          fallbackUsed: true
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao compartilhar via SMS',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Compartilha usando a API nativa de compartilhamento do sistema (Web Share API)
   */
  static async shareViaSystem(data: ShareLocationData, options: ShareOptions = {}): Promise<CommunicationResult> {
    try {
      // Verifica se a Web Share API está disponível
      if (!navigator.share) {
        return this.fallbackShare(data, options);
      }
      
      const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName, additionalNotes } = data;
      const { customMessage, includeDirections = true } = options;
      
      let title = '';
      let text = '';
      let url = '';
      
      if (customMessage) {
        title = location.nome_local;
        text = customMessage;
      } else {
        // Título
        if (appointmentDate && appointmentTime) {
          title = `Consulta - ${location.nome_local}`;
        } else {
          title = location.nome_local;
        }
        
        // Texto principal
        text = `🏥 ${location.nome_local}\n`;
        text += `📍 ${location.endereco_completo}\n`;
        
        if (location.bairro && location.cidade) {
          text += `${location.bairro}, ${location.cidade} - ${location.estado}\n`;
        }
        
        // Contato
        if (location.telefone) {
          text += `📞 ${this.formatPhoneNumber(location.telefone)}\n`;
        }
        
        if (location.email) {
          text += `📧 ${location.email}\n`;
        }
        
        // Informações da consulta
        if (appointmentDate && appointmentTime) {
          text += `\n📅 CONSULTA AGENDADA\n`;
          text += `Data: ${appointmentDate}\n`;
          text += `Horário: ${appointmentTime}\n`;
          
          if (patientName) {
            text += `Paciente: ${patientName}\n`;
          }
          
          if (doctorName) {
            text += `Médico: Dr. ${doctorName}\n`;
          }
          
          if (specialty) {
            text += `Especialidade: ${specialty}\n`;
          }
          
          if (additionalNotes) {
            text += `Observações: ${additionalNotes}\n`;
          }
        }
        
        // Facilidades principais
        if (location.facilidades && location.facilidades.length > 0) {
          const availableFacilities = location.facilidades.filter(f => f.available);
          if (availableFacilities.length > 0) {
            text += `\n✨ Facilidades: `;
            text += availableFacilities.slice(0, 3).map(f => this.getFacilityName(f.type)).join(', ');
            if (availableFacilities.length > 3) {
              text += ` e mais ${availableFacilities.length - 3}`;
            }
            text += `\n`;
          }
        }
        
        text += `\n💙 Agendado via AgendarBrasil`;
      }
      
      // URL para direções se disponível
      if (includeDirections && location.coordenadas) {
        url = `https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}`;
      }
      
      // Dados para compartilhamento
      const shareData: ShareData = {
        title,
        text
      };
      
      // Adiciona URL se disponível e suportado
      if (url && this.supportsUrlSharing()) {
        shareData.url = url;
      }
      
      // Tenta compartilhar
      await navigator.share(shareData);
      
      return {
        success: true,
        message: 'Compartilhado com sucesso',
        provider: 'sistema'
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          error: 'Compartilhamento cancelado pelo usuário'
        };
      }
      
      if ((error as Error).name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Compartilhamento não permitido'
        };
      }
      
      // Fallback para compartilhamento manual
      return this.fallbackShare(data, options);
    }
  }

  /**
   * Fallback para compartilhamento quando a Web Share API não está disponível
   */
  private static async fallbackShare(data: ShareLocationData, options: ShareOptions = {}): Promise<CommunicationResult> {
    try {
      const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName, additionalNotes } = data;
      const { customMessage, includeDirections = true, includeOperatingHours = false, includeFacilities = false } = options;
      
      let shareText = '';
      
      if (customMessage) {
        shareText = customMessage;
      } else {
        shareText = `🏥 ${location.nome_local}\n`;
        shareText += `📍 ${location.endereco_completo}\n`;
        
        if (location.bairro && location.cidade) {
          shareText += `${location.bairro}, ${location.cidade} - ${location.estado}\n`;
        }
        
        if (location.telefone) {
          shareText += `📞 ${this.formatPhoneNumber(location.telefone)}\n`;
        }
        
        if (location.email) {
          shareText += `📧 ${location.email}\n`;
        }
        
        if (includeOperatingHours && location.horario_funcionamento) {
          shareText += `\n🕒 Horário:\n${this.formatOperatingHoursText(location.horario_funcionamento)}`;
        }
        
        if (includeFacilities && location.facilidades && location.facilidades.length > 0) {
          const availableFacilities = location.facilidades.filter(f => f.available);
          if (availableFacilities.length > 0) {
            shareText += `\n✨ Facilidades: ${availableFacilities.map(f => this.getFacilityName(f.type)).join(', ')}\n`;
          }
        }
        
        if (appointmentDate && appointmentTime) {
          shareText += `\n📅 CONSULTA AGENDADA\n`;
          shareText += `Data: ${appointmentDate}\n`;
          shareText += `Horário: ${appointmentTime}\n`;
          
          if (patientName) {
            shareText += `Paciente: ${patientName}\n`;
          }
          
          if (doctorName) {
            shareText += `Médico: Dr. ${doctorName}\n`;
          }
          
          if (specialty) {
            shareText += `Especialidade: ${specialty}\n`;
          }
          
          if (additionalNotes) {
            shareText += `Observações: ${additionalNotes}\n`;
          }
        }
        
        if (includeDirections && location.coordenadas) {
          shareText += `\n🗺️ Ver no mapa:\nhttps://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}\n`;
        }
        
        if (location.instrucoes_acesso) {
          shareText += `\n🚪 Como chegar:\n${location.instrucoes_acesso}\n`;
        }
        
        shareText += `\n💙 Agendado via AgendarBrasil`;
      }
      
      // Tenta copiar para a área de transferência
      if (this.supportsClipboard()) {
        try {
          await navigator.clipboard.writeText(shareText);
          return {
            success: true,
            message: 'Informações copiadas para a área de transferência',
            provider: 'clipboard',
            fallbackUsed: true
          };
        } catch (clipboardError) {
          // Se falhar, tenta método alternativo
          return this.legacyClipboardFallback(shareText);
        }
      } else {
        // Método alternativo para navegadores antigos
        return this.legacyClipboardFallback(shareText);
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao compartilhar informações',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Método alternativo para copiar texto em navegadores antigos
   */
  private static legacyClipboardFallback(text: string): CommunicationResult {
    try {
      // Cria elemento temporário
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Seleciona e copia
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return {
          success: true,
          message: 'Informações copiadas para a área de transferência',
          provider: 'legacy-clipboard',
          fallbackUsed: true
        };
      } else {
        return {
          success: false,
          error: 'Não foi possível copiar as informações. Copie manualmente o texto exibido.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao tentar copiar informações'
      };
    }
  }

  /**
   * Verifica se o dispositivo suporta chamadas telefônicas
   */
  static canMakePhoneCalls(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Verifica se o dispositivo suporta SMS
   */
  static canSendSMS(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Verifica se o navegador suporta a Web Share API
   */
  static supportsNativeSharing(): boolean {
    return 'share' in navigator;
  }

  /**
   * Verifica se o navegador suporta clipboard
   */
  static supportsClipboard(): boolean {
    return 'clipboard' in navigator;
  }

  /**
   * Verifica se o navegador suporta compartilhamento de URLs
   */
  static supportsUrlSharing(): boolean {
    return 'canShare' in navigator;
  }

  /**
   * Formata número de telefone para exibição
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      // Celular: (XX) 9XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      // Fixo: (XX) XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      // Com código do país: +55 (XX) 9XXXX-XXXX
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    return phone; // Retorna original se não conseguir formatar
  }

  /**
   * Formata horário de funcionamento para WhatsApp
   */
  static formatOperatingHours(hours: Record<string, any>): string {
    const dayNames = {
      segunda: 'Segunda',
      terca: 'Terça',
      quarta: 'Quarta',
      quinta: 'Quinta',
      sexta: 'Sexta',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };

    let formatted = '';
    
    Object.entries(hours).forEach(([day, info]: [string, any]) => {
      const dayName = dayNames[day as keyof typeof dayNames] || day;
      
      if (info.fechado) {
        formatted += `${dayName}: Fechado\n`;
      } else {
        formatted += `${dayName}: ${info.abertura} - ${info.fechamento}`;
        if (info.almoco) {
          formatted += ` (Almoço: ${info.almoco.inicio} - ${info.almoco.fim})`;
        }
        formatted += `\n`;
      }
    });
    
    return formatted;
  }

  /**
   * Formata horário de funcionamento para texto simples
   */
  static formatOperatingHoursText(hours: Record<string, any>): string {
    const dayNames = {
      segunda: 'Seg',
      terca: 'Ter',
      quarta: 'Qua',
      quinta: 'Qui',
      sexta: 'Sex',
      sabado: 'Sáb',
      domingo: 'Dom'
    };

    let formatted = '';
    
    Object.entries(hours).forEach(([day, info]: [string, any]) => {
      const dayName = dayNames[day as keyof typeof dayNames] || day;
      
      if (info.fechado) {
        formatted += `${dayName}: Fechado\n`;
      } else {
        formatted += `${dayName}: ${info.abertura}-${info.fechamento}`;
        if (info.almoco) {
          formatted += ` (Almoço: ${info.almoco.inicio}-${info.almoco.fim})`;
        }
        formatted += `\n`;
      }
    });
    
    return formatted;
  }

  /**
   * Obtém ícone para facilidade
   */
  static getFacilityIcon(type: string): string {
    const icons = {
      estacionamento: '🅿️',
      acessibilidade: '♿',
      farmacia: '💊',
      laboratorio: '🧪',
      wifi: '📶',
      ar_condicionado: '❄️',
      elevador: '🛗',
      cafe: '☕',
      banheiro: '🚻',
      seguranca: '🔒'
    };
    
    return icons[type as keyof typeof icons] || '✨';
  }

  /**
   * Obtém nome amigável para facilidade
   */
  static getFacilityName(type: string): string {
    const names = {
      estacionamento: 'Estacionamento',
      acessibilidade: 'Acessibilidade',
      farmacia: 'Farmácia',
      laboratorio: 'Laboratório',
      wifi: 'Wi-Fi',
      ar_condicionado: 'Ar Condicionado',
      elevador: 'Elevador',
      cafe: 'Café/Lanchonete',
      banheiro: 'Banheiros',
      seguranca: 'Segurança 24h'
    };
    
    return names[type as keyof typeof names] || type;
  }

  /**
   * Cria mensagem personalizada para diferentes contextos
   */
  static createCustomMessage(data: ShareLocationData, context: 'reminder' | 'invitation' | 'directions' | 'emergency'): string {
    const { location, appointmentDate, appointmentTime, doctorName, specialty, patientName } = data;
    
    switch (context) {
      case 'reminder':
        return `🔔 LEMBRETE DE CONSULTA\n\n` +
               `📅 ${appointmentDate} às ${appointmentTime}\n` +
               `🏥 ${location.nome_local}\n` +
               `📍 ${location.endereco_completo}\n` +
               `👨‍⚕️ Dr. ${doctorName}\n` +
               `📞 ${location.telefone ? this.formatPhoneNumber(location.telefone) : 'N/A'}\n\n` +
               `💙 Não esqueça de levar seus documentos!`;

      case 'invitation':
        return `👋 Olá! Gostaria de compartilhar as informações da consulta:\n\n` +
               `🏥 ${location.nome_local}\n` +
               `📍 ${location.endereco_completo}\n` +
               `📅 ${appointmentDate} às ${appointmentTime}\n` +
               `👨‍⚕️ Dr. ${doctorName} - ${specialty}\n` +
               `📞 ${location.telefone ? this.formatPhoneNumber(location.telefone) : 'N/A'}\n\n` +
               `Qualquer dúvida, entre em contato!`;

      case 'directions':
        return `🗺️ COMO CHEGAR\n\n` +
               `🏥 ${location.nome_local}\n` +
               `📍 ${location.endereco_completo}\n` +
               `📞 ${location.telefone ? this.formatPhoneNumber(location.telefone) : 'N/A'}\n\n` +
               (location.instrucoes_acesso ? `🚪 ${location.instrucoes_acesso}\n\n` : '') +
               (location.coordenadas ? `🗺️ https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}` : '');

      case 'emergency':
        return `🚨 INFORMAÇÕES DE EMERGÊNCIA\n\n` +
               `🏥 ${location.nome_local}\n` +
               `📍 ${location.endereco_completo}\n` +
               `📞 ${location.telefone ? this.formatPhoneNumber(location.telefone) : 'N/A'}\n` +
               (location.coordenadas ? `🗺️ https://maps.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}\n` : '') +
               `\n⚠️ Em caso de emergência, ligue 192 (SAMU)`;

      default:
        return this.createDefaultMessage(data);
    }
  }

  /**
   * Cria mensagem padrão
   */
  private static createDefaultMessage(data: ShareLocationData): string {
    const { location, appointmentDate, appointmentTime, doctorName, specialty } = data;
    
    let message = `🏥 ${location.nome_local}\n`;
    message += `📍 ${location.endereco_completo}\n`;
    
    if (location.telefone) {
      message += `📞 ${this.formatPhoneNumber(location.telefone)}\n`;
    }
    
    if (appointmentDate && appointmentTime) {
      message += `\n📅 Consulta: ${appointmentDate} às ${appointmentTime}\n`;
      
      if (doctorName) {
        message += `👨‍⚕️ Dr. ${doctorName}\n`;
      }
      
      if (specialty) {
        message += `🩺 ${specialty}\n`;
      }
    }
    
    message += `\n💙 Via AgendarBrasil`;
    
    return message;
  }
}