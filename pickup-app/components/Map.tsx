'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { PickupEvent } from '@/types';

interface MapComponentProps {
  events: PickupEvent[];
  onMarkerClick?: (event: PickupEvent) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

interface GroupedEvents {
  location: { lat: number; lng: number };
  events: PickupEvent[];
}

export default function MapComponent({ 
  events, 
  onMarkerClick,
  center = { lat: 38.0336, lng: -78.5080 }, // Default: Charlottesville, VA
  zoom = 13 
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [showingGroup, setShowingGroup] = useState<GroupedEvents | null>(null);

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Google Maps API key not found</p>
      </div>
    );
  }

  // Group events by location (same lat/lng within 0.0001 degrees ~11m)
  const groupedEvents: GroupedEvents[] = [];
  events.forEach(event => {
    const existing = groupedEvents.find(group => 
      Math.abs(group.location.lat - event.location.lat) < 0.0001 &&
      Math.abs(group.location.lng - event.location.lng) < 0.0001
    );
    
    if (existing) {
      existing.events.push(event);
    } else {
      groupedEvents.push({
        location: { lat: event.location.lat, lng: event.location.lng },
        events: [event]
      });
    }
  });

  const handleMarkerClick = (group: GroupedEvents) => {
    if (group.events.length === 1) {
      onMarkerClick?.(group.events[0]);
      setShowingGroup(null);
    } else {
      setShowingGroup(group);
    }
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="pickup-map"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        {groupedEvents.map((group, idx) => (
          <AdvancedMarker
            key={`group-${idx}`}
            position={group.location}
            onClick={() => handleMarkerClick(group)}
          >
            <div 
              className="relative"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--primary)',
                borderRadius: '50%',
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            >
              {group.events.length}
            </div>
          </AdvancedMarker>
        ))}
      </Map>
      
      {/* Multi-event selector popup */}
      {showingGroup && showingGroup.events.length > 1 && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg p-4 max-w-md w-full mx-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', zIndex: 1000 }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
              {showingGroup.events.length} events at this location
            </h3>
            <button 
              onClick={() => setShowingGroup(null)}
              className="hover:opacity-70"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {showingGroup.events.map(event => (
              <button
                key={event.id}
                onClick={() => {
                  onMarkerClick?.(event);
                  setShowingGroup(null);
                }}
                className="w-full text-left p-3 rounded-lg hover:opacity-80"
                style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {event.title}
                </div>
                <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                  {event.activity} {event.subType && `• ${event.subType}`}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--foreground-tertiary)' }}>
                  {event.participants.length} joined
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
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
