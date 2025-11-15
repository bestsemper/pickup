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
import CreateEventModal from '@/components/CreateEventModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function MapView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<PickupEvent | null>(null);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [participantProfiles, setParticipantProfiles] = useState<{ [key: string]: { displayName: string; email: string; isNetBadgeVerified?: boolean } }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

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
      const profiles: { [key: string]: { displayName: string; email: string; isNetBadgeVerified?: boolean } } = {};
      
      await Promise.all(
        participantIds.map(async (uid) => {
          if (!participantProfiles[uid]) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[uid] = {
                displayName: userData.displayName || 'Anonymous',
                email: userData.email || '',
                isNetBadgeVerified: userData.isNetBadgeVerified || false
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
      showToast('Please log in to join events', 'warning');
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
          showToast('This event is full', 'warning');
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
      showToast('Failed to join/leave event. Please try again.', 'error');
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
      showToast('Event deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event. Please try again.', 'error');
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden bg-[var(--background)] h-[calc(100vh-73px)]">
        {/* Filter */}
        <div className="w-full px-8 py-3 flex-shrink-0 bg-header border-b border-default">
          <div className="mx-auto flex items-center gap-4">
            <label className="font-medium text-foreground">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-input border-input text-input"
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
            <span className="text-sm text-secondary">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => currentUser ? setIsCreateModalOpen(true) : showToast('Please sign in to create an event', 'warning')}
                className="px-4 py-2 rounded-lg font-medium border border-primary text-primary hover:bg-primary hover:text-white transition"
              >
                Create Event
              </button>
              <button
                onClick={() => setSidebarHidden(!sidebarHidden)}
                className="px-4 py-2 rounded-lg font-medium border border-default text-foreground hover:bg-background-secondary transition"
              >
                All Events
              </button>
            </div>
          </div>
        </div>

      {/* Map Container with Sidebars */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-foreground">
              Loading events...
            </div>
          ) : (
            <MapComponent 
              events={filteredEvents} 
              onMarkerClick={setSelectedEvent}
            />
          )}
        </div>

        {/* Right Sidebar - Event Details or Event List */}
        <div 
          className="absolute top-0 right-0 h-full w-80 shadow-lg overflow-y-auto custom-scrollbar bg-card border-l border-default transition-transform duration-300 ease-in-out"
          style={{
            transform: sidebarHidden ? 'translateX(100%)' : 'translateX(0)'
          }}
        >
          {selectedEvent ? (
            <div className="p-6">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-secondary"
            >
              X
            </button>
            
            <h2 className="text-2xl font-bold mb-2 text-foreground">{selectedEvent.title}</h2>
            <p className="font-medium mb-4 text-accent-orange">
              {getTimeRemaining(selectedEvent.expiresAt)}
            </p>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-tertiary">Activity</p>
                <p className="font-medium text-foreground">
                  {selectedEvent.subType ? selectedEvent.subType : selectedEvent.activity}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-tertiary">Location</p>
                <p className="font-medium text-foreground">{selectedEvent.location.name}</p>
                <p className="text-sm text-secondary">{selectedEvent.location.address}</p>
              </div>
              
              <div>
                <p className="text-sm mb-2 text-tertiary">
                  Participants ({selectedEvent.participants.length}
                  {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants}`})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedEvent.participants.length === 0 ? (
                    <p className="text-sm text-secondary">
                      No participants yet
                    </p>
                  ) : (
                    selectedEvent.participants.map((uid) => (
                      <div 
                        key={uid} 
                        className="flex items-center gap-2 p-2 rounded bg-background-secondary"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium bg-secondary-color">
                          {participantProfiles[uid]?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground flex items-center gap-1">
                            <span>{participantProfiles[uid]?.displayName || 'Loading...'}</span>
                            {uid === selectedEvent.createdBy.uid && (
                              <span className="ml-1 text-xs px-2 py-0.5 rounded bg-[var(--accent-orange)] text-white">
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
                  <p className="text-sm text-tertiary">Description</p>
                  <p className="text-secondary">{selectedEvent.description}</p>
                </div>
              )}
            </div>
            
            {currentUser && (
              <div className="space-y-3 mt-6">
                <button 
                  onClick={() => handleJoinLeave(selectedEvent)}
                  disabled={joiningEvent}
                  className={`w-full px-8 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedEvent.participants.includes(currentUser.uid) ? 'bg-error' : 'bg-secondary-color'
                  }`}
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
                    className="w-full px-4 py-2 rounded-lg font-medium text-error border border-[var(--error)]"
                  >
                    Delete Event
                  </button>
                )}
              </div>
            )}
            {!currentUser && (
              <p className="w-full mt-6 text-center text-secondary">
                Log in to join events
              </p>
            )}
            </div>
          ) : (
            <div className="p-4">
              <h3 className="font-semibold mb-3 text-foreground">
                Active Events ({filteredEvents.length})
              </h3>
              {loading ? (
                <p className="text-secondary">Loading...</p>
              ) : filteredEvents.length === 0 ? (
                <p className="text-secondary">No active events</p>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-lg transition hover:opacity-80 bg-background-secondary border border-default"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-foreground">{event.title}</p>
                        <span className="text-xs text-accent-orange">
                          {getTimeRemaining(event.expiresAt)}
                        </span>
                      </div>
                      <p className="text-sm mb-1 text-secondary">
                        {event.activity} {event.subType && `• ${event.subType}`}
                      </p>
                      <p className="text-xs text-tertiary">
                        {event.location.name}
                      </p>
                      <p className="text-xs mt-2 text-secondary">
                        {event.participants.length}
                        {event.maxParticipants && ` / ${event.maxParticipants}`} joined
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    <CreateEventModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
    />

    {toasts.map(toast => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </>
  );
}
