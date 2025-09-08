/**
 * Enhanced Email Function with Location Details
 * Handles appointment confirmations, reminders, and cancellations with comprehensive location information
 * replaced by kiro @2025-02-08T19:55:00Z
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnhancedEmailRequest {
  appointmentId: string;
  emailType: 'confirmation' | 'reminder' | 'cancellation';
  recipientType?: 'patient' | 'doctor' | 'both';
  cancellationReason?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * Generate location details HTML for email templates
 */
function generateLocationDetailsHTML(location: any): string {
  if (!location) return '';

  const facilitiesHTML = generateFacilitiesHTML(location.facilidades);
  const operatingHoursHTML = generateOperatingHoursHTML(location.horario_funcionamento);
  const contactHTML = generateContactHTML(location);
  const directionsHTML = generateDirectionsHTML(location);

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

function generateContactHTML(location: any): string {
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

function generateOperatingHoursHTML(horario_funcionamento: any): string {
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
}

function generateFacilitiesHTML(facilidades: any[]): string {
  if (!facilidades || facilidades.length === 0) return '';

  const facilityIcons: Record<string, string> = {
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

  const facilityNames: Record<string, string> = {
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
      const icon = facilityIcons[facility.type] || '✅';
      const name = facilityNames[facility.type] || facility.type;
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

function generateDirectionsHTML(location: any): string {
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, emailType, recipientType = 'both', cancellationReason }: EnhancedEmailRequest = await req.json();

    if (!appointmentId || !emailType) {
      throw new Error("appointmentId e emailType são obrigatórios");
    }

    console.log(`Enviando email ${emailType} para consulta: ${appointmentId}`);

    // Buscar detalhes da consulta com dados do paciente, médico e localização
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
      console.error("Erro ao buscar consulta:", appointmentError);
      throw new Error("Consulta não encontrada");
    }

    // Se a consulta tem location_id, buscar dados aprimorados da localização
    let enhancedLocation = null;
    if (appointment.location_id) {
      const { data: locationData, error: locationError } = await supabase
        .from('locais_atendimento')
        .select('*')
        .eq('id', appointment.location_id)
        .single();

      if (!locationError && locationData) {
        enhancedLocation = locationData;
      }
    }

    console.log("Consulta encontrada:", appointment);
    console.log("Localização aprimorada:", enhancedLocation ? 'Sim' : 'Não');

    const appointmentDate = new Date(appointment.data_consulta);
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

    const locationHTML = enhancedLocation 
      ? generateLocationDetailsHTML(enhancedLocation)
      : appointment.local_consulta 
        ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📍 Local:</strong> ${appointment.local_consulta}</p>`
        : '';

    const results = [];

    // Generate email content based on type
    let subject = '';
    let patientHTML = '';
    const doctorHTML = '';

    if (emailType === 'confirmation') {
      subject = `✅ Consulta Confirmada - ${formattedDate} às ${formattedTime}`;
      
      patientHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Consulta Confirmada!</h1>
          </div>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointment.patient_profile?.display_name || 'Paciente'}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Sua consulta foi confirmada com sucesso! Aqui estão todos os detalhes:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointment.doctor_profile?.display_name || 'Não informado'}</p>
              ${appointment.doctor_profile?.especialidade ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🩺 Especialidade:</strong> ${appointment.doctor_profile.especialidade}</p>` : ''}
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🏥 Tipo:</strong> ${appointment.tipo_consulta || 'Consulta geral'}</p>
              ${appointment.motivo ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📝 Motivo:</strong> ${appointment.motivo}</p>` : ''}
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

    } else if (emailType === 'reminder') {
      subject = `🔔 Lembrete: Consulta amanhã - ${formattedDate} às ${formattedTime}`;
      
      patientHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Lembrete de Consulta</h1>
          </div>
          
          <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointment.patient_profile?.display_name || 'Paciente'}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Este é um lembrete sobre sua consulta que acontecerá em breve:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointment.doctor_profile?.display_name || 'Não informado'}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🏥 Tipo:</strong> ${appointment.tipo_consulta || 'Consulta geral'}</p>
            </div>
          </div>

          ${locationHTML}
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">📋 Checklist para a Consulta:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              <li>Documento de identidade (RG ou CNH)</li>
              <li>Cartão do convênio médico (se aplicável)</li>
              <li>Exames anteriores relacionados</li>
              <li>Lista de medicamentos em uso</li>
              <li>Histórico médico relevante</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              Em caso de dúvidas ou necessidade de reagendamento, entre em contato conosco o quanto antes.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              AgendarBrasil - Cuidando da sua saúde
            </p>
          </div>
        </div>
      `;

    } else if (emailType === 'cancellation') {
      subject = `❌ Consulta Cancelada - ${formattedDate} às ${formattedTime}`;
      
      patientHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Consulta Cancelada</h1>
          </div>
          
          <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointment.patient_profile?.display_name || 'Paciente'}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Informamos que sua consulta foi cancelada:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointment.doctor_profile?.display_name || 'Não informado'}</p>
              <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🏥 Tipo:</strong> ${appointment.tipo_consulta || 'Consulta geral'}</p>
              ${cancellationReason ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📝 Motivo:</strong> ${cancellationReason}</p>` : ''}
            </div>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 <strong>Reagendar:</strong> Você pode agendar uma nova consulta através da nossa plataforma ou entrando em contato conosco.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get("VITE_APP_URL") || 'https://agendarbrasil.com'}/agendamento" 
               style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
              Agendar Nova Consulta
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px;">
              Pedimos desculpas pelo inconveniente. Nossa equipe está à disposição para ajudá-lo.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              AgendarBrasil - Cuidando da sua saúde
            </p>
          </div>
        </div>
      `;
    }

    // Enviar email para o paciente
    if ((recipientType === 'both' || recipientType === 'patient') && appointment.patient_profile?.email) {
      console.log(`Enviando ${emailType} para paciente: ${appointment.patient_profile.email}`);
      
      const patientEmailResponse = await resend.emails.send({
        from: "AgendarBrasil <noreply@resend.dev>",
        to: [appointment.patient_profile.email],
        subject: subject,
        html: patientHTML,
      });

      results.push({
        type: 'patient',
        success: !patientEmailResponse.error,
        email: appointment.patient_profile.email,
        response: patientEmailResponse
      });

      console.log("Resultado email paciente:", patientEmailResponse);
    }

    // Verificar se pelo menos um email foi enviado
    const successfulSends = results.filter(r => r.success);
    
    if (successfulSends.length === 0) {
      throw new Error("Nenhum email foi enviado com sucesso");
    }

    console.log(`Emails ${emailType} enviados com sucesso:`, successfulSends.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successfulSends.length} email(s) ${emailType} enviado(s) com sucesso`,
        results: results,
        appointment: {
          id: appointment.id,
          date: formattedDate,
          time: formattedTime,
          patient: appointment.patient_profile?.display_name,
          doctor: appointment.doctor_profile?.display_name,
          hasEnhancedLocation: !!enhancedLocation
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Erro na função send-enhanced-email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);