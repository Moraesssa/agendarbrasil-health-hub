import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, DollarSign, Video, StarIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';
import type { Medico } from '@/services/agendamento/types';

interface ListaMedicosProps {
  medicos: Medico[];
  onSelecionar: (medico: Medico) => void;
}

export function ListaMedicos({ medicos, onSelecionar }: ListaMedicosProps) {
  if (medicos.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="Nenhum médico encontrado"
            description="Tente ajustar seus filtros de busca para encontrar médicos disponíveis na sua região."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 animate-fade-in">
      {medicos.map((medico, index) => (
        <Card 
          key={medico.id} 
          className={cn(
            "group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1",
            "border-2 hover:border-primary/50"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-20 h-20 border-4 border-primary/20 group-hover:border-primary/40 transition-all">
                <AvatarImage src={medico.foto_perfil_url} />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                  {medico.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                {/* Nome e CRM */}
                <div>
                  <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                    {medico.display_name}
                  </h3>
                  {medico.crm && (
                    <Badge variant="outline" className="mt-1 font-mono text-xs">
                      CRM {medico.crm}
                    </Badge>
                  )}
                </div>

                {/* Especialidades */}
                <div className="flex flex-wrap gap-2">
                  {medico.especialidades?.map((esp, idx) => (
                    <Badge 
                      key={esp} 
                      className={cn(
                        "font-medium",
                        idx === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {esp}
                    </Badge>
                  ))}
                </div>

                {/* Informações e Rating */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Rating */}
                  {medico.rating && (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarIcon 
                            key={star}
                            className={cn(
                              "w-3.5 h-3.5",
                              star <= Math.round(medico.rating!) 
                                ? "fill-amber-400 text-amber-400" 
                                : "fill-gray-200 text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {medico.rating.toFixed(1)}
                      </span>
                      {medico.total_avaliacoes && (
                        <span className="text-muted-foreground">
                          ({medico.total_avaliacoes})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Localização - removido pois não está no tipo Medico */}

                  {/* Valor */}
                  {medico.valor_consulta_presencial && (
                    <div className="flex items-center gap-1.5 font-semibold text-success">
                      <DollarSign className="w-4 h-4" />
                      <span>R$ {medico.valor_consulta_presencial.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Teleconsulta */}
                  {medico.aceita_teleconsulta && (
                    <Badge variant="outline" className="border-success text-success">
                      <Video className="w-3 h-3 mr-1" />
                      Teleconsulta
                    </Badge>
                  )}
                </div>
              </div>

              {/* Botão Agendar */}
              <Button 
                onClick={() => onSelecionar(medico)}
                className={cn(
                  "md:self-start h-12 px-6 font-semibold shadow-lg",
                  "bg-gradient-to-r from-primary to-primary/90",
                  "hover:shadow-xl hover:scale-105 active:scale-95",
                  "transition-all duration-200"
                )}
                size="lg"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
