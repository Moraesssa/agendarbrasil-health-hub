/**
 * Busca Inteligente de Médicos
 * Componente funcional com IA para encontrar médicos
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  MapPin, 
  Video, 
  Clock, 
  Star, 
  Brain,
  Zap,
  Users,
  Filter,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import intelligentSchedulingService, { Doctor, SmartRecommendation } from '@/services/intelligentSchedulingService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface IntelligentDoctorSearchProps {
  onSelectDoctor: (doctor: Doctor) => void;
  patientId?: string;
}

export const IntelligentDoctorSearch: React.FC<IntelligentDoctorSearchProps> = ({
  onSelectDoctor,
  patientId
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [consultationType, setConsultationType] = useState<'presencial' | 'teleconsulta' | 'both'>('both');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'emergency'>('normal');
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Especialidades disponíveis
  const specialties = [
    'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
    'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia', 'Pediatria',
    'Psiquiatria', 'Urologia', 'Clínica Geral'
  ];

  // Estados brasileiros
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Buscar médicos automaticamente quando filtros mudam
  useEffect(() => {
    if (specialty || city || state) {
      handleSearch();
    }
  }, [specialty, city, state, consultationType, urgency]);

  // Carregar recomendações inteligentes ao iniciar
  useEffect(() => {
    if (patientId || user?.id) {
      loadSmartRecommendations();
    }
  }, [patientId, user?.id]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await intelligentSchedulingService.searchDoctorsIntelligent({
        specialty: specialty || undefined,
        city: city || undefined,
        state: state || undefined,
        consultation_type: consultationType === 'both' ? undefined : consultationType,
        patient_id: patientId || user?.id,
        urgency
      });

      setDoctors(results);

      if (results.length === 0) {
        toast({
          title: "Nenhum médico encontrado",
          description: "Tente ajustar os filtros de busca",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar médicos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSmartRecommendations = async () => {
    try {
      const recs = await intelligentSchedulingService.getSmartRecommendations({
        patient_id: patientId || user?.id || '',
        specialty: specialty || undefined,
        urgency,
        preferred_type: consultationType === 'both' ? undefined : consultationType
      });
      setRecommendations(recs);
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDoctorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            Recomendações Inteligentes para Você
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.slice(0, 2).map((rec, index) => {
              const doctor = doctors.find(d => d.id === rec.doctor_id);
              if (!doctor) return null;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={doctor.foto_perfil_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getDoctorInitials(doctor.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{doctor.nome}</div>
                      <div className="text-sm text-gray-600">{doctor.especialidade}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          {Math.round(rec.confidence * 100)}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {rec.estimated_wait_time}min espera
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onSelectDoctor(doctor)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Agendar
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Encontrar Médico
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por nome */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome do médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {specialties.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {states.map(st => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Select value={consultationType} onValueChange={(value: any) => setConsultationType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Ambos</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Urgência */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Urgência:</span>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
                { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
                { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
                { value: 'emergency', label: 'Emergência', color: 'bg-red-100 text-red-800' }
              ].map(option => (
                <Badge
                  key={option.value}
                  className={`cursor-pointer ${urgency === option.value ? option.color : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setUrgency(option.value as any)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações Inteligentes */}
      {renderRecommendations()}

      {/* Lista de Médicos */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Buscando médicos com IA...</p>
          </CardContent>
        </Card>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={doctor.foto_perfil_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {getDoctorInitials(doctor.nome)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{doctor.nome}</h3>
                        <p className="text-gray-600">{doctor.especialidade}</p>
                        <p className="text-sm text-gray-500">CRM {doctor.crm}/{doctor.uf_crm}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Tipos de consulta disponíveis */}
                    <div className="flex gap-2 mb-3">
                      {doctor.aceita_consulta_presencial && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Presencial - {formatPrice(doctor.valor_consulta_presencial)}
                        </Badge>
                      )}
                      {doctor.aceita_teleconsulta && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          Online - {formatPrice(doctor.valor_consulta_teleconsulta)}
                        </Badge>
                      )}
                    </div>

                    {/* Locais de atendimento */}
                    {doctor.locais_atendimento.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Locais de atendimento:</p>
                        <div className="flex flex-wrap gap-1">
                          {doctor.locais_atendimento.slice(0, 2).map((local) => (
                            <Badge key={local.id} variant="secondary" className="text-xs">
                              {local.cidade}, {local.estado}
                            </Badge>
                          ))}
                          {doctor.locais_atendimento.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{doctor.locais_atendimento.length - 2} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bio do médico */}
                    {doctor.bio_perfil && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {doctor.bio_perfil}
                      </p>
                    )}

                    <Button
                      onClick={() => onSelectDoctor(doctor)}
                      className="w-full"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Agendar Consulta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum médico encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros de busca ou remover alguns critérios
            </p>
            <Button onClick={() => {
              setSpecialty('');
              setCity('');
              setState('');
              setConsultationType('both');
              handleSearch();
            }}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentDoctorSearch;