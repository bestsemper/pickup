'use client';

import { useState, useEffect } from 'react';
import { getActiveEvents, joinEvent, leaveEvent, deleteEvent } from '@/lib/firebase/events';
import { PickupEvent } from '@/types';
import Link from 'next/link';
import { ACTIVITY_TYPES, SPORTS_SUBTYPES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CreateEventModal from '@/components/CreateEventModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function ListView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [events, setEvents] = useState<PickupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [joiningEvents, setJoiningEvents] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<PickupEvent | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<{ [key: string]: { displayName: string; email: string; isNetBadgeVerified?: boolean } }>({});
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const getEventTiming = (event: PickupEvent) => {
    const now = new Date();
    
    // Use event.startTime if available, otherwise fallback to createdAt
    const eventStartTime = event.startTime || event.createdAt;
    const eventEndTime = event.expiresAt;
    
    // Time until event starts
    const timeUntilStart = eventStartTime.getTime() - now.getTime();
    // Time remaining in event
    const timeRemaining = eventEndTime.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      return 'Expired';
    }

    if (timeUntilStart > 0) {
      // Event hasn't started yet
      const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      
      let startsIn = '';
      if (hoursUntil > 0) {
        startsIn = minutesUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${hoursUntil}h`;
      } else {
        startsIn = `${minutesUntil}m`;
      }
      
      return `Starts in ${startsIn}`;
    } else {
      // Event has started, show time remaining
      const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursLeft > 0) {
        return minutesLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${hoursLeft}h left`;
      }
      return `${minutesLeft}m left`;
    }
  };

  const handleJoinLeave = async (event: PickupEvent) => {
    if (!currentUser) {
      showToast('Please log in to join events', 'warning');
      return;
    }

    setJoiningEvents(prev => new Set(prev).add(event.id));
    try {
      const isParticipant = event.participants.includes(currentUser.uid);
      
      if (isParticipant) {
        await leaveEvent(event.id, currentUser.uid);
      } else {
        // Check if event is full
        if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
          showToast('This event is full', 'warning');
          return;
        }
        await joinEvent(event.id, currentUser.uid);
      }
      
      // Reload events to get updated participant list
      await loadEvents();
    } catch (error) {
      console.error('Error joining/leaving event:', error);
      showToast('Failed to join/leave event. Please try again.', 'error');
    } finally {
      setJoiningEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.id);
        return newSet;
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return;

    const confirmDelete = confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await deleteEvent(eventId);
      // Reload events and close modal
      await loadEvents();
      setSelectedEvent(null);
      showToast('Event deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event. Please try again.', 'error');
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background-secondary)', height: 'calc(100vh - 73px)' }}>
        {/* Filter */}
        <div className="w-full mx-auto px-8 py-6 flex-shrink-0 w-full">
          <div className="flex items-center gap-4">
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
            <button
              onClick={() => currentUser ? setIsCreateModalOpen(true) : showToast('Please sign in to create an event', 'warning')}
              className="ml-auto px-4 py-2 rounded-lg font-medium border border-primary text-primary hover:bg-primary hover:text-white transition"
            >
              Create Event
            </button>
          </div>
        </div>

      {/* Events List */}
      <div className="w-full mx-auto px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--foreground)' }}>Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--foreground-secondary)' }}>
            No active events found. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg shadow-md p-6 hover:shadow-lg transition"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: `1px solid var(--card-border)` 
                }}
              >
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{event.title}</h3>
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-orange)' }}>
                      {getEventTiming(event)}
                    </span>
                  </div>
                  
                  <p className="mb-2" style={{ color: 'var(--foreground-secondary)' }}>{event.activity}</p>
                  <p className="text-sm mb-3" style={{ color: 'var(--foreground-tertiary)' }}>{event.location.name}</p>
                  
                  <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    {event.participants.length}
                    {event.maxParticipants && ` / ${event.maxParticipants}`} participant{event.participants.length !== 1 ? 's' : ''}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: 'var(--card-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {selectedEvent.title}
                </h2>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="hover:opacity-70"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <p className="font-medium mb-4" style={{ color: 'var(--accent-orange)' }}>
                {getEventTiming(selectedEvent)}
              </p>

              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>Activity</p>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {selectedEvent.subType ? selectedEvent.subType : selectedEvent.activity}
                  </p>
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
                            <p className="text-sm font-medium truncate flex items-center gap-1" style={{ color: 'var(--foreground)' }}>
                              <span>{participantProfiles[uid]?.displayName || 'Loading...'}</span>
                              {uid === selectedEvent.createdBy.uid && (
                                <span className="ml-1 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-orange)', color: 'white' }}>
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
                    onClick={async () => {
                      setJoiningEvent(true);
                      await handleJoinLeave(selectedEvent);
                      // Refresh the selected event
                      const updatedEvents = await getActiveEvents();
                      const updatedEvent = updatedEvents.find(e => e.id === selectedEvent.id);
                      if (updatedEvent) {
                        setSelectedEvent(updatedEvent);
                      }
                      setJoiningEvent(false);
                    }}
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
          </div>
        </div>
      )}
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
