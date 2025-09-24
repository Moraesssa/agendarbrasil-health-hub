/**
 * Componente de Busca de Médicos
 * Interface para pacientes encontrarem e agendarem com médicos
 */

import React, { useState, useEffect } from 'react';
import { fixDoctorType } from '@/utils/temporaryFixes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  Video, 
  Star, 
  Clock, 
  Calendar,
  Filter,
  DollarSign,
  Stethoscope
} from 'lucide-react';

import SchedulingService, { Doctor, SearchFilters } from '@/services/schedulingService';
import { DoctorAvailability } from './DoctorAvailability';

interface DoctorSearchProps {
  onSelectDoctor?: (doctor: Doctor) => void;
  patientId?: string;
}

export const DoctorSearch: React.FC<DoctorSearchProps> = ({ 
  onSelectDoctor,
  patientId 
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const especialidades = [
    'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
    'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia',
    'Pediatria', 'Psiquiatria', 'Urologia', 'Clínica Geral'
  ];

  useEffect(() => {
    searchDoctors();
  }, [filters]);

  const searchDoctors = async () => {
    try {
      setLoading(true);
      const searchFilters = { ...filters };
      
      if (searchTerm) {
        searchFilters.especialidade = searchTerm;
      }

      const results = await SchedulingService.searchDoctors(searchFilters);
      setDoctors(results);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowAvailability(true);
    onSelectDoctor?.(doctor);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Consultar';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (showAvailability && selectedDoctor) {
    return (
      <DoctorAvailability
        doctor={selectedDoctor}
        patientId={patientId}
        onBack={() => setShowAvailability(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Encontrar Médicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por texto */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por especialidade ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchDoctors} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filtros avançados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select onValueChange={(value) => handleFilterChange('especialidade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map(esp => (
                  <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('estado', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('tipo_consulta', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Consulta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('rating_minimo', parseFloat(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Avaliação Mínima" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.5">4.5+ estrelas</SelectItem>
                <SelectItem value="4.0">4.0+ estrelas</SelectItem>
                <SelectItem value="3.5">3.5+ estrelas</SelectItem>
                <SelectItem value="3.0">3.0+ estrelas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros ativos */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                value && (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key}: {String(value)}
                    <button
                      onClick={() => handleFilterChange(key as keyof SearchFilters, undefined)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="text-red-500 hover:text-red-700"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Buscando médicos...</p>
          </div>
        ) : doctors.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum médico encontrado com os filtros selecionados.</p>
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((rawDoctor) => {
                    const doctor = fixDoctorType(rawDoctor);
                    return (
              <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={doctor.foto_perfil_url} />
                      <AvatarFallback>
                        {doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{doctor.nome}</h3>
                      <p className="text-sm text-muted-foreground">{doctor.especialidade}</p>
                      <p className="text-xs text-muted-foreground">CRM: {doctor.crm}/{doctor.uf_crm}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(doctor.rating)}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({doctor.total_avaliacoes})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Bio */}
                  {doctor.bio_perfil && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {doctor.bio_perfil}
                    </p>
                  )}

                  {/* Tipos de consulta disponíveis */}
                  <div className="flex flex-wrap gap-2">
                    {doctor.aceita_teleconsulta && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Teleconsulta
                      </Badge>
                    )}
                    {doctor.aceita_consulta_presencial && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Presencial
                      </Badge>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="space-y-1 text-sm">
                    {doctor.aceita_teleconsulta && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Teleconsulta:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(doctor.valor_consulta_teleconsulta)}
                        </span>
                      </div>
                    )}
                    {doctor.aceita_consulta_presencial && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Presencial:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(doctor.valor_consulta_presencial)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Durações */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Consulta padrão:</span>
                      <span>{doctor.duracao_consulta_padrao}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primeira consulta:</span>
                      <span>{doctor.duracao_consulta_inicial}min</span>
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <Button 
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                      Ver Disponibilidade
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSearch;