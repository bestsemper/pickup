'use client';

import { useState, useEffect, useRef } from 'react';
import { createEvent } from '@/lib/firebase/events';
import { useAuth } from '@/contexts/AuthContext';
import CloseIcon from './icons/CloseIcon';
import { ACTIVITY_TYPES, SPORTS_SUBTYPES } from '@/lib/constants';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { userProfile, currentUser } = useAuth();
  const userName = userProfile?.displayName || currentUser?.email;

  const [formData, setFormData] = useState({
    title: '',
    activity: '',
    subType: '',
    locationName: '',
    locationAddress: '',
    eventDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    startTimeOnly: '14:00', // HH:mm format
    endTimeOnly: '15:00', // HH:mm format
    maxParticipants: undefined as number | undefined,
    description: '',
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([]);
  const predictDebounceRef = useRef<number | null>(null);

  // Load Google Maps Places script and initialize autocomplete on the address input
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('[CreateEventModal] Google Maps API key:', !!apiKey);
    if (!apiKey) {
      console.warn('[CreateEventModal] No Google Maps API key found in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      return;
    }

    const windowAny = window as any;

    function initAutocomplete() {
      console.log('[CreateEventModal] initAutocomplete called');
      const input = addressInputRef.current;
      if (!input || !windowAny.google || !windowAny.google.maps || !windowAny.google.maps.places) return;

      const autocomplete = new windowAny.google.maps.places.Autocomplete(input, { types: ['geocode'] });
      autocomplete.setFields(['formatted_address', 'geometry', 'name']);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('[CreateEventModal] place_changed', place);
        if (!place || !place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCoords({ lat, lng });
        setFormData((prev) => ({
          ...prev,
          locationName: place.name || prev.locationName,
          locationAddress: place.formatted_address || prev.locationAddress,
        }));
      });
    }

    // If google already loaded, init straight away
    if ((windowAny).google && (windowAny).google.maps && (windowAny).google.maps.places) {
      initAutocomplete();
      return;
    }

    // Otherwise, dynamically load the script
    const scriptId = 'google-maps-places-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('[CreateEventModal] Google Maps script loaded');
        initAutocomplete();
      };
      script.onerror = (err) => {
        console.error('[CreateEventModal] Google Maps script failed to load', err);
      };
      document.head.appendChild(script);
    } else {
      // If script tag exists but wasn't initialized yet, try to init after a short delay
      const t = setTimeout(initAutocomplete, 500);
      return () => clearTimeout(t);
    }
  }, []);

  // Handle ESC key press and clicks outside suggestions
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && suggestions.length > 0) {
        setSuggestions([]);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (suggestions.length > 0) {
        const target = e.target as HTMLElement;
        // Check if click is outside the suggestions dropdown and address input
        if (!target.closest('.suggestions-dropdown') && !target.closest('.address-input')) {
          setSuggestions([]);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, suggestions]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Require authenticated user
      if (!currentUser) {
        alert('You must be signed in to create an event. Please sign in and try again.');
        setLoading(false);
        return;
      }
      const userId = currentUser.uid;

      const startTimeDate = new Date(`${formData.eventDate}T${formData.startTimeOnly}:00`);
      const endTimeDate = new Date(`${formData.eventDate}T${formData.endTimeOnly}:00`);

      // Validate that end time is after start time
      if (endTimeDate <= startTimeDate) {
        alert('End time must be after start time.');
        setLoading(false);
        return;
      }

      // Ensure coordinates were selected via autocomplete
      if (!coords) {
        alert('Please select an address from the suggestions so we can get coordinates (lat/lng).');
        setLoading(false);
        return;
      }

      // Calculate duration in minutes
      const durationMinutes = Math.round((endTimeDate.getTime() - startTimeDate.getTime()) / (1000 * 60));

      await createEvent({
        title: formData.title,
        activity: formData.activity,
        eventName: formData.title,
        type: formData.activity,
        subType: formData.subType,
        location: {
          name: formData.locationName,
          address: formData.locationAddress,
          lat: coords.lat,
          lng: coords.lng,
        },
        createdBy: {
          uid: userId,
          name: userName,
        },
        duration: durationMinutes,
        startTime: startTimeDate,
        endTime: endTimeDate,
        participants: [userId],
        maxParticipants: formData.maxParticipants,
        description: formData.description,
        isPrivate: formData.isPrivate,
      });

      // Notify user of success
      try {
        alert('Event created successfully!');
      } catch (e) {
        // fallback: console log
        console.log('Event created');
      }

      // Reset form
      setFormData({
        title: '',
        activity: '',
        subType: '',
        locationName: '',
        locationAddress: '',
        eventDate: new Date().toISOString().slice(0, 10),
        startTimeOnly: '14:00',
        endTimeOnly: '15:00',
        maxParticipants: undefined,
        description: '',
        isPrivate: false,
      });

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      const msg = (error as any)?.message || String(error);
      alert(`Failed to create event: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar" 
        style={{ backgroundColor: 'var(--card-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Create Pickup Event</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:opacity-70"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              <CloseIcon />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Pickup Basketball Game"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Activity Type*</label>
              <select
                required
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value, subType: '' })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)',
                  colorScheme: 'light dark',
                  paddingRight: '2.5rem',
                  appearance: 'auto',
                  backgroundImage: 'none'
                }}
              >
                <option value="">Select Activity Type</option>
                {ACTIVITY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Conditional subType field based on activity type */}
            {formData.activity === 'Sports' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Sport Type *</label>
                <select
                  required
                  value={formData.subType}
                  onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)',
                    colorScheme: 'light dark',
                    paddingRight: '2.5rem',
                    appearance: 'auto',
                    backgroundImage: 'none'
                  }}
                >
                  <option value="">Select a sport</option>
                  {SPORTS_SUBTYPES.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.activity === 'Club' && (
              <div>
                <label className="block text-sm font-medium mb-1">Club Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subType}
                  onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                  placeholder="e.g., Chess Club, Anime Club"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            {formData.activity === 'Entertainment' && (
              <div>
                <label className="block text-sm font-medium mb-1">Entertainment Type *</label>
                <input
                  type="text"
                  required
                  value={formData.subType}
                  onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                  placeholder="e.g., Board Games, Karaoke, Movie Night"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Location Name *</label>
              <input
                type="text"
                required
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder="e.g., Olsson Hall Room 011"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1">Address *</label>
              <input
                ref={addressInputRef}
                id="address-input"
                type="text"
                autoComplete="off"
                required
                value={formData.locationAddress}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none address-input"
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, locationAddress: v });
                  // debounce predictions
                  if (!window || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) return;
                  if (predictDebounceRef.current) window.clearTimeout(predictDebounceRef.current);
                  predictDebounceRef.current = window.setTimeout(() => {
                    const service = new (window as any).google.maps.places.AutocompleteService();
                    service.getPlacePredictions({ input: v }, (preds: any[], status: any) => {
                      if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !preds) {
                        setSuggestions([]);
                        return;
                      }
                      setSuggestions(preds.map(p => ({ description: p.description, placeId: p.place_id })));
                    });
                  }, 250);
                }}
                placeholder="e.g., 1000 Stadium Rd, Charlottesville, VA"
              />
              {/* Suggestions dropdown (fallback if native autocomplete UI not working) */}
              {suggestions.length > 0 && (
                <ul className="border rounded bg-white text-black mt-1 max-h-40 overflow-auto suggestions-dropdown" style={{ zIndex: 10001 }}>
                  {suggestions.map(s => (
                    <li
                      key={s.placeId}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // fetch place details
                        const ps = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
                        ps.getDetails({ placeId: s.placeId }, (place: any, status: any) => {
                          if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !place) return;
                          const lat = place.geometry.location.lat();
                          const lng = place.geometry.location.lng();
                          setCoords({ lat, lng });
                          setFormData(prev => ({
                            ...prev,
                            locationName: place.name || prev.locationName,
                            locationAddress: place.formatted_address || s.description,
                          }));
                          setSuggestions([]);
                        });
                      }}
                    >
                      {s.description}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-secondary)' }}>
                Tip: select an address from the suggestions to automatically fill location coordinates.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)',
                  colorScheme: 'light dark'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Start Time & End Time *
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground)' }}>Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTimeOnly}
                    onChange={(e) => setFormData({ ...formData, startTimeOnly: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)',
                      colorScheme: 'light dark'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground)' }}>End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTimeOnly}
                    onChange={(e) => setFormData({ ...formData, endTimeOnly: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)',
                      colorScheme: 'light dark'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Participants (optional)
              </label>
              <input
                type="number"
                min="2"
                value={formData.maxParticipants || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxParticipants: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="Leave empty for unlimited"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Any additional details..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)'
                }}
              />
            </div>

            {/* Private Event Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => {
                  setFormData({ ...formData, isPrivate: e.target.checked });
                }}
                className="w-4 h-4"
              />
              <label htmlFor="isPrivate" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Private Event (Friends Only)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white rounded-lg font-semibold"
              style={{ 
                backgroundColor: loading ? 'var(--foreground-tertiary)' : 'var(--primary)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
          <style jsx>{`
        input, select, textarea {
          background-color: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--input-text);
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--input-focus);
          ring: 2px var(--input-focus);
        }
        label {
          color: var(--foreground);
        }
      `}</style>
          <style jsx global>{`
            /* Ensure Google Places suggestions show above the modal */
            .pac-container {
              z-index: 10000 !important;
            }
          `}</style>
    </div>
  );
}
