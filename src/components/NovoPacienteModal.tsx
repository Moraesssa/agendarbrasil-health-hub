import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Assuming these components are available from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"; // Assuming these components are available from "@/components/ui/input"
import { Button } from "@/components/ui/button"; // Assuming these components are available from "@/components/ui/button"
import { Label } from "@/components/ui/label"; // Assuming these components are available from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming these components are available from "@/components/ui/select"
import { Plus, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client"; // Assuming supabase client is available

interface NovoPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientData: { display_name: string; email: string; password?: string; user_type: string }) => Promise<void>;
}

const NovoPacienteModal: React.FC<NovoPacienteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // State for password
  const [userType, setUserType] = useState('paciente'); // Default to 'paciente'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setDisplayName('');
      setEmail('');
      setUserType('paciente');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      toast({ title: "Campos inválidos", description: "Por favor, preencha o nome, email e senha.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Pass password along with other data
      await onSubmit({ display_name: displayName, email: email, password: password, user_type: userType });
      toast({ title: "Paciente cadastrado com sucesso!", description: `O paciente ${displayName} foi adicionado.` });
      onClose();
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar paciente", description: error.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (open) { /* do nothing, controlled by onClose */ } else { onClose(); } }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para adicionar um novo paciente ao seu sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">Nome Completo</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            {/* Assuming user_type selection might be needed in the future, but for now, it's fixed to 'paciente' */}
            {/*
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userType" className="text-right">Tipo de Usuário</Label>
              <Select value={userType} onValueChange={setUserType} disabled={isLoading}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Paciente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoPacienteModal;