'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import CreateEventModal from '@/components/CreateEventModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function Home() {
  const { currentUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const handleCreateEventClick = () => {
    if (currentUser) {
      setIsCreateModalOpen(true);
    } else {
      showToast('Please sign in to create an event', 'warning');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-background-secondary h-[calc(100vh-73px)]">
        <div className="text-center max-w-2xl">
          <h1 className="text-6xl font-bold mb-4 text-primary">Pickup</h1>
          <p className="text-2xl mb-8 text-secondary">
            Find spontaneous games and activities happening around you today!
          </p>
          
          <button
            onClick={handleCreateEventClick}
            className="px-8 py-4 rounded-lg font-semibold text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition"
          >
            Create Event
          </button>
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
