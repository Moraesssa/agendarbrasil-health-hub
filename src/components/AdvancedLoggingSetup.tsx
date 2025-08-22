import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Terminal, UserCheck, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AllowlistEntry {
  id: string;
  user_id: string;
  email: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface AdvancedLoggingSetupProps {
  onStatusChange: () => void;
}

const AdvancedLoggingSetup: React.FC<AdvancedLoggingSetupProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allowlistEntry, setAllowlistEntry] = useState<AllowlistEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState('');

  const checkAllowlistStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debug_allowlist')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking allowlist:', error);
        return;
      }

      setAllowlistEntry(data as AllowlistEntry | null);
    } catch (error) {
      console.error('Error checking allowlist:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkAllowlistStatus();
      // Pre-fill email field if not already filled
      if (!emailToAdd && user.email) {
        setEmailToAdd(user.email);
      }
    }
  }, [user, checkAllowlistStatus, emailToAdd]);

  const addToAllowlist = async () => {
    if (!user || !emailToAdd) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('debug_allowlist')
        .insert({
          user_id: user.id,
          email: emailToAdd,
          granted_by: user.id,
          is_active: true
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Acesso concedido',
        description: 'Logging avançado foi habilitado para sua conta.'
      });

      setEmailToAdd('');
      await checkAllowlistStatus();

      // Add a small delay to account for database replication lag
      setTimeout(() => {
        onStatusChange();
      }, 500);
    } catch (error) {
      console.error('Error adding to allowlist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível habilitar o logging avançado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromAllowlist = async () => {
    if (!allowlistEntry) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('debug_allowlist')
        .update({ is_active: false })
        .eq('id', allowlistEntry.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Acesso removido',
        description: 'Logging avançado foi desabilitado para sua conta.'
      });

      setAllowlistEntry(null);
      onStatusChange();
    } catch (error) {
      console.error('Error removing from allowlist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desabilitar o logging avançado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Configuração de Logging Avançado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowlistEntry && allowlistEntry.is_active ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <UserCheck className="w-4 h-4 mr-1" />
                Ativo
              </Badge>
              <span className="text-sm text-muted-foreground">
                Logging avançado está habilitado para sua conta
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Email:</strong> {allowlistEntry.email}
              </div>
              <div>
                <strong>Ativo desde:</strong> {new Date(allowlistEntry.granted_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
              <Info className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p><strong>Logging avançado ativado!</strong></p>
                <p>Agora você pode usar todas as abas do sistema de debug avançado:</p>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Logs em Tempo Real - Visualize logs capturados</li>
                  <li>Ferramentas de Teste - Gere logs e teste captura de erros</li>
                  <li>Informações do Sistema - Veja detalhes da sessão e navegador</li>
                </ul>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={removeFromAllowlist}
              disabled={loading}
            >
              Desabilitar Logging Avançado
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Inativo
              </Badge>
              <span className="text-sm text-muted-foreground">
                Logging avançado não está habilitado
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p><strong>Como ativar o logging avançado:</strong></p>
                  <ol className="mt-1 ml-4 list-decimal">
                    <li>Confirme seu email abaixo</li>
                    <li>Clique em "Habilitar"</li>
                    <li>A página será recarregada com todas as funcionalidades ativas</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email para ativar logging avançado:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="seu-email@exemplo.com"
                    value={emailToAdd}
                    onChange={(e) => setEmailToAdd(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addToAllowlist}
                    disabled={loading || !emailToAdd}
                  >
                    {loading ? 'Ativando...' : 'Habilitar'}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p><strong>Sobre o sistema de logging:</strong></p>
                  <p>• Captura informações detalhadas para debug e análise</p>
                  <p>• Inclui logs do console, erros JavaScript e dados de navegação</p>
                  <p>• Use apenas para desenvolvimento e resolução de problemas</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedLoggingSetup;