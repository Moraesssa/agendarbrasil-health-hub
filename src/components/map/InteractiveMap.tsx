
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const locationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface InteractiveMapProps {
  coordinates: [number, number];
  userLocation?: [number, number] | null;
  locationName: string;
  address: string;
}

// Component to handle map fitting bounds
const MapController = ({ 
  coordinates, 
  userLocation 
}: { 
  coordinates: [number, number]; 
  userLocation?: [number, number] | null; 
}) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      // Convert coordinates to Leaflet format [lat, lng]
      const locationLatLng: [number, number] = [coordinates[1], coordinates[0]];
      const userLatLng: [number, number] = [userLocation[1], userLocation[0]];
      
      // Create bounds that include both points
      const bounds = L.latLngBounds([locationLatLng, userLatLng]);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    } else {
      // Center on location only
      const locationLatLng: [number, number] = [coordinates[1], coordinates[0]];
      map.setView(locationLatLng, 15);
    }
  }, [map, coordinates, userLocation]);

  return null;
};

// Component to add route line between user and destination
const RouteLine = ({ 
  userLocation, 
  coordinates 
}: { 
  userLocation: [number, number]; 
  coordinates: [number, number]; 
}) => {
  const map = useMap();

  useEffect(() => {
    // Convert to Leaflet format [lat, lng]
    const userLatLng: [number, number] = [userLocation[1], userLocation[0]];
    const locationLatLng: [number, number] = [coordinates[1], coordinates[0]];

    // Create polyline
    const routeLine = L.polyline([userLatLng, locationLatLng], {
      color: '#3B82F6',
      weight: 3,
      opacity: 0.6,
      dashArray: '10, 10'
    }).addTo(map);

    return () => {
      map.removeLayer(routeLine);
    };
  }, [map, userLocation, coordinates]);

  return null;
};

const InteractiveMap = ({ 
  coordinates, 
  userLocation, 
  locationName, 
  address 
}: InteractiveMapProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Convert coordinates to Leaflet format [lat, lng]
  const locationLatLng: [number, number] = [coordinates[1], coordinates[0]];
  const userLatLng: [number, number] | undefined = userLocation 
    ? [userLocation[1], userLocation[0]] 
    : undefined;

  const handleMapLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={locationLatLng}
        zoom={15}
        className="absolute inset-0 z-0"
        whenReady={handleMapLoad}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Location marker */}
        <Marker position={locationLatLng} icon={locationIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">{locationName}</h3>
              <p className="text-xs text-gray-600">{address}</p>
            </div>
          </Popup>
        </Marker>

        {/* User location marker */}
        {userLatLng && (
          <Marker position={userLatLng} icon={userIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">Sua Localização</h3>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {userLatLng && (
          <RouteLine userLocation={userLocation!} coordinates={coordinates} />
        )}

        {/* Map controller for bounds fitting */}
        <MapController coordinates={coordinates} userLocation={userLocation} />
      </MapContainer>
      
      {/* Map attribution overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 z-10">
        📍 {locationName}
      </div>
    </div>
  );
};

export default InteractiveMap;
