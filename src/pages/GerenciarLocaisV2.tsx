import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Local {
  id: number;
  nome_local: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  instrucoes_acesso: string | null;
  ativo: boolean | null;
}

interface FormState {
  nome_local: string;
  cidade: string;
  estado: string;
  telefone: string;
  instrucoes_acesso: string;
  ativo: boolean;
}

const emptyForm: FormState = {
  nome_local: '',
  cidade: '',
  estado: '',
  telefone: '',
  instrucoes_acesso: '',
  ativo: true,
};

export default function GerenciarLocaisV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchLocais = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('id, nome_local, cidade, estado, telefone, instrucoes_acesso, ativo')
      .eq('medico_id', user.id)
      .order('id', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar locais', { description: error.message });
    } else {
      setLocais(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (l: Local) => {
    setEditingId(l.id);
    setForm({
      nome_local: l.nome_local ?? '',
      cidade: l.cidade ?? '',
      estado: l.estado ?? '',
      telefone: l.telefone ?? '',
      instrucoes_acesso: l.instrucoes_acesso ?? '',
      ativo: l.ativo ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.nome_local.trim() || !form.cidade.trim() || !form.estado.trim()) {
      toast.error('Preencha nome, cidade e estado');
      return;
    }
    setSaving(true);
    const payload = {
      nome_local: form.nome_local.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase().slice(0, 2),
      telefone: form.telefone.trim() || null,
      instrucoes_acesso: form.instrucoes_acesso.trim() || null,
      ativo: form.ativo,
      medico_id: user.id,
    };

    const { error } = editingId
      ? await supabase.from('locais_atendimento').update(payload).eq('id', editingId)
      : await supabase.from('locais_atendimento').insert(payload);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar local', { description: error.message });
      return;
    }
    toast.success(editingId ? 'Local atualizado' : 'Local criado');
    setDialogOpen(false);
    fetchLocais();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from('locais_atendimento')
      .delete()
      .eq('id', deleteId);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Local removido');
      fetchLocais();
    }
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/gerenciar-agenda')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à Agenda
        </Button>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Local
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-7 w-7 text-primary" />
          Locais de Atendimento
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os locais onde você atende seus pacientes.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : locais.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Você ainda não cadastrou nenhum local de atendimento.
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Primeiro Local
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locais.map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{l.nome_local}</CardTitle>
                  <Badge variant={l.ativo ? 'default' : 'secondary'}>
                    {l.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {l.cidade} - {l.estado}
                </p>
                {l.telefone && (
                  <p className="text-muted-foreground">📞 {l.telefone}</p>
                )}
                {l.instrucoes_acesso && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {l.instrucoes_acesso}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(l)}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(l.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Local' : 'Novo Local de Atendimento'}
            </DialogTitle>
            <DialogDescription>
              Informações básicas sobre o local onde você atende.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Local *</Label>
              <Input
                id="nome"
                value={form.nome_local}
                onChange={(e) => setForm({ ...form, nome_local: e.target.value })}
                placeholder="Ex: Clínica Central"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">UF *</Label>
                <Input
                  id="estado"
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value.toUpperCase() })
                  }
                  placeholder="SP"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 9999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrucoes">Instruções de Acesso</Label>
              <Textarea
                id="instrucoes"
                value={form.instrucoes_acesso}
                onChange={(e) =>
                  setForm({ ...form, instrucoes_acesso: e.target.value })
                }
                placeholder="Sala 305, 3º andar..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Local ativo</Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir local?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Pacientes não poderão mais agendar
              consultas neste local.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
