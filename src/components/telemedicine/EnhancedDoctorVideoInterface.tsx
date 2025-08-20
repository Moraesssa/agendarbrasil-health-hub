import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  FileText, 
  Stethoscope, 
  Maximize2, 
  Minimize2,
  MessageSquare,
  Phone,
  PhoneOff,
  Settings
} from "lucide-react";
import { VideoCallInterface } from "@/components/video/VideoCallInterface";
import { PatientMedicalRecord } from "./PatientMedicalRecord";
import { DoctorConsultationTools } from "./DoctorConsultationTools";

interface EnhancedDoctorVideoInterfaceProps {
  roomId: string;
  userName: string;
  userEmail: string;
  appointment: {
    id: string;
    paciente_id: string;
    data_consulta: string;
    tipo_consulta: string;
    paciente?: {
      display_name: string;
      email: string;
    };
  };
  onCallEnd: () => void;
}

export const EnhancedDoctorVideoInterface: React.FC<EnhancedDoctorVideoInterfaceProps> = ({
  roomId,
  userName,
  userEmail,
  appointment,
  onCallEnd
}) => {
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState("record");
  const [showChat, setShowChat] = useState(false);

  const toggleVideoSize = () => {
    setIsVideoMaximized(!isVideoMaximized);
  };

  const appointmentTime = new Date(appointment.data_consulta);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Video className="h-3 w-3 mr-1" />
            Consulta Ativa
          </Badge>
          <div>
            <h2 className="font-semibold">
              {appointment.paciente?.display_name || 'Paciente'}
            </h2>
            <p className="text-sm text-gray-500">
              {appointmentTime.toLocaleDateString('pt-BR')} às{' '}
              {appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVideoSize}
          >
            {isVideoMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCallEnd}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Encerrar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Medical Record & Tools */}
        <div className={`${isVideoMaximized ? 'w-0 hidden' : 'w-1/3'} border-r bg-white transition-all duration-300`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="record" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prontuário
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Ferramentas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="record" className="flex-1 m-0 p-4">
              <PatientMedicalRecord 
                patientId={appointment.paciente_id}
                appointmentId={appointment.id}
              />
            </TabsContent>
            
            <TabsContent value="tools" className="flex-1 m-0 p-4">
              <div className="h-full overflow-auto">
                <DoctorConsultationTools 
                  appointmentId={appointment.id}
                  patientId={appointment.paciente_id}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Panel - Video */}
        <div className={`${isVideoMaximized ? 'flex-1' : 'w-2/3'} flex flex-col transition-all duration-300`}>
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <VideoCallInterface
                  roomId={roomId}
                  userName={userName}
                  userEmail={userEmail}
                  onCallEnd={onCallEnd}
                  isDoctor={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Chat (if enabled) */}
        {showChat && !isVideoMaximized && (
          <div className="w-80 border-l bg-white">
            <div className="p-4 border-b">
              <h3 className="font-medium">Chat da Consulta</h3>
            </div>
            <div className="flex-1 p-4">
              <div className="text-center text-gray-500 text-sm">
                Chat em tempo real durante a consulta
                <br />
                (Funcionalidade em desenvolvimento)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Consulta iniciada às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <Badge variant="outline" className="text-xs">
              Dr. {userName}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};