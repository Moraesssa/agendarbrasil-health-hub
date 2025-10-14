import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar } from 'lucide-react';
import type { Medico } from '@/services/agendamento/types';

interface ListaMedicosProps {
  medicos: Medico[];
  onSelecionar: (medico: Medico) => void;
}

export function ListaMedicos({ medicos, onSelecionar }: ListaMedicosProps) {
  if (medicos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum médico encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {medicos.map(medico => (
        <Card key={medico.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={medico.foto_perfil_url} />
                <AvatarFallback>
                  {medico.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{medico.display_name}</h3>
                {medico.crm && (
                  <p className="text-sm text-muted-foreground">CRM: {medico.crm}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {medico.especialidades?.map(esp => (
                    <Badge key={esp} variant="secondary">{esp}</Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {medico.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{medico.rating.toFixed(1)}</span>
                      {medico.total_avaliacoes && (
                        <span>({medico.total_avaliacoes})</span>
                      )}
                    </div>
                  )}

                  {medico.valor_consulta_presencial && (
                    <span>R$ {medico.valor_consulta_presencial.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <Button onClick={() => onSelecionar(medico)}>
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
