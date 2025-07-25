import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings, Users, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCallInterfaceProps {
  roomId: string;
  userName: string;
  userEmail: string;
  onCallEnd: () => void;
  isDoctor?: boolean;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  roomId,
  userName,
  userEmail,
  onCallEnd,
  isDoctor = false
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();
        setIsLoading(false);

        if (jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
          const domain = 'meet.jit.si';
          const options = {
            roomName: `mediconnect_${roomId}`,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
              displayName: userName,
              email: userEmail
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              enableWelcomePage: false,
              enableUserRolesBasedOnToken: false,
              prejoinPageEnabled: false,
              startScreenSharing: false,
              enableEmailInStats: false,
              enableClosePage: false,
              toolbarButtons: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 
                'fullscreen', 'fodeviceselection', 'hangup', 'profile',
                'chat', 'recording', 'livestreaming', 'etherpad',
                'sharedvideo', 'settings', 'raisehand', 'videoquality',
                'filmstrip', 'participants-pane', 'invite', 'feedback',
                'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
                'download', 'help', 'mute-everyone', 'security'
              ]
            },
            interfaceConfigOverwrite: {
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop',
                'fullscreen', 'fodeviceselection', 'hangup', 'profile',
                'chat', 'settings', 'raisehand', 'videoquality',
                'filmstrip', 'participants-pane', 'tileview'
              ],
              SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              BRAND_WATERMARK_LINK: "",
              SHOW_POWERED_BY: false,
              GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
              DISPLAY_WELCOME_PAGE_CONTENT: false,
              APP_NAME: "MediConnect",
              NATIVE_APP_NAME: "MediConnect",
              PROVIDER_NAME: "MediConnect",
              HIDE_INVITE_MORE_HEADER: true
            }
          };

          const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
          setApi(jitsiApi);

          // Event listeners
          jitsiApi.addEventListener('videoConferenceJoined', () => {
            setIsConnected(true);
            setParticipants(1);
            toast({
              title: "Conectado à videochamada",
              description: "Você entrou na sala de consulta virtual.",
            });
          });

          jitsiApi.addEventListener('participantJoined', () => {
            setParticipants(prev => prev + 1);
          });

          jitsiApi.addEventListener('participantLeft', () => {
            setParticipants(prev => Math.max(0, prev - 1));
          });

          jitsiApi.addEventListener('audioMuteStatusChanged', (event: any) => {
            setIsMuted(event.muted);
          });

          jitsiApi.addEventListener('videoMuteStatusChanged', (event: any) => {
            setIsVideoOff(event.muted);
          });

          jitsiApi.addEventListener('readyToClose', () => {
            onCallEnd();
          });

          jitsiApi.addEventListener('videoConferenceLeft', () => {
            onCallEnd();
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar Jitsi:', error);
        toast({
          title: "Erro na videochamada",
          description: "Não foi possível conectar à videochamada. Tente novamente.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    initializeJitsi();

    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [roomId, userName, userEmail, onCallEnd, toast]);

  const toggleMute = () => {
    if (api) {
      api.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
    }
  };

  const hangUp = () => {
    if (api) {
      api.executeCommand('hangup');
    }
    onCallEnd();
  };

  const toggleFullscreen = () => {
    if (api) {
      api.executeCommand('toggleFilmstrip');
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Carregando videochamada...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Header with controls */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Video className="h-3 w-3 mr-1" />
              Consulta Virtual
            </Badge>
            {isDoctor && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                Médico
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Users className="h-3 w-3 mr-1" />
              {participants} participante{participants !== 1 ? 's' : ''}
            </Badge>
            {isConnected && (
              <Badge variant="secondary" className="bg-green-500/80 text-white border-green-400">
                Conectado
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick controls */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleMute}
            className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'} text-white border-white/20`}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleVideo}
            className={`${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'} text-white border-white/20`}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={hangUp}
            className="bg-red-500 hover:bg-red-600 ml-auto"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Encerrar
          </Button>
        </div>
      </div>

      {/* Jitsi Meet container */}
      <div className="relative w-full h-[calc(100%-120px)]">
        <div
          ref={jitsiContainerRef}
          className="w-full h-full bg-gray-900"
        />
      </div>
    </div>
  );
};