import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataSource, DATA_TYPE_LABELS } from '@/types/integrations';
import { Shield, FileText, AlertTriangle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSource: ExternalDataSource;
  onConfirm: () => Promise<boolean>;
  isLoading: boolean;
}

export const ConsentModal = ({ 
  open, 
  onOpenChange, 
  dataSource, 
  onConfirm, 
  isLoading 
}: ConsentModalProps) => {
  const [understood, setUnderstood] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConfirm = async () => {
    if (!understood || !agreedToTerms) return;
    
    const success = await onConfirm();
    if (success) {
      setUnderstood(false);
      setAgreedToTerms(false);
      onOpenChange(false);
    }
  };

  const isValid = understood && agreedToTerms && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Termo de Consentimento Livre e Esclarecido - {dataSource.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Introducao */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANTE:</strong> Leia atentamente este termo antes de autorizar a integração.
                Você pode revogar este consentimento a qualquer momento.
              </AlertDescription>
            </Alert>

            {/* Finalidade */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">1. Finalidade do Tratamento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ao conceder este consentimento, você autoriza o <strong>AgendarBrasil</strong> a 
                receber e integrar automaticamente seus dados de saúde da fonte <strong>{dataSource.name}</strong> 
                em sua conta pessoal. Esta integração tem como objetivo centralizar seu histórico 
                médico para facilitar o acompanhamento de sua saúde.
              </p>
            </div>

            {/* Tipos de dados */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">2. Dados que Serão Coletados</h3>
              <p className="text-muted-foreground mb-2">
                Os seguintes tipos de dados poderão ser recebidos de <strong>{dataSource.name}</strong>:
              </p>
              <ul className="space-y-2">
                {dataSource.data_types.map((type, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    {DATA_TYPE_LABELS[type as keyof typeof DATA_TYPE_LABELS] || type}
                  </li>
                ))}
              </ul>
            </div>

            {/* Base legal */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">3. Base Legal (LGPD)</h3>
              <p className="text-muted-foreground leading-relaxed">
                O tratamento de seus dados pessoais sensíveis (dados de saúde) fundamenta-se 
                no <strong>consentimento livre, informado e inequívoco</strong> conforme Art. 11, 
                inciso I da Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
            </div>

            {/* Direitos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">4. Seus Direitos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conforme a LGPD, você possui os direitos de: <strong>acesso</strong> aos seus dados; 
                <strong>correção</strong> de dados incompletos ou incorretos; <strong>eliminação</strong> 
                de dados desnecessários; <strong>portabilidade</strong> para outro fornecedor; 
                <strong>revogação</strong> deste consentimento a qualquer momento; e <strong>informação</strong> 
                sobre com quem compartilhamos seus dados.
              </p>
            </div>

            {/* Segurança */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">5. Segurança e Armazenamento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são protegidos por <strong>criptografia de ponta a ponta</strong> e 
                armazenados em servidores seguros. Implementamos medidas técnicas e organizacionais 
                adequadas para proteger seus dados contra acesso não autorizado, alteração, 
                divulgação ou destruição.
              </p>
            </div>

            {/* Contato */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">6. Contato e Dúvidas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados, 
                entre em contato através do e-mail: <strong>privacidade@agendarbrasil.com.br</strong>
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Revogação:</strong> Você pode revogar este consentimento a qualquer momento 
                através da seção "Gerenciar Conexões" em seu perfil. A revogação não afeta a 
                legalidade do tratamento realizado antes da revogação.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        <div className="space-y-4 border-t pt-4">
          {/* Checkboxes de confirmação */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox 
                checked={understood} 
                onCheckedChange={(checked) => setUnderstood(checked === true)}
                className="mt-1"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Declaro que <strong>li e compreendi</strong> completamente este Termo de 
                Consentimento Livre e Esclarecido, incluindo a finalidade, os tipos de dados 
                que serão tratados e meus direitos como titular dos dados.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox 
                checked={agreedToTerms} 
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-1"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                <strong>Autorizo expressamente</strong> o AgendarBrasil a receber e integrar 
                meus dados de saúde da fonte "{dataSource.name}" conforme descrito neste termo.
              </span>
            </label>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!isValid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Processando...' : 'Concordo e Autorizo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};