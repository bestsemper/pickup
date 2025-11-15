'use client';

import { useState, useEffect } from 'react';
import { getActiveEvents } from '@/lib/firebase/events';
import { PickupEvent } from '@/types';
import Link from 'next/link';

export default function ListView() {
  const [events, setEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">Pickup</Link>
          <div className="flex gap-4">
            <Link href="/map" className="px-4 py-2 text-gray-600 hover:text-blue-600">
              Map View
            </Link>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Create Event
            </button>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'Basketball', 'Soccer', 'Ultimate Frisbee', 'Volleyball', 'Tennis'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No active events found. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                  <span className="text-sm text-orange-600 font-medium">
                    {getTimeRemaining(event.expiresAt)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-2">{event.activity}</p>
                <p className="text-gray-500 text-sm mb-3">{event.location.name}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {event.participants.length} joined
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                  </span>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
