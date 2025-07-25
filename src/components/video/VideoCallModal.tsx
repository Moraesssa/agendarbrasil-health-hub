import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoCallInterface } from "./VideoCallInterface";
import { Video, AlertTriangle, Info } from "lucide-react";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    video_room_id: string | null;
    tipo_consulta: string;
    data_consulta: string;
  };
  userName: string;
  userEmail: string;
  isDoctor?: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  appointment,
  userName,
  userEmail,
  isDoctor = false
}) => {
  const [showVideoInterface, setShowVideoInterface] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const roomId = appointment.video_room_id || appointment.id;
  const appointmentTime = new Date(appointment.data_consulta);
  const now = new Date();
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const minutesUntilAppointment = Math.floor(timeDiff / (1000 * 60));

  const canStartCall = () => {
    // Permitir iniciar a chamada 15 minutos antes ou após o horário agendado
    return minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60;
  };

  const handleStartCall = async () => {
    setIsStarting(true);
    try {
      // Simular um pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowVideoInterface(true);
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCallEnd = () => {
    setShowVideoInterface(false);
    onClose();
  };

  const getTimeMessage = () => {
    if (minutesUntilAppointment > 15) {
      return {
        type: "info" as const,
        message: `A consulta está agendada para ${appointmentTime.toLocaleString('pt-BR')}. Você poderá iniciar a videochamada 15 minutos antes do horário.`
      };
    } else if (minutesUntilAppointment > 0) {
      return {
        type: "info" as const,
        message: `A consulta começará em ${minutesUntilAppointment} minutos. Você já pode entrar na sala de espera.`
      };
    } else if (minutesUntilAppointment >= -60) {
      return {
        type: "success" as const,
        message: "Você pode iniciar a videochamada agora."
      };
    } else {
      return {
        type: "warning" as const,
        message: "O horário da consulta já passou. Entre em contato para reagendar se necessário."
      };
    }
  };

  if (showVideoInterface) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <VideoCallInterface
            roomId={roomId}
            userName={userName}
            userEmail={userEmail}
            onCallEnd={handleCallEnd}
            isDoctor={isDoctor}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const timeMessage = getTimeMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Videochamada da Consulta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className={
            timeMessage.type === "success" ? "border-green-200 bg-green-50" :
            timeMessage.type === "warning" ? "border-yellow-200 bg-yellow-50" :
            "border-blue-200 bg-blue-50"
          }>
            {timeMessage.type === "warning" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>
              {timeMessage.message}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes da Consulta</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Tipo:</strong> {appointment.tipo_consulta}</p>
              <p><strong>Data:</strong> {appointmentTime.toLocaleDateString('pt-BR')}</p>
              <p><strong>Horário:</strong> {appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Sala:</strong> {roomId}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Dicas para uma boa consulta</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifique sua conexão de internet</li>
              <li>• Teste seu microfone e câmera antes de iniciar</li>
              <li>• Encontre um local silencioso e bem iluminado</li>
              <li>• Tenha seus documentos médicos em mãos</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={handleStartCall}
              disabled={!canStartCall() || isStarting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Iniciar Chamada
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};