import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { agendamentoService } from '@/services/agendamento';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encontre seu médico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Especialidade</label>
          <Select value={especialidade} onValueChange={onEspecialidadeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma especialidade" />
            </SelectTrigger>
            <SelectContent>
              {especialidades.map(esp => (
                <SelectItem key={esp} value={esp}>{esp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select value={estado} onValueChange={onEstadoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map(est => (
                  <SelectItem key={est.uf} value={est.uf}>{est.uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cidade</label>
            <Select value={cidade} onValueChange={onCidadeChange} disabled={!estado || loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione a cidade"} />
              </SelectTrigger>
              <SelectContent>
                {cidades.map(cid => (
                  <SelectItem key={cid.cidade} value={cid.cidade}>{cid.cidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={onBuscar} disabled={!podeBuscar} className="w-full" size="lg">
          <Search className="w-4 h-4 mr-2" />
          Buscar Médicos
        </Button>
      </CardContent>
    </Card>
  );
}
