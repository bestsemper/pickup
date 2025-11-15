'use client';

import { useState, useEffect } from 'react';
import { getActiveEvents, joinEvent, leaveEvent, deleteEvent } from '@/lib/firebase/events';
import { PickupEvent } from '@/types';
import Link from 'next/link';
import MapComponent from '@/components/Map';
import { ACTIVITY_TYPES, SPORTS_SUBTYPES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function MapView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<PickupEvent | null>(null);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [participantProfiles, setParticipantProfiles] = useState<{ [key: string]: { displayName: string; email: string } }>({});

  useEffect(() => {
    // Hide sidebar by default on mobile devices
    const isMobile = window.innerWidth < 768;
    setSidebarHidden(isMobile);
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadParticipantProfiles(selectedEvent.participants);
    }
  }, [selectedEvent]);

  const loadParticipantProfiles = async (participantIds: string[]) => {
    try {
      const profiles: { [key: string]: { displayName: string; email: string } } = {};
      
      await Promise.all(
        participantIds.map(async (uid) => {
          if (!participantProfiles[uid]) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[uid] = {
                displayName: userData.displayName || 'Anonymous',
                email: userData.email || ''
              };
            }
          }
        })
      );
      
      setParticipantProfiles(prev => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error('Error loading participant profiles:', error);
    }
  };

  const loadEvents = async () => {
    try {
      console.log('Loading events...');
      const activeEvents = await getActiveEvents();
      console.log('Loaded events:', activeEvents);
      setEvents(activeEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => {
        // Check if filter matches activity type or subType
        return event.activity === filter || event.subType === filter;
      });

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return minutes > 0 ? `${hours} hr ${minutes} min left` : `${hours} hr left`;
    }
    return `${minutes} min left`;
  };

  const handleJoinLeave = async (event: PickupEvent) => {
    if (!currentUser) {
      alert('Please log in to join events');
      return;
    }

    setJoiningEvent(true);
    try {
      const isParticipant = event.participants.includes(currentUser.uid);
      
      if (isParticipant) {
        await leaveEvent(event.id, currentUser.uid);
      } else {
        // Check if event is full
        if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
          alert('This event is full');
          setJoiningEvent(false);
          return;
        }
        await joinEvent(event.id, currentUser.uid);
      }
      
      // Reload events to get updated participant list
      const activeEvents = await getActiveEvents();
      setEvents(activeEvents);
      
      // Update selected event if it's the one we just joined/left
      if (selectedEvent && selectedEvent.id === event.id) {
        const updatedEvent = activeEvents.find(e => e.id === event.id);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error('Error joining/leaving event:', error);
      alert('Failed to join/leave event. Please try again.');
    } finally {
      setJoiningEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEvent(eventId);
      // Reload events
      const activeEvents = await getActiveEvents();
      setEvents(activeEvents);
      // Close the selected event
      setSelectedEvent(null);
      alert('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)', height: 'calc(100vh - 73px)' }}>
      {/* Filter */}
      <div className="px-4 py-3 flex-shrink-0" style={{ backgroundColor: 'var(--header-bg)', borderBottom: `1px solid var(--border)` }}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <label className="font-medium" style={{ color: 'var(--foreground)' }}>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--input-text)'
            }}
          >
            <option value="all">All Events</option>
            <optgroup label="Activity Types">
              {ACTIVITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </optgroup>
            <optgroup label="Sports">
              {SPORTS_SUBTYPES.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </optgroup>
          </select>
          <span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Map Container with Sidebars */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center" style={{ color: 'var(--foreground)' }}>
              Loading events...
            </div>
          ) : (
            <MapComponent 
              events={filteredEvents} 
              onMarkerClick={setSelectedEvent}
            />
          )}
        </div>

        {/* Toggle Button for Sidebar */}
        {!selectedEvent && (
          <button
            onClick={() => setSidebarHidden(!sidebarHidden)}
            className="absolute right-2 top-2 z-10 px-3 py-2 rounded-lg shadow-md font-medium text-sm transition-all"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)'
            }}
          >
            {sidebarHidden ? 'Show Events' : 'Hide Events'}
          </button>
        )}

        {/* Right Sidebar - Event Details or Event List */}
        {!sidebarHidden && (
          <div className="w-80 shadow-lg overflow-y-auto custom-scrollbar flex-shrink-0" style={{ backgroundColor: 'var(--card-bg)', borderLeft: `1px solid var(--border)` }}>
            {selectedEvent ? (
            <div className="p-6">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              X
            </button>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>{selectedEvent.title}</h2>
            <p className="font-medium mb-4" style={{ color: 'var(--accent-orange)' }}>
              {getTimeRemaining(selectedEvent.expiresAt)}
            </p>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>Activity</p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedEvent.activity}</p>
              </div>
              
              <div>
                <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>Location</p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{selectedEvent.location.name}</p>
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>{selectedEvent.location.address}</p>
              </div>
              
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--foreground-tertiary)' }}>
                  Participants ({selectedEvent.participants.length}
                  {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants}`})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedEvent.participants.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                      No participants yet
                    </p>
                  ) : (
                    selectedEvent.participants.map((uid) => (
                      <div 
                        key={uid} 
                        className="flex items-center gap-2 p-2 rounded"
                        style={{ backgroundColor: 'var(--background-secondary)' }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: 'var(--secondary)' }}
                        >
                          {participantProfiles[uid]?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                            {participantProfiles[uid]?.displayName || 'Loading...'}
                            {uid === selectedEvent.createdBy.uid && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-orange)', color: 'white' }}>
                                Host
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>Description</p>
                  <p style={{ color: 'var(--foreground-secondary)' }}>{selectedEvent.description}</p>
                </div>
              )}
            </div>
            
            {currentUser && (
              <div className="space-y-3 mt-6">
                <button 
                  onClick={() => handleJoinLeave(selectedEvent)}
                  disabled={joiningEvent}
                  className="w-full px-4 py-3 text-white rounded-lg font-semibold" 
                  style={{ 
                    backgroundColor: selectedEvent.participants.includes(currentUser.uid) ? 'var(--error)' : 'var(--secondary)',
                    opacity: joiningEvent ? 0.5 : 1,
                    cursor: joiningEvent ? 'not-allowed' : 'pointer'
                  }}
                >
                  {joiningEvent 
                    ? 'Please wait...' 
                    : selectedEvent.participants.includes(currentUser.uid) 
                      ? 'Leave Event' 
                      : 'Join Event'}
                </button>
                
                {selectedEvent.createdBy.uid === currentUser.uid && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="w-full px-4 py-2 rounded-lg font-medium"
                    style={{
                      color: 'var(--error)',
                      border: '1px solid var(--error)'
                    }}
                  >
                    Delete Event
                  </button>
                )}
              </div>
            )}
            {!currentUser && (
              <p className="w-full mt-6 text-center" style={{ color: 'var(--foreground-secondary)' }}>
                Log in to join events
              </p>
            )}
            </div>
          ) : (
            <div className="p-4">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Active Events ({filteredEvents.length})
              </h3>
              {loading ? (
                <p style={{ color: 'var(--foreground-secondary)' }}>Loading...</p>
              ) : filteredEvents.length === 0 ? (
                <p style={{ color: 'var(--foreground-secondary)' }}>No active events</p>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-lg transition hover:opacity-80"
                      style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{event.title}</p>
                        <span className="text-xs" style={{ color: 'var(--accent-orange)' }}>
                          {getTimeRemaining(event.expiresAt)}
                        </span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--foreground-secondary)' }}>
                        {event.activity} {event.subType && `• ${event.subType}`}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
                        {event.location.name}
                      </p>
                      <p className="text-xs mt-2" style={{ color: 'var(--foreground-secondary)' }}>
                        {event.participants.length} joined
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
