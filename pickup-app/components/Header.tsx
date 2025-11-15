'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import CreateEventModal from './CreateEventModal';
import FriendsModal from './FriendsModal';
import SettingsModal from './SettingsModal';
import UserIcon from './icons/UserIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import Link from 'next/link';

export default function Header() {
  const { currentUser, userProfile, signOut, resetPassword } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial theme preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || (isDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme by setting color-scheme on html element
    document.documentElement.style.colorScheme = newTheme;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    
    try {
      await resetPassword(currentUser.email);
      alert('Password reset email sent! Check your inbox.');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <>
      <header 
        className="border-b"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            Pickup
          </Link>

          <nav className="flex items-center gap-6">
            <Link 
              href="/map" 
              className="font-medium"
              style={{ color: 'var(--header-text)' }}
            >
              Map
            </Link>
            <Link 
              href="/list" 
              className="font-medium"
              style={{ color: 'var(--header-text)' }}
            >
              List
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)'
                  }}
                >
                  Create Event
                </button>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80"
                    style={{ color: 'var(--foreground-secondary)' }}
                  >
                    <UserIcon />
                    <span>{userProfile?.displayName || currentUser.email}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-1 z-50"
                      style={{ 
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <button
                        onClick={() => {
                          setIsFriendsModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:opacity-80"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Friends
                      </button>
                      <button
                        onClick={() => {
                          setIsSettingsModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:opacity-80"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Settings
                      </button>
                      <div 
                        className="my-1"
                        style={{ 
                          height: '1px',
                          backgroundColor: 'var(--border)'
                        }}
                      />
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:opacity-80"
                        style={{ color: 'var(--error)' }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:opacity-70"
                  style={{ color: 'var(--header-text)' }}
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ 
                    color: 'var(--primary)',
                    border: '1px solid var(--primary)'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => setIsCreateModalOpen(false)}
      />
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    </>
  );
}
