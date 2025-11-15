'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CloseIcon from './icons/CloseIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export default function SettingsModal({ isOpen, onClose, theme, onThemeToggle }: SettingsModalProps) {
  const { currentUser, resetPassword } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!currentUser?.email) {
      alert('No email found for current user');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(currentUser.email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Reset password error:', error);
      alert('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
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
        className="rounded-lg shadow-xl w-full max-w-md"
        style={{ backgroundColor: 'var(--card-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center p-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:opacity-70"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Appearance
            </h3>
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center justify-between p-4 rounded-lg border hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-3">
                {theme === 'light' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Theme
                  </p>
                  <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                </div>
              </div>
              <span className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                Switch to {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Account
            </h3>
            <div className="space-y-3">
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--foreground-secondary)' }}>
                  Email
                </p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {currentUser?.email}
                </p>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full p-4 rounded-lg border hover:opacity-80"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  borderColor: 'var(--border)',
                  opacity: resetLoading ? 0.5 : 1,
                  cursor: resetLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {resetLoading ? 'Sending...' : 'Reset Password'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground-secondary)' }}>
                  Send password reset email
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-6 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--secondary)',
              color: 'white'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
