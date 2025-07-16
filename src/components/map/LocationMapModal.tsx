
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Copy, 
  Phone, 
  Clock,
  Building,
  Route
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InteractiveMap from './InteractiveMap';
import NavigationOptions from './NavigationOptions';

interface LocationData {
  nome_local: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
}

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData | null;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
}

const LocationMapModal = ({
  isOpen,
  onClose,
  location,
  appointmentDate,
  appointmentTime,
  doctorName
}: LocationMapModalProps) => {
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const formatAddress = (endereco: LocationData['endereco']) => {
    const parts = [
      `${endereco.logradouro}, ${endereco.numero}`,
      endereco.complemento,
      endereco.bairro,
      `${endereco.cidade} - ${endereco.uf}`,
      `CEP: ${endereco.cep}`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const getFullAddress = () => {
    if (!location) return '';
    return formatAddress(location.endereco);
  };

  const copyAddress = async () => {
    const address = getFullAddress();
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Endereço copiado!",
        description: "O endereço foi copiado para sua área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o endereço.",
        variant: "destructive",
      });
    }
  };

  // Geocoding function to get coordinates from address
  const geocodeAddress = async (address: string) => {
    setIsLoadingCoordinates(true);
    try {
      // Using OpenStreetMap Nominatim for geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoordinates([lon, lat]); // [longitude, latitude]
      } else {
        // Default to Brazil center if geocoding fails
        setCoordinates([-47.8825, -15.7942]);
        toast({
          title: "Localização aproximada",
          description: "Não foi possível encontrar a localização exata. Mostrando localização aproximada.",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCoordinates([-47.8825, -15.7942]); // Default coordinates
      toast({
        title: "Erro de localização",
        description: "Usando localização padrão devido a erro no serviço de mapas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      const address = getFullAddress();
      geocodeAddress(address);
      getUserLocation();
    }
  }, [isOpen, location]);

  if (!location) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-blue-600" />
            Localização da Consulta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Left Panel - Details */}
          <div className="flex-1 p-6 pt-0 overflow-y-auto">
            {/* Appointment Info */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Consulta Agendada</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Médico:</strong> {doctorName}</p>
                  <p><strong>Data:</strong> {new Date(appointmentDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário:</strong> {appointmentTime}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{location.nome_local}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{location.endereco.logradouro}, {location.endereco.numero}</p>
                      {location.endereco.complemento && (
                        <p>{location.endereco.complemento}</p>
                      )}
                      <p>{location.endereco.bairro}</p>
                      <p>{location.endereco.cidade} - {location.endereco.uf}</p>
                      <p>CEP: {location.endereco.cep}</p>
                    </div>
                  </div>
                  
                  {location.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{location.telefone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={copyAddress}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar Endereço
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-4" />

            {/* Navigation Options */}
            <NavigationOptions 
              address={getFullAddress()}
              coordinates={coordinates}
            />
          </div>

          {/* Right Panel - Map */}
          <div className="flex-1 lg:border-l">
            <div className="h-full relative">
              {isLoadingCoordinates ? (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando mapa...</p>
                  </div>
                </div>
              ) : coordinates ? (
                <InteractiveMap
                  coordinates={coordinates}
                  userLocation={userLocation}
                  locationName={location.nome_local}
                  address={getFullAddress()}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Mapa não disponível</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapModal;
