'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { PickupEvent } from '@/types';

interface MapComponentProps {
  events: PickupEvent[];
  onMarkerClick?: (event: PickupEvent) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MapComponent({ 
  events, 
  onMarkerClick,
  center = { lat: 38.0336, lng: -78.5080 }, // Default: Charlottesville, VA
  zoom = 13 
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Google Maps API key not found</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="pickup-map"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        {events.map((event) => (
          <AdvancedMarker
            key={event.id}
            position={{ lat: event.location.lat, lng: event.location.lng }}
            onClick={() => onMarkerClick?.(event)}
          >
            <Pin
              background={getActivityColor(event.activity)}
              borderColor="#1e293b"
              glyphColor="#fff"
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

function getActivityColor(activity: string): string {
  const colors: { [key: string]: string } = {
    'Basketball': '#f97316',
    'Soccer': '#22c55e',
    'Ultimate Frisbee': '#3b82f6',
    'Volleyball': '#eab308',
    'Tennis': '#ec4899',
    'Board Game': '#8b5cf6',
  };
  return colors[activity] || '#6b7280';
}
