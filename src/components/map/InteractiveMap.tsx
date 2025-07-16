
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  coordinates: [number, number];
  userLocation?: [number, number] | null;
  locationName: string;
  address: string;
}

const InteractiveMap = ({ 
  coordinates, 
  userLocation, 
  locationName, 
  address 
}: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token from environment variable
    // In production, this should be set via Supabase Edge Function secrets
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoidGVzdCIsImEiOiJjbGthYWkwOWcwNWxhM3FzOWtoanRzM2gxIn0.J5f0LX0g8FE1gZWOOgE5jQ';

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 15,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Create custom marker for the location
    const locationMarker = new mapboxgl.Marker({
      color: '#3B82F6', // Blue color
      scale: 1.2
    })
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <h3 class="font-semibold text-sm mb-1">${locationName}</h3>
            <p class="text-xs text-gray-600">${address}</p>
          </div>`
        )
      )
      .addTo(map.current);

    // Add user location marker if available
    if (userLocation) {
      const userMarker = new mapboxgl.Marker({
        color: '#10B981', // Green color
        scale: 0.8
      })
        .setLngLat(userLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-semibold text-sm">Sua Localização</h3>
            </div>`
          )
        )
        .addTo(map.current);

      // Add route line between user and destination
      map.current.on('load', () => {
        if (map.current) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [userLocation, coordinates]
              }
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 3,
              'line-opacity': 0.6,
              'line-dasharray': [2, 4]
            }
          });

          // Fit map to show both markers
          const bounds = new mapboxgl.LngLatBounds()
            .extend(coordinates)
            .extend(userLocation);
          
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 16
          });
        }
      });
    }

    // Show popup on load
    setTimeout(() => {
      locationMarker.getPopup().addTo(map.current!);
    }, 500);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [coordinates, userLocation, locationName, address]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map attribution overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
        📍 {locationName}
      </div>
    </div>
  );
};

export default InteractiveMap;
