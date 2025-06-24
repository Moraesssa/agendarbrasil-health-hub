
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentReminderRequest {
  appointmentId: string;
  reminderType?: 'patient' | 'doctor' | 'both';
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, reminderType = 'both' }: AppointmentReminderRequest = await req.json();

    if (!appointmentId) {
      throw new Error("appointmentId é obrigatório");
    }

    console.log(`Buscando detalhes da consulta: ${appointmentId}`);

    // Buscar detalhes da consulta com dados do paciente e médico
    const { data: appointment, error: appointmentError } = await supabase
      .from('consultas')
      .select(`
        *,
        patient_profile:profiles!consultas_paciente_id_fkey (
          id,
          email,
          display_name
        ),
        doctor_profile:profiles!consultas_medico_id_fkey (
          id,
          email,
          display_name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Erro ao buscar consulta:", appointmentError);
      throw new Error("Consulta não encontrada");
    }

    console.log("Consulta encontrada:", appointment);

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

    const results = [];

    // Enviar email para o paciente
    if ((reminderType === 'both' || reminderType === 'patient') && appointment.patient_profile?.email) {
      console.log(`Enviando lembrete para paciente: ${appointment.patient_profile.email}`);
      
      const patientEmailResponse = await resend.emails.send({
        from: "AgendarBrasil <noreply@resend.dev>",
        to: [appointment.patient_profile.email],
        subject: "Lembrete: Sua consulta está chegando!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #10b981); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏥 Lembrete de Consulta</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Olá, ${appointment.patient_profile.display_name || 'Paciente'}!</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Este é um lembrete sobre sua consulta agendada:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👨‍⚕️ Médico:</strong> ${appointment.doctor_profile?.display_name || 'Não informado'}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🩺 Tipo:</strong> ${appointment.tipo_consulta || 'Consulta geral'}</p>
                ${appointment.local_consulta ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📍 Local:</strong> ${appointment.local_consulta}</p>` : ''}
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Chegue com 15 minutos de antecedência e traga seus documentos e exames.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Em caso de dúvidas ou necessidade de reagendamento, entre em contato conosco.
              </p>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                AgendarBrasil - Cuidando da sua saúde
              </p>
            </div>
          </div>
        `,
      });

      results.push({
        type: 'patient',
        success: !patientEmailResponse.error,
        email: appointment.patient_profile.email,
        response: patientEmailResponse
      });

      console.log("Resultado email paciente:", patientEmailResponse);
    }

    // Enviar email para o médico
    if ((reminderType === 'both' || reminderType === 'doctor') && appointment.doctor_profile?.email) {
      console.log(`Enviando lembrete para médico: ${appointment.doctor_profile.email}`);
      
      const doctorEmailResponse = await resend.emails.send({
        from: "AgendarBrasil <noreply@resend.dev>",
        to: [appointment.doctor_profile.email],
        subject: "Lembrete: Consulta agendada em sua agenda",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">👨‍⚕️ Lembrete de Consulta</h1>
            </div>
            
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Dr(a). ${appointment.doctor_profile.display_name || 'Médico'},</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Você tem uma consulta agendada em sua agenda:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #1e293b;"><strong>📅 Data:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>👤 Paciente:</strong> ${appointment.patient_profile?.display_name || 'Não informado'}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📧 Email:</strong> ${appointment.patient_profile?.email || 'Não informado'}</p>
                <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🩺 Tipo:</strong> ${appointment.tipo_consulta || 'Consulta geral'}</p>
                ${appointment.motivo ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📝 Motivo:</strong> ${appointment.motivo}</p>` : ''}
                ${appointment.local_consulta ? `<p style="margin: 10px 0 0 0; color: #1e293b;"><strong>📍 Local:</strong> ${appointment.local_consulta}</p>` : ''}
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                ℹ️ <strong>Status:</strong> ${appointment.status === 'agendada' ? 'Agendada' : 
                  appointment.status === 'confirmada' ? 'Confirmada' : 
                  appointment.status === 'pendente' ? 'Pendente' : appointment.status}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Acesse seu painel médico para mais detalhes ou para fazer anotações sobre a consulta.
              </p>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                AgendarBrasil - Plataforma Médica
              </p>
            </div>
          </div>
        `,
      });

      results.push({
        type: 'doctor',
        success: !doctorEmailResponse.error,
        email: appointment.doctor_profile.email,
        response: doctorEmailResponse
      });

      console.log("Resultado email médico:", doctorEmailResponse);
    }

    // Verificar se pelo menos um email foi enviado
    const successfulSends = results.filter(r => r.success);
    
    if (successfulSends.length === 0) {
      throw new Error("Nenhum email foi enviado com sucesso");
    }

    console.log("Lembretes enviados com sucesso:", successfulSends.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successfulSends.length} lembrete(s) enviado(s) com sucesso`,
        results: results,
        appointment: {
          id: appointment.id,
          date: formattedDate,
          time: formattedTime,
          patient: appointment.patient_profile?.display_name,
          doctor: appointment.doctor_profile?.display_name
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
    console.error("Erro na função send-appointment-reminder:", error);
    
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
