import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, MapPin, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { agendamentoService } from '@/services/agendamento';
import { cn } from '@/lib/utils';

interface FiltroBuscaProps {
  especialidade: string;
  estado: string;
  cidade: string;
  onEspecialidadeChange: (value: string) => void;
  onEstadoChange: (value: string) => void;
  onCidadeChange: (value: string) => void;
  onBuscar: () => void;
}

export function FiltroBusca({
  especialidade,
  estado,
  cidade,
  onEspecialidadeChange,
  onEstadoChange,
  onCidadeChange,
  onBuscar
}: FiltroBuscaProps) {
  const { toast } = useToast();
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [estados, setEstados] = useState<Array<{ uf: string; nome: string }>>([]);
  const [cidades, setCidades] = useState<Array<{ cidade: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      agendamentoService.buscarEspecialidades(),
      agendamentoService.buscarEstados()
    ]).then(([esp, est]) => {
      setEspecialidades(esp);
      setEstados(est);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (estado) {
      setLoading(true);
      agendamentoService.buscarCidades(estado)
        .then(setCidades)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setCidades([]);
    }
  }, [estado]);

  const podeBuscar = especialidade && estado && cidade;

  const especialidadesPopulares = ['Cardiologia', 'Pediatria', 'Dermatologia', 'Ortopedia'];

  return (
    <Card className="shadow-lg bg-gradient-to-br from-card to-card/95 border-2">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          Encontre o Médico Ideal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Busque por especialidade e localização
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Especialidade */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Especialidade
          </label>
          <Select value={especialidade} onValueChange={onEspecialidadeChange}>
            <SelectTrigger 
              data-testid="specialty-select"
              className={cn(
                "h-12 hover:border-primary/50 transition-colors",
                especialidade && "border-primary"
              )}
            >
              <SelectValue placeholder="Selecione uma especialidade" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {especialidades.map(esp => (
                <SelectItem key={esp} value={esp}>{esp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado e Cidade */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Estado
            </label>
            <Select value={estado} onValueChange={onEstadoChange}>
              <SelectTrigger 
                data-testid="state-select"
                className={cn(
                  "h-12 hover:border-primary/50 transition-colors",
                  estado && "border-primary"
                )}
              >
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {estados.map(est => (
                  <SelectItem key={est.uf} value={est.uf}>{est.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Cidade
            </label>
            <Select value={cidade} onValueChange={onCidadeChange} disabled={!estado || loading}>
              <SelectTrigger 
                data-testid="city-select"
                className={cn(
                  "h-12 hover:border-primary/50 transition-colors",
                  cidade && "border-primary"
                )}
              >
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione a cidade"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {cidades.map(cid => (
                  <SelectItem key={cid.cidade} value={cid.cidade}>{cid.cidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sugestões Rápidas */}
        {!especialidade && especialidades.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Especialidades Populares:</p>
            <div className="flex flex-wrap gap-2">
              {especialidadesPopulares
                .filter(esp => especialidades.includes(esp))
                .map(esp => (
                  <Badge
                    key={esp}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onEspecialidadeChange(esp)}
                  >
                    {esp}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Botão de Busca */}
        <Button 
          data-testid="search-button"
          onClick={() => {
            if (!especialidade || !estado || !cidade) {
              toast({
                title: "Preencha todos os filtros",
                description: "Por favor, selecione especialidade, estado e cidade para continuar.",
                variant: "default"
              });
              return;
            }
            onBuscar();
          }} 
          disabled={!podeBuscar} 
          className={cn(
            "w-full h-12 text-base font-semibold shadow-lg",
            "bg-gradient-to-r from-primary to-primary/90",
            "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
            "transition-all duration-200"
          )}
          size="lg"
        >
          <Search className="w-5 h-5 mr-2" />
          Buscar Médicos
        </Button>
      </CardContent>
    </Card>
  );
}
