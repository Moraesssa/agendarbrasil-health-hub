
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Navigation, 
  ExternalLink, 
  Smartphone,
  MapPin,
  Route
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NavigationOptionsProps {
  address: string;
  coordinates: [number, number] | null;
}

const NavigationOptions = ({ address, coordinates }: NavigationOptionsProps) => {
  const { toast } = useToast();

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
    toast({
      title: "Abrindo Google Maps",
      description: "Redirecionando para navegação...",
    });
  };

  const openWaze = () => {
    if (coordinates) {
      const url = `https://waze.com/ul?ll=${coordinates[1]},${coordinates[0]}&navigate=yes`;
      window.open(url, '_blank');
    } else {
      const url = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
      window.open(url, '_blank');
    }
    toast({
      title: "Abrindo Waze",
      description: "Redirecionando para navegação...",
    });
  };

  const openAppleMaps = () => {
    if (coordinates) {
      const url = `http://maps.apple.com/?daddr=${coordinates[1]},${coordinates[0]}`;
      window.open(url, '_blank');
    } else {
      const url = `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
    toast({
      title: "Abrindo Apple Maps",
      description: "Redirecionando para navegação...",
    });
  };

  const openUberOrTaxi = () => {
    if (coordinates) {
      const url = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${coordinates[1]}&dropoff[longitude]=${coordinates[0]}`;
      window.open(url, '_blank');
    }
    toast({
      title: "Abrindo Uber",
      description: "Configurando viagem para o destino...",
    });
  };

  const navigationOptions = [
    {
      name: "Google Maps",
      icon: MapPin,
      description: "Navegação completa com trânsito",
      color: "bg-blue-500 hover:bg-blue-600",
      action: openGoogleMaps
    },
    {
      name: "Waze",
      icon: Route,
      description: "Melhor rota com alertas",
      color: "bg-purple-500 hover:bg-purple-600",
      action: openWaze
    },
    {
      name: "Apple Maps",
      icon: Navigation,
      description: "Para dispositivos Apple",
      color: "bg-gray-600 hover:bg-gray-700",
      action: openAppleMaps
    },
    {
      name: "Uber",
      icon: Smartphone,
      description: "Chamar um motorista",
      color: "bg-black hover:bg-gray-800",
      action: openUberOrTaxi
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="h-5 w-5 text-blue-600" />
          Como Chegar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navigationOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left hover:shadow-md transition-all"
              onClick={option.action}
            >
              <div className="flex items-center gap-2 w-full mb-1">
                <div className={`p-1.5 rounded ${option.color} text-white`}>
                  <option.icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{option.name}</span>
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </div>
              <span className="text-xs text-gray-600 text-left">
                {option.description}
              </span>
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Clique em qualquer opção para abrir o app de navegação
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationOptions;
