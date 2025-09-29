'use client';

import React from 'react';

// This is a placeholder for the NotificationCenter component.

interface Notification {
  id: string;
  isRead: boolean;
  message: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
  onViewAllClick: () => void;
}

export function NotificationCenter({ isOpen, onClose, notifications }: NotificationCenterProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', width: '300px', height: '400px', backgroundColor: 'white', border: '1px solid black', zIndex: 1000 }}>
      <h2>Notifications</h2>
      <button onClick={onClose}>Close</button>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>{n.message}</li>
        ))}
      </ul>
    </div>
  );
}
