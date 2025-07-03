import { useState, useEffect } from 'react';
import { encaminhamentoService, Encaminhamento, CreateEncaminhamentoData, UpdateEncaminhamentoData } from '@/services/encaminhamentoService';
import { useAuthState } from '@/hooks/useAuthState';
import { useToast } from '@/hooks/use-toast';

export const useEncaminhamentos = () => {
  const { user } = useAuthState();
  const { toast } = useToast();
  const [encaminhamentosEnviados, setEncaminhamentosEnviados] = useState<Encaminhamento[]>([]);
  const [encaminhamentosRecebidos, setEncaminhamentosRecebidos] = useState<Encaminhamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarEncaminhamentos = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [enviados, recebidos] = await Promise.all([
        encaminhamentoService.getEncaminhamentosEnviados(user.id),
        encaminhamentoService.getEncaminhamentosRecebidos(user.id)
      ]);

      setEncaminhamentosEnviados(enviados);
      setEncaminhamentosRecebidos(recebidos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar encaminhamentos';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarEncaminhamento = async (data: CreateEncaminhamentoData) => {
    const result = await encaminhamentoService.criarEncaminhamento(data);
    
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Encaminhamento criado com sucesso"
      });
      await carregarEncaminhamentos();
    } else {
      toast({
        title: "Erro",
        description: result.error?.message || "Erro ao criar encaminhamento",
        variant: "destructive"
      });
    }

    return result;
  };

  const atualizarEncaminhamento = async (id: string, data: UpdateEncaminhamentoData) => {
    const result = await encaminhamentoService.atualizarEncaminhamento(id, data);
    
    if (result.success) {
      const statusText = data.status === 'aceito' ? 'aceito' : 
                        data.status === 'rejeitado' ? 'rejeitado' : 'atualizado';
      
      toast({
        title: "Sucesso",
        description: `Encaminhamento ${statusText} com sucesso`
      });
      await carregarEncaminhamentos();
    } else {
      toast({
        title: "Erro",
        description: result.error?.message || "Erro ao atualizar encaminhamento",
        variant: "destructive"
      });
    }

    return result;
  };

  const buscarMedicosPorEspecialidade = async (especialidade: string) => {
    try {
      return await encaminhamentoService.getMedicosPorEspecialidade(especialidade);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar médicos';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    }
  };

  useEffect(() => {
    carregarEncaminhamentos();
  }, [user?.id]);

  return {
    encaminhamentosEnviados,
    encaminhamentosRecebidos,
    loading,
    error,
    criarEncaminhamento,
    atualizarEncaminhamento,
    buscarMedicosPorEspecialidade,
    carregarEncaminhamentos
  };
};