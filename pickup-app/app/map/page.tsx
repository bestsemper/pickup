'use client';

import { useState, useEffect } from 'react';
import { getActiveEvents } from '@/lib/firebase/events';
import { PickupEvent } from '@/types';
import Link from 'next/link';
import MapComponent from '@/components/Map';

export default function MapView() {
  const [events, setEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<PickupEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const activeEvents = await getActiveEvents();
      setEvents(activeEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.activity.toLowerCase() === filter.toLowerCase());

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes}m left` : 'Expired';
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">Pickup</Link>
          <div className="flex gap-4">
            <Link href="/list" className="px-4 py-2 text-gray-600 hover:text-blue-600">
              List View
            </Link>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Create Event
            </button>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          {['all', 'Basketball', 'Soccer', 'Ultimate Frisbee', 'Volleyball', 'Tennis'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent 
          events={filteredEvents} 
          onMarkerClick={setSelectedEvent}
        />

        {/* Event Details Sidebar */}
        {selectedEvent && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg p-6 overflow-y-auto">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              X
            </button>
            
            <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
            <p className="text-orange-600 font-medium mb-4">
              {getTimeRemaining(selectedEvent.expiresAt)}
            </p>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Activity</p>
                <p className="font-medium">{selectedEvent.activity}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedEvent.location.name}</p>
                <p className="text-sm text-gray-600">{selectedEvent.location.address}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium">
                  {selectedEvent.participants.length}
                  {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants}`}
                </p>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
            </div>
            
            <button className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              Join Event
            </button>
          </div>
        )}

        {/* Events List Overlay (bottom) */}
        {!selectedEvent && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t max-h-48 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Active Events ({filteredEvents.length})</h3>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : filteredEvents.length === 0 ? (
                <p className="text-gray-500">No active events</p>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.location.name}</p>
                        </div>
                        <span className="text-sm text-orange-600">
                          {getTimeRemaining(event.expiresAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
