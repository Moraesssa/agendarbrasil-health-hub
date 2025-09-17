import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Settings, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { medicoService } from '@/services/medicoService';

interface WorkingHoursBlock {
  id?: string;
  inicio: string;
  fim: string;
  ativo: boolean;
  inicioAlmoco?: string;
  fimAlmoco?: string;
  local_id?: string;
}

interface DaySchedule {
  dia: string;
  diaNome: string;
  blocos: WorkingHoursBlock[];
}

interface Location {
  id: string;
  nome_local: string;
}

const DAYS_OF_WEEK = [
  { key: 'segunda', name: 'Segunda-feira' },
  { key: 'terca', name: 'Terça-feira' },
  { key: 'quarta', name: 'Quarta-feira' },
  { key: 'quinta', name: 'Quinta-feira' },
  { key: 'sexta', name: 'Sexta-feira' },
  { key: 'sabado', name: 'Sábado' },
  { key: 'domingo', name: 'Domingo' }
];

const ALL_LOCATIONS_VALUE = 'all-locations';

const normalizeLocalIdForForm = (localId?: string | null) => {
  if (!localId || localId === ALL_LOCATIONS_VALUE) {
    return ALL_LOCATIONS_VALUE;
  }
  return localId;
};

const denormalizeLocalIdForPersist = (localId?: string | null) => {
  if (!localId || localId === ALL_LOCATIONS_VALUE) {
    return '';
  }
  return localId;
};

export const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [consultationDuration, setConsultationDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<WorkingHoursBlock | null>(null);
  
  const [blockForm, setBlockForm] = useState<WorkingHoursBlock>({
    inicio: '08:00',
    fim: '17:00',
    ativo: true,
    inicioAlmoco: '',
    fimAlmoco: '',
    local_id: ALL_LOCATIONS_VALUE
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load doctor config
      const { data: medicoData, error: medicoError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user?.id)
        .single();

      if (medicoError && medicoError.code !== 'PGRST116') {
        throw medicoError;
      }

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locais_atendimento')
        .select('id, nome_local')
        .eq('medico_id', user?.id)
        .eq('ativo', true);

      if (locationsError) throw locationsError;

      // Convert number IDs to strings for type compatibility
      const convertedLocations = (locationsData || []).map(loc => ({
        ...loc,
        id: String(loc.id)
      }));
      setLocations(convertedLocations);

      const config = (medicoData?.configuracoes as any) || {};
      setConsultationDuration(config.duracaoConsulta || 30);
      setBufferMinutes(config.bufferMinutos || 0);
      
      // Initialize schedule
      const horarioAtendimento = config.horarioAtendimento || {};
      const initialSchedule = DAYS_OF_WEEK.map(day => ({
        dia: day.key,
        diaNome: day.name,
        blocos: horarioAtendimento[day.key] || []
      }));
      
      setSchedule(initialSchedule);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar sua agenda.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const horarioAtendimento: Record<string, WorkingHoursBlock[]> = {};
      schedule.forEach(day => {
        horarioAtendimento[day.dia] = day.blocos;
      });

      const configuracoes = {
        duracaoConsulta: consultationDuration,
        bufferMinutos: bufferMinutes,
        horarioAtendimento
      };

      await medicoService.saveMedicoData({ configuracoes });

      toast({
        title: "Configurações salvas",
        description: "Sua agenda foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    }
  };

  const handleAddBlock = (dayKey: string) => {
    setEditingDay(dayKey);
    setEditingBlock(null);
    setBlockForm({
      inicio: '08:00',
      fim: '17:00',
      ativo: true,
      inicioAlmoco: '',
      fimAlmoco: '',
      local_id: ALL_LOCATIONS_VALUE
    });
    setIsDialogOpen(true);
  };

  const handleEditBlock = (dayKey: string, block: WorkingHoursBlock, blockIndex: number) => {
    setEditingDay(dayKey);
    setEditingBlock({ ...block, id: blockIndex.toString() });
    setBlockForm({
      ...block,
      local_id: normalizeLocalIdForForm(block.local_id)
    });
    setIsDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (!editingDay) return;

    const updatedSchedule = schedule.map(day => {
      if (day.dia === editingDay) {
        const newBlocos = [...day.blocos];
        const blockToSave: WorkingHoursBlock = {
          ...blockForm,
          local_id: denormalizeLocalIdForPersist(blockForm.local_id ?? editingBlock?.local_id)
        };

        if (!blockToSave.local_id) {
          delete blockToSave.local_id;
        }

        if (editingBlock) {
          // Editing existing block
          const blockIndex = parseInt(editingBlock.id!);
          newBlocos[blockIndex] = { ...blockToSave };
        } else {
          // Adding new block
          newBlocos.push({ ...blockToSave });
        }

        return { ...day, blocos: newBlocos };
      }
      return day;
    });

    setSchedule(updatedSchedule);
    setIsDialogOpen(false);
    
    // Auto-save
    setTimeout(saveConfiguration, 500);
  };

  const handleDeleteBlock = (dayKey: string, blockIndex: number) => {
    if (!confirm('Tem certeza que deseja excluir este bloco de horário?')) return;

    const updatedSchedule = schedule.map(day => {
      if (day.dia === dayKey) {
        const newBlocos = day.blocos.filter((_, index) => index !== blockIndex);
        return { ...day, blocos: newBlocos };
      }
      return day;
    });

    setSchedule(updatedSchedule);
    
    // Auto-save
    setTimeout(saveConfiguration, 500);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.nome_local : 'Todos os locais';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Horários</h2>
        <Button onClick={saveConfiguration}>
          <Settings className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Configurações Globais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="consultation-duration">Duração da Consulta (minutos)</Label>
              <Select value={consultationDuration.toString()} onValueChange={(value) => setConsultationDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="20">20 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="buffer-minutes">Intervalo entre consultas (minutos)</Label>
              <Select value={bufferMinutes.toString()} onValueChange={(value) => setBufferMinutes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem intervalo</SelectItem>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {schedule.map(day => (
          <Card key={day.dia}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {day.diaNome}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleAddBlock(day.dia)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Horário
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {day.blocos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum horário configurado</p>
                  <Button variant="ghost" size="sm" onClick={() => handleAddBlock(day.dia)} className="mt-2">
                    Adicionar primeiro horário
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {day.blocos.map((block, blockIndex) => (
                    <div key={blockIndex} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={block.ativo ? "default" : "secondary"}>
                            {block.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <span className="font-medium">
                            {formatTime(block.inicio)} - {formatTime(block.fim)}
                          </span>
                        </div>
                        
                        {block.inicioAlmoco && block.fimAlmoco && (
                          <div className="text-sm text-muted-foreground">
                            Almoço: {formatTime(block.inicioAlmoco)} - {formatTime(block.fimAlmoco)}
                          </div>
                        )}
                        
                        {block.local_id && (
                          <Badge variant="outline">
                            {getLocationName(block.local_id)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Editar horário"
                          onClick={() => handleEditBlock(day.dia, block, blockIndex)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Excluir horário"
                          onClick={() => handleDeleteBlock(day.dia, blockIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Block Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? 'Editar Horário' : 'Adicionar Horário'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicio">Horário de Início</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={blockForm.inicio}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, inicio: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="fim">Horário de Fim</Label>
                <Input
                  id="fim"
                  type="time"
                  value={blockForm.fim}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, fim: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicioAlmoco">Início do Almoço (opcional)</Label>
                <Input
                  id="inicioAlmoco"
                  type="time"
                  value={blockForm.inicioAlmoco || ''}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, inicioAlmoco: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="fimAlmoco">Fim do Almoço (opcional)</Label>
                <Input
                  id="fimAlmoco"
                  type="time"
                  value={blockForm.fimAlmoco || ''}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, fimAlmoco: e.target.value }))}
                />
              </div>
            </div>
            
            {locations.length > 0 && (
              <div>
                <Label htmlFor="local_id">Local Específico (opcional)</Label>
                <Select
                  value={normalizeLocalIdForForm(blockForm.local_id)}
                  onValueChange={(value) =>
                    setBlockForm(prev => ({
                      ...prev,
                      local_id: normalizeLocalIdForForm(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aplicar a todos os locais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_LOCATIONS_VALUE}>Todos os locais</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.nome_local}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={blockForm.ativo}
                onCheckedChange={(checked) => setBlockForm(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Horário ativo</Label>
            </div>
            
            {blockForm.inicioAlmoco && blockForm.fimAlmoco && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Consultas não poderão ser agendadas durante o horário de almoço
                </span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBlock}>
              {editingBlock ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};