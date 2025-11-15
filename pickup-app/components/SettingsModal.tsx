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
  const { currentUser, userProfile, resetPassword, updateProfile } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || '');

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

  const handlePhotoURLChange = (url: string) => {
    setPhotoURL(url);
    setPhotoPreview(url);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataURL = event.target?.result as string;
        setPhotoURL(dataURL);
        setPhotoPreview(dataURL);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to upload image');
    }
  };

  const handleRemoveProfilePicture = () => {
    setPhotoURL('');
    setPhotoPreview('');
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      alert('Username cannot be empty');
      return;
    }

    setUpdateLoading(true);
    try {
      await updateProfile(displayName.trim(), photoURL.trim() || undefined);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
    >
      <div 
        className="rounded-lg shadow-xl w-full max-w-md bg-card flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground">
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:opacity-70"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-2 pb-4">
          <div className="h-px mx-4" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Profile Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Profile
            </h3>
            <div className="space-y-4">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm mb-2 text-secondary">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full py-2 rounded-lg border border-default bg-background-secondary text-foreground cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white file:cursor-pointer file:font-medium hover:file:opacity-50"
                  style={{
                    color: 'transparent',
                  }}
                />
                <button
                  onClick={handleRemoveProfilePicture}
                  disabled={!photoPreview}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-default bg-background-secondary text-foreground hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Remove Picture
                </button>
                <p className="text-xs text-tertiary mt-1">
                  Max file size: 1MB. Supported formats: PNG, JPG, GIF, WebP
                </p>
                {photoPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      onError={() => setPhotoPreview('')}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Preview</p>
                      <p className="text-xs text-secondary">Your new profile picture</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm mb-2 text-secondary">
                  Username
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3 py-2 rounded-lg border border-default bg-background-secondary text-foreground"
                />
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdateProfile}
                disabled={updateLoading}
                className="w-full p-4 rounded-lg border border-default hover:opacity-80 bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-foreground">
                  {updateLoading ? 'Updating...' : 'Update Profile'}
                </p>
              </button>
            </div>
          </div>

          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Appearance
            </h3>
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-default hover:opacity-80 bg-background-secondary"
            >
              <div className="flex items-center gap-3">
                {theme === 'light' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    Theme
                  </p>
                  <p className="text-sm text-secondary">
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                </div>
              </div>
              <span className="text-sm text-secondary">
                Switch to {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Account
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-default bg-background-secondary">
                <p className="text-sm mb-1 text-secondary">
                  Email
                </p>
                <p className="font-medium text-foreground">
                  {currentUser?.email}
                </p>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full p-4 rounded-lg border border-default hover:opacity-80 bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-foreground">
                  {resetLoading ? 'Sending...' : 'Reset Password'}
                </p>
                <p className="text-sm mt-1 text-secondary">
                  Send password reset email
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
