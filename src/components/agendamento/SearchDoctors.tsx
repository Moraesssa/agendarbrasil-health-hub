import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Star, Phone } from 'lucide-react';
import { SchedulingService, Doctor, SearchFilters } from '@/services/schedulingService';
import { toast } from 'sonner';

interface SearchDoctorsProps {
  onSelectDoctor: (doctor: Doctor) => void;
}

export function SearchDoctors({ onSelectDoctor }: SearchDoctorsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar cidades quando estado muda
  useEffect(() => {
    if (filters.estado) {
      loadCidades(filters.estado);
    }
  }, [filters.estado]);

  const loadInitialData = async () => {
    try {
      const [especialidadesData, estadosData] = await Promise.all([
        SchedulingService.getSpecialties(),
        SchedulingService.getStates()
      ]);
      
      setEspecialidades(especialidadesData);
      setEstados(estadosData);
      
      // Buscar médicos iniciais
      searchDoctors();
    } catch (error) {
      toast.error('Erro ao carregar dados iniciais');
      console.error(error);
    }
  };

  const loadCidades = async (estado: string) => {
    try {
      const cidadesData = await SchedulingService.getCities(estado);
      setCidades(cidadesData);
    } catch (error) {
      toast.error('Erro ao carregar cidades');
      console.error(error);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const results = await SchedulingService.searchDoctors(filters);
      setDoctors(results);
    } catch (error) {
      toast.error('Erro ao buscar médicos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Limpar cidade se estado mudou
    if (key === 'estado' && filters.estado !== value) {
      newFilters.cidade = undefined;
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setCidades([]);
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Especialidade</label>
              <Select
                value={filters.especialidade || ''}
                onValueChange={(value) => handleFilterChange('especialidade', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as especialidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as especialidades</SelectItem>
                  {especialidades.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filters.estado || ''}
                onValueChange={(value) => handleFilterChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cidade</label>
              <Select
                value={filters.cidade || ''}
                onValueChange={(value) => handleFilterChange('cidade', value)}
                disabled={!filters.estado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as cidades</SelectItem>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Consulta</label>
              <Select
                value={filters.tipo_consulta || ''}
                onValueChange={(value) => handleFilterChange('tipo_consulta', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={filters.valor_maximo || ''}
                onChange={(e) => handleFilterChange('valor_maximo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={searchDoctors} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar Médicos'}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{doctor.nome}</h3>
                  <p className="text-sm text-muted-foreground">CRM: {doctor.crm}/{doctor.uf_crm}</p>
                </div>
                <Badge variant="secondary">{doctor.especialidade}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                {doctor.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {doctor.telefone}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  {doctor.valor_consulta_presencial && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Presencial: R$ {doctor.valor_consulta_presencial.toFixed(2)}</span>
                    </div>
                  )}
                  {doctor.valor_consulta_teleconsulta && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Online: R$ {doctor.valor_consulta_teleconsulta.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Consulta: {doctor.duracao_consulta_padrao} min</span>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {doctor.aceita_consulta_presencial && (
                  <Badge variant="outline">Presencial</Badge>
                )}
                {doctor.aceita_teleconsulta && (
                  <Badge variant="outline">Teleconsulta</Badge>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={() => onSelectDoctor(doctor)}
              >
                Selecionar Médico
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {doctors.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum médico encontrado com os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}