import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, Clock, Phone, Globe, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Location {
  id: string;
  nome_local: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone?: string;
  website?: string;
  ativo: boolean;
  status: 'ativo' | 'temporariamente_fechado' | 'manutencao';
  coordenadas?: { lat: number; lng: number };
  facilidades: string[];
  instrucoes_acesso?: string;
}

interface LocationFormData {
  nome_local: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  website: string;
  ativo: boolean;
  facilidades: string[];
  instrucoes_acesso: string;
}

const COMMON_FACILITIES = [
  'Estacionamento',
  'Acessibilidade',
  'Wi-Fi',
  'Ar Condicionado',
  'Recepção 24h',
  'Laboratório',
  'Farmácia',
  'Café',
  'Banheiro Adaptado'
];

export const LocationManagement: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    nome_local: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    website: '',
    ativo: true,
    facilidades: [],
    instrucoes_acesso: ''
  });

  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locais_atendimento')
        .select('*')
        .eq('medico_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations((data as any[]) || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "Erro ao carregar locais",
        description: "Não foi possível carregar seus locais de atendimento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_local: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      website: '',
      ativo: true,
      facilidades: [],
      instrucoes_acesso: ''
    });
    setEditingLocation(null);
  };

  const handleSave = async () => {
    try {
      const locationData = {
        medico_id: user?.id,
        nome_local: formData.nome_local,
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento || '',
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep
        },
        telefone: formData.telefone || '',
        website: formData.website || '',
        ativo: formData.ativo,
        status: formData.ativo ? 'ativo' : 'temporariamente_fechado',
        facilidades: formData.facilidades,
        instrucoes_acesso: formData.instrucoes_acesso || ''
      };

      let error;
      if (editingLocation) {
        ({ error } = await supabase
          .from('locais_atendimento')
          .update(locationData)
          .eq('id', editingLocation.id));
      } else {
        ({ error } = await supabase
          .from('locais_atendimento')
          .insert(locationData));
      }

      if (error) throw error;

      toast({
        title: editingLocation ? "Local atualizado" : "Local adicionado",
        description: "Suas informações foram salvas com sucesso.",
      });

      setIsDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o local. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      nome_local: location.nome_local,
      logradouro: location.endereco.logradouro,
      numero: location.endereco.numero,
      complemento: location.endereco.complemento || '',
      bairro: location.endereco.bairro,
      cidade: location.endereco.cidade,
      estado: location.endereco.estado,
      cep: location.endereco.cep,
      telefone: location.telefone || '',
      website: location.website || '',
      ativo: location.ativo,
      facilidades: location.facilidades || [],
      instrucoes_acesso: location.instrucoes_acesso || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;

    try {
      const { error } = await supabase
        .from('locais_atendimento')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      toast({
        title: "Local excluído",
        description: "O local foi removido com sucesso.",
      });

      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o local.",
        variant: "destructive"
      });
    }
  };

  const toggleFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilidades: prev.facilidades.includes(facility)
        ? prev.facilidades.filter(f => f !== facility)
        : [...prev.facilidades, facility]
    }));
  };

  const getStatusBadge = (location: Location) => {
    if (!location.ativo) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>;
    }
    return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Estabelecimentos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Local
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Editar Local' : 'Adicionar Novo Local'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nome_local">Nome do Local *</Label>
                  <Input
                    id="nome_local"
                    value={formData.nome_local}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_local: e.target.value }))}
                    placeholder="Ex: Clínica Medical Center"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logradouro">Logradouro *</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                    placeholder="Ex: Rua das Flores"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="123"
                  />
                </div>
                
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                    placeholder="Sala 101"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Centro"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label htmlFor="ativo">Local ativo</Label>
              </div>
              
              <div>
                <Label>Facilidades</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {COMMON_FACILITIES.map(facility => (
                    <div key={facility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`facility-${facility}`}
                        checked={formData.facilidades.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                        className="rounded border-border"
                      />
                      <Label htmlFor={`facility-${facility}`} className="text-sm">
                        {facility}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="instrucoes_acesso">Instruções de Acesso</Label>
                <Textarea
                  id="instrucoes_acesso"
                  value={formData.instrucoes_acesso}
                  onChange={(e) => setFormData(prev => ({ ...prev, instrucoes_acesso: e.target.value }))}
                  placeholder="Instruções especiais para encontrar o local..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingLocation ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum local cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione seus locais de atendimento para que os pacientes possam agendar consultas.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Local
              </Button>
            </CardContent>
          </Card>
        ) : (
          locations.map(location => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {location.nome_local}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {location.endereco.logradouro}, {location.endereco.numero}
                      {location.endereco.complemento && `, ${location.endereco.complemento}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(location)}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(location.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {location.endereco.bairro}, {location.endereco.cidade}/{location.endereco.estado}
                  <br />
                  CEP: {location.endereco.cep}
                </div>
                
                {(location.telefone || location.website) && (
                  <div className="flex gap-4 text-sm">
                    {location.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {location.telefone}
                      </div>
                    )}
                    {location.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {location.facilidades && location.facilidades.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {location.facilidades.map(facility => (
                      <Badge key={facility} variant="secondary" className="text-xs">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {location.instrucoes_acesso && (
                  <div className="text-sm bg-muted p-3 rounded">
                    <strong>Instruções de acesso:</strong>
                    <p className="mt-1">{location.instrucoes_acesso}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};