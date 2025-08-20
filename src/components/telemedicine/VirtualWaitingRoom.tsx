import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Settings, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Users,
  Wifi
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VirtualWaitingRoomProps {
  appointment: {
    id: string;
    data_consulta: string;
    tipo_consulta: string;
    medico?: {
      dados_profissionais?: {
        nome: string;
        especialidade: string;
      };
    };
  };
  onJoinCall: () => void;
  isDoctor?: boolean;
}

export const VirtualWaitingRoom: React.FC<VirtualWaitingRoomProps> = ({
  appointment,
  onJoinCall,
  isDoctor = false
}) => {
  const [isTestingDevices, setIsTestingDevices] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    camera: 'untested' as 'untested' | 'testing' | 'success' | 'error',
    microphone: 'untested' as 'untested' | 'testing' | 'success' | 'error',
    connection: 'untested' as 'untested' | 'testing' | 'success' | 'error'
  });
  const [timeUntilConsultation, setTimeUntilConsultation] = useState<string>("");
  const { toast } = useToast();

  const appointmentTime = new Date(appointment.data_consulta);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = appointmentTime.getTime() - now.getTime();
      
      if (diff > 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (minutes > 0) {
          setTimeUntilConsultation(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilConsultation(`${seconds}s`);
        }
      } else {
        setTimeUntilConsultation("Consulta disponível");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appointmentTime]);

  const testDevices = async () => {
    setIsTestingDevices(true);
    
    // Test camera
    setDeviceStatus(prev => ({ ...prev, camera: 'testing' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setDeviceStatus(prev => ({ ...prev, camera: 'success' }));
    } catch (error) {
      setDeviceStatus(prev => ({ ...prev, camera: 'error' }));
    }

    // Test microphone
    setDeviceStatus(prev => ({ ...prev, microphone: 'testing' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setDeviceStatus(prev => ({ ...prev, microphone: 'success' }));
    } catch (error) {
      setDeviceStatus(prev => ({ ...prev, microphone: 'error' }));
    }

    // Test connection (simulated)
    setDeviceStatus(prev => ({ ...prev, connection: 'testing' }));
    setTimeout(() => {
      setDeviceStatus(prev => ({ ...prev, connection: 'success' }));
      setIsTestingDevices(false);
      
      toast({
        title: "Teste concluído",
        description: "Seus dispositivos estão prontos para a videochamada",
      });
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const canJoinCall = () => {
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const minutesUntilAppointment = Math.floor(timeDiff / (1000 * 60));
    
    return minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            Sala de Espera Virtual
          </CardTitle>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {timeUntilConsultation}
            </Badge>
            {isDoctor && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Users className="h-4 w-4 mr-1" />
                Médico
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Consulta agendada para <strong>{appointmentTime.toLocaleDateString('pt-BR')}</strong> às{' '}
              <strong>{appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </p>
            
            {appointment.medico?.dados_profissionais && (
              <p className="text-sm text-gray-500">
                Dr(a). {appointment.medico.dados_profissionais.nome} - {appointment.medico.dados_profissionais.especialidade}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Teste de Dispositivos
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {deviceStatus.camera === 'success' ? (
                <Video className="h-5 w-5 text-green-600" />
              ) : (
                <VideoOff className="h-5 w-5 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-medium">Câmera</p>
                <p className="text-sm text-gray-600">
                  {deviceStatus.camera === 'success' ? 'Funcionando' : 
                   deviceStatus.camera === 'error' ? 'Erro' : 'Não testada'}
                </p>
              </div>
              {getStatusIcon(deviceStatus.camera)}
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {deviceStatus.microphone === 'success' ? (
                <Mic className="h-5 w-5 text-green-600" />
              ) : (
                <MicOff className="h-5 w-5 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-medium">Microfone</p>
                <p className="text-sm text-gray-600">
                  {deviceStatus.microphone === 'success' ? 'Funcionando' : 
                   deviceStatus.microphone === 'error' ? 'Erro' : 'Não testado'}
                </p>
              </div>
              {getStatusIcon(deviceStatus.microphone)}
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Wifi className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Conexão</p>
                <p className="text-sm text-gray-600">
                  {deviceStatus.connection === 'success' ? 'Estável' : 
                   deviceStatus.connection === 'error' ? 'Instável' : 'Não testada'}
                </p>
              </div>
              {getStatusIcon(deviceStatus.connection)}
            </div>
          </div>

          <Button
            onClick={testDevices}
            disabled={isTestingDevices}
            variant="outline"
            className="w-full"
          >
            {isTestingDevices ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                Testando dispositivos...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Testar Dispositivos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Preparação para a consulta:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Encontre um local silencioso e bem iluminado</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Tenha seus documentos e exames médicos em mãos</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Verifique se sua conexão de internet está estável</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Feche outros aplicativos que possam consumir banda</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Join Call Button */}
      {!canJoinCall() ? (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            A videochamada estará disponível 15 minutos antes do horário agendado.
          </AlertDescription>
        </Alert>
      ) : (
        <Button 
          onClick={onJoinCall}
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Video className="h-5 w-5 mr-2" />
          Entrar na Consulta
        </Button>
      )}
    </div>
  );
};