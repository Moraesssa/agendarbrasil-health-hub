import ComingSoonPage from '@/components/ComingSoonPage';
import { Video, Monitor, Users, Shield } from 'lucide-react';

export default function Telemedicina() {
  return (
    <ComingSoonPage
      title="Teleconsulta"
      description="Consultas por videochamada com seus médicos, sem sair de casa."
      icon={Video}
      backPath="/perfil-medico"
      backLabel="Voltar ao Perfil"
      features={[
        { icon: Monitor, label: 'Videochamada HD com compartilhamento de tela' },
        { icon: Users, label: 'Sala de espera virtual com notificações' },
        { icon: Shield, label: 'Conexão criptografada e segura (HIPAA)' },
      ]}
    />
  );
}
