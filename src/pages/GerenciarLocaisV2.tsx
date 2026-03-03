import ComingSoonPage from '@/components/ComingSoonPage';
import { MapPin, Building2, Clock, Navigation } from 'lucide-react';

export default function GerenciarLocaisV2() {
  return (
    <ComingSoonPage
      title="Gerenciar Locais de Atendimento"
      description="Configure e administre todos os locais onde você atende."
      icon={MapPin}
      backPath="/gerenciar-agenda"
      backLabel="Voltar à Agenda"
      features={[
        { icon: Building2, label: 'Cadastro de consultórios e clínicas' },
        { icon: Clock, label: 'Horários de funcionamento por local' },
        { icon: Navigation, label: 'Endereço com mapa e instruções de acesso' },
      ]}
    />
  );
}
