import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, MapPin, Navigation, AlertTriangle } from 'lucide-react';

interface EmergencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  locationError: string | null;
}

interface EmergencyService {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

const mockEmergencyServices: EmergencyService[] = [
  { name: 'Hospital das Clínicas', address: 'Av. Dr. Enéas de Carvalho Aguiar, 255 - Cerqueira César, São Paulo - SP', lat: -23.558, lng: -46.669 },
  { name: 'Pronto-Socorro Hospital Sírio-Libanês', address: 'Rua Dona Adma Jafet, 91 - Bela Vista, São Paulo - SP', lat: -23.550, lng: -46.657 },
  { name: 'Hospital Alemão Oswaldo Cruz', address: 'R. João Julião, 331 - Paraíso, São Paulo - SP', lat: -23.568, lng: -46.646 },
  { name: 'HCor (Hospital do Coração)', address: 'Rua Des. Eliseu Guilherme, 147 - Paraíso, São Paulo - SP', lat: -23.571, lng: -46.643 },
  { name: 'Hospital Nove de Julho', address: 'Rua Peixoto Gomide, 625 - Cerqueira César, São Paulo - SP', lat: -23.554, lng: -46.661 },
];

const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const EmergencyDialog = ({ isOpen, onClose, userLocation, locationError }: EmergencyDialogProps) => {
  const [sortedServices, setSortedServices] = useState<EmergencyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLocation) {
      setIsLoading(true);
      const servicesWithDistance = mockEmergencyServices.map(service => ({
        ...service,
        distance: haversineDistance(userLocation.latitude, userLocation.longitude, service.lat, service.lng),
      }));
      servicesWithDistance.sort((a, b) => a.distance - b.distance);
      setSortedServices(servicesWithDistance);
      setIsLoading(false);
    } else {
      setSortedServices(mockEmergencyServices);
      setIsLoading(false);
    }
  }, [userLocation]);

  const handleViewOnMap = (service: EmergencyService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Serviços de Emergência Próximos
          </DialogTitle>
          <DialogDescription>
            {locationError ? (
              <span className="text-red-500">{locationError}</span>
            ) : (
              "Esta é uma lista de hospitais e pronto-socorros. Em caso de emergência, ligue para 192 (SAMU)."
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-40 text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Carregando serviços de emergência...</p>
          </div>
        ) : locationError ? (
          <div className="flex flex-col justify-center items-center h-40 text-red-500">
            <AlertTriangle className="w-10 h-10 mb-4" />
            <p className="text-center">{locationError}</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 space-y-4">
            {sortedServices.map((service, index) => (
              <div key={index} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-600 flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span>{service.address}</span>
                  </p>
                  {service.distance && (
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      Aproximadamente {service.distance.toFixed(1)} km de distância
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleViewOnMap(service)}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white self-end sm:self-center"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver no mapa
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
