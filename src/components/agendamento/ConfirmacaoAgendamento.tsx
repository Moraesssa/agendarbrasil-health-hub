import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User, MapPin, Download, Share2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Medico } from '@/services/agendamento/types';

interface ConfirmacaoAgendamentoProps {
  consultaId: number;
  medico: Medico | null;
  data: string;
  horario: string;
  onNovaConsulta: () => void;
  onVerAgenda: () => void;
}

export function ConfirmacaoAgendamento({
  consultaId,
  medico,
  data,
  horario,
  onNovaConsulta,
  onVerAgenda
}: ConfirmacaoAgendamentoProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatarData = (dataStr: string) => {
    const dt = new Date(dataStr);
    return dt.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="confirmation-success">
      {/* Success Animation */}
      <Card className="border-2 border-success/20 bg-gradient-to-br from-success/5 to-emerald-50/30 dark:to-emerald-950/20 shadow-2xl">
        <CardContent className="p-12">
          <div className="text-center space-y-6">
            {/* Animated Success Icon */}
            <div className="flex justify-center">
              <div 
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-success to-emerald-500 shadow-lg",
                  "transition-all duration-500",
                  showAnimation ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
              >
                <CheckCircle className="w-14 h-14 text-white animate-scale-in" />
                {/* Celebration sparkles */}
                <Sparkles className="w-4 h-4 text-success absolute -top-1 -right-1 animate-pulse" />
                <Sparkles className="w-3 h-3 text-success absolute -bottom-1 -left-1 animate-pulse delay-75" />
              </div>
            </div>

            {/* Success Message */}
            <div 
              data-testid="success-message"
              className={cn(
                "transition-all duration-500 delay-200",
                showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-success to-emerald-600 bg-clip-text text-transparent">
                🎉 Consulta Agendada com Sucesso!
              </h2>
              <p className="text-muted-foreground text-lg">
                Sua consulta foi confirmada. Você receberá um lembrete por e-mail.
              </p>
            </div>

            {/* Appointment Summary */}
            <Card className="bg-card/50 backdrop-blur border-2 shadow-lg max-w-md mx-auto" data-testid="appointment-details">
              <CardContent className="p-6 space-y-4">
                {medico && (
                  <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                        Médico
                      </div>
                      <div className="font-semibold text-lg">{medico.display_name}</div>
                      {medico.especialidades && medico.especialidades.length > 0 && (
                        <div className="text-sm text-muted-foreground">{medico.especialidades[0]}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                      Data
                    </div>
                    <div className="font-semibold text-lg capitalize">{formatarData(data)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                      Horário
                    </div>
                    <div className="font-semibold text-lg">{horario}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <Button variant="outline" size="lg" className="h-12">
                <Download className="w-4 h-4 mr-2" />
                Baixar Comprovante
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                data-testid="new-appointment-button"
                variant="outline" 
                onClick={onNovaConsulta}
                size="lg"
                className="h-12 px-6"
              >
                Agendar Outra Consulta
              </Button>
              <Button 
                onClick={onVerAgenda}
                size="lg"
                className={cn(
                  "h-12 px-8 font-semibold shadow-lg",
                  "bg-gradient-to-r from-primary to-primary/90",
                  "hover:shadow-xl hover:scale-105 active:scale-95",
                  "transition-all duration-200"
                )}
              >
                Ver Minhas Consultas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Card */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Próximos Passos
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>Você receberá um e-mail de confirmação com todos os detalhes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>Um lembrete será enviado 24 horas antes da consulta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              <span>Chegue com 15 minutos de antecedência</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
