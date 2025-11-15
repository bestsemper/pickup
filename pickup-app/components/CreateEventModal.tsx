'use client';

import { useState } from 'react';
import { createEvent } from '@/lib/firebase/events';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    activity: 'Basketball',
    locationName: '',
    locationAddress: '',
    duration: 60,
    maxParticipants: undefined as number | undefined,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you'd get the user ID from authentication
      const userId = 'temp-user-id'; // TODO: Get from auth context
      
      const now = new Date();
      const endTime = new Date(now.getTime() + formData.duration * 60000);
      
      await createEvent({
        id: '', // Will be set by Firestore
        title: formData.title,
        activity: formData.activity,
        eventName: formData.title,
        type: formData.activity,
        subType: formData.activity,
        location: {
          name: formData.locationName,
          address: formData.locationAddress,
          lat: 38.0336, // TODO: Get from geocoding
          lng: -78.5080,
        },
        createdBy: {
          uid: userId,
          name: 'Anonymous User', // TODO: Get from user profile
        },
        duration: formData.duration,
        startTime: now,
        endTime: endTime,
        participants: [userId],
        maxParticipants: formData.maxParticipants,
        description: formData.description,
      });

      // Reset form
      setFormData({
        title: '',
        activity: 'Basketball',
        locationName: '',
        locationAddress: '',
        duration: 60,
        maxParticipants: undefined,
        description: '',
      });

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create Pickup Event</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Title *</label>
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
              <label className="block text-sm font-medium mb-1">Activity Type *</label>
              <select
                required
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option>Basketball</option>
                <option>Soccer</option>
                <option>Ultimate Frisbee</option>
                <option>Volleyball</option>
                <option>Tennis</option>
                <option>Board Game</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location Name *</label>
              <input
                type="text"
                required
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder="e.g., Slaughter Rec Center"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <input
                type="text"
                required
                value={formData.locationAddress}
                onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                placeholder="e.g., 1000 Stadium Rd, Charlottesville, VA"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                required
                min="15"
                max="180"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
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
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Any additional details..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
