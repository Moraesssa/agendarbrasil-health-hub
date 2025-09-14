/**
 * Busca de Médicos utilizando serviço unificado
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Star, Video, MapPin } from 'lucide-react';
import schedulingService, { Doctor } from '@/services/scheduling';
import { useToast } from '@/hooks/use-toast';

interface IntelligentDoctorSearchProps {
  onSelectDoctor: (doctor: Doctor) => void;
  patientId?: string;
}

export const IntelligentDoctorSearch: React.FC<IntelligentDoctorSearchProps> = ({
  onSelectDoctor
}) => {
  const { toast } = useToast();
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const specialties = ['Cardiologia', 'Dermatologia', 'Ginecologia', 'Ortopedia', 'Pediatria'];
  const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await schedulingService.searchDoctors(specialty, state, city);
      setDoctors(results);
      if (results.length === 0) {
        toast({ title: 'Nenhum médico encontrado', description: 'Tente ajustar os filtros', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro na busca', description: 'Não foi possível buscar médicos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getDoctorInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(price);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" /> Buscar Médicos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent>
              {specialties.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Cidade" value={city} onChange={e=>setCity(e.target.value)} />
          <Select value={state} onValueChange={setState}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {states.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading} className="md:col-span-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map(doctor => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={()=>onSelectDoctor(doctor)}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={(doctor as any).foto_perfil_url} />
                    <AvatarFallback>{getDoctorInitials(doctor.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{doctor.display_name}</h3>
                        {doctor.crm && <p className="text-sm text-gray-500">CRM {doctor.crm}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">5.0</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs"><MapPin className="w-3 h-3 mr-1" />Presencial</Badge>
                      <Badge variant="outline" className="text-xs"><Video className="w-3 h-3 mr-1" />Online</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">A partir de {formatPrice(150)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntelligentDoctorSearch;
