'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  findUserByEmail
} from '@/lib/firebase/friends';
import CloseIcon from './icons/CloseIcon';
import UserIcon from './icons/UserIcon';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    if (isOpen) {
      loadFriendsData();
    }
  }, [isOpen]);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      const [friendsList, requestsList] = await Promise.all([
        getFriends(),
        getPendingFriendRequests()
      ]);
      setFriends(friendsList);
      setFriendRequests(requestsList);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendEmail.trim()) return;

    try {
      setAddingFriend(true);
      
      await sendFriendRequest(addFriendEmail.trim().toLowerCase());
      alert('Friend request sent!');
      setAddFriendEmail('');
      await loadFriendsData();
    } catch (error: any) {
      console.error('Error adding friend:', error);
      alert(error.message || 'Failed to send friend request');
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (fromUserId: string) => {
    try {
      await acceptFriendRequest(fromUserId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (fromUserId: string) => {
    try {
      await rejectFriendRequest(fromUserId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await removeFriend(friendId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
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
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Friends</h2>
            <button onClick={onClose} style={{ color: 'var(--foreground-secondary)' }}>
              <CloseIcon />
            </button>
          </div>

          {/* Add Friend by Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Add Friend by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={addFriendEmail}
                onChange={(e) => setAddFriendEmail(e.target.value)}
                placeholder="friend@example.com"
                className="flex-1 px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              />
              <button
                onClick={handleAddFriend}
                disabled={addingFriend || !addFriendEmail.trim()}
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{
                  backgroundColor: 'var(--primary)',
                  opacity: addingFriend || !addFriendEmail.trim() ? 0.5 : 1,
                  cursor: addingFriend || !addFriendEmail.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {addingFriend ? '...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4" style={{ borderBottom: `2px solid var(--border)` }}>
            <button
              onClick={() => setActiveTab('friends')}
              className="px-4 py-2 font-medium"
              style={{
                color: activeTab === 'friends' ? 'var(--primary)' : 'var(--foreground-secondary)',
                borderBottom: activeTab === 'friends' ? `2px solid var(--primary)` : 'none',
                marginBottom: '-2px'
              }}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2 font-medium"
              style={{
                color: activeTab === 'requests' ? 'var(--primary)' : 'var(--foreground-secondary)',
                borderBottom: activeTab === 'requests' ? `2px solid var(--primary)` : 'none',
                marginBottom: '-2px'
              }}
            >
              Requests ({friendRequests.length})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-8" style={{ color: 'var(--foreground-secondary)' }}>
              Loading...
            </div>
          ) : activeTab === 'friends' ? (
            <div className="space-y-2">
              {friends.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--foreground-secondary)' }}>
                  No friends yet. Add some friends to get started!
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--background-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: 'var(--secondary)' }}
                      >
                        {friend.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {friend.displayName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                          {friend.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.uid)}
                      className="px-3 py-1 rounded text-sm"
                      style={{ color: 'var(--error)', border: `1px solid var(--error)` }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {friendRequests.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--foreground-secondary)' }}>
                  No pending friend requests
                </p>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--background-secondary)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: 'var(--secondary)' }}
                      >
                        {request.fromUserName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {request.fromUserName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                          {request.fromUserEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.fromUserId)}
                        className="flex-1 px-3 py-2 rounded text-white font-medium"
                        style={{ backgroundColor: 'var(--secondary)' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.fromUserId)}
                        className="flex-1 px-3 py-2 rounded font-medium"
                        style={{ color: 'var(--error)', border: `1px solid var(--error)` }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
