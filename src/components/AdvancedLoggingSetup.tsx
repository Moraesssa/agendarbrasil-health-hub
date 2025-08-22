import React, { useState, useEffect } from 'react';
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

const AdvancedLoggingSetup: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allowlistEntry, setAllowlistEntry] = useState<AllowlistEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState('');

  useEffect(() => {
    if (user) {
      checkAllowlistStatus();
    }
  }, [user]);

  const checkAllowlistStatus = async () => {
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

      setAllowlistEntry(data);
    } catch (error) {
      console.error('Error checking allowlist:', error);
    }
  };

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
      checkAllowlistStatus();

      // Reload page to initialize advanced logger
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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

      // Reload page to disable advanced logger
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p><strong>Acesso liberado!</strong></p>
                <p>Você pode acessar o painel de debug em <code>/debug</code></p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Seu email para habilitar logging avançado:
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
                  Habilitar
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p><strong>Atenção:</strong></p>
                <p>O logging avançado captura informações detalhadas do navegador e deve ser usado apenas para debug.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedLoggingSetup;