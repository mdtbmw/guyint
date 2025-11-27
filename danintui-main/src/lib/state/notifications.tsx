
'use client';

import { atom, useAtom, useSetAtom, WritableAtom, Atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { NotificationType } from '@/lib/types';
import React, { createContext, useContext, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useSettings, defaultSettings } from './settings';

type NotificationCategory = keyof (typeof defaultSettings.notifications);

const notificationTypeToCategoryMap: Record<string, NotificationCategory | null> = {
    'Bet Submitted': 'onBetPlaced',
    'Bet Placed Successfully!': 'onBetPlaced',
    'Outcome Declared!': 'onEventResolved',
    'Event Resolved!': 'onEventResolved',
    'Success!': 'onWinningsClaimed',
    'Claims Processed': 'onWinningsClaimed',
};


// Define the shape of the notification context
interface NotificationContextType {
  notificationsAtom: WritableAtom<NotificationType[], [React.SetStateAction<NotificationType[]>], void>;
  unreadNotificationsCountAtom: Atom<number>;
  addNotificationAtom: WritableAtom<null, [Omit<NotificationType, 'id' | 'timestamp' | 'read'>], void>;
  markAllNotificationsAsReadAtom: WritableAtom<null, [], void>;
  clearAllNotificationsAtom: WritableAtom<null, [], void>;
}

// Create a context to hold the atoms
const NotificationContext = createContext<NotificationContextType | null>(null);

// Custom hook to use the notification context
export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

// Public hook for easy access
export const useNotifications = () => {
    const context = useNotificationsContext();
    const [notifications] = useAtom(context.notificationsAtom);
    const [unreadCount] = useAtom(context.unreadNotificationsCountAtom);
    const addNotification = useSetAtom(context.addNotificationAtom);
    const markAllAsRead = useSetAtom(context.markAllNotificationsAsReadAtom);
    const clearAllNotifications = useSetAtom(context.clearAllNotificationsAtom);

    return {
        notifications,
        unreadCount,
        addNotification,
        markAllAsRead,
        clearAllNotifications
    }
}


// Factory function to create user-specific atoms
const createNotificationAtoms = (address: string | null | undefined, getSettings: () => typeof defaultSettings): NotificationContextType => {
    const storageKey = address ? `notifications_${address}` : 'notifications_guest';
    
    const baseNotificationsAtom = atomWithStorage<NotificationType[]>(storageKey, []);

    const unreadCountAtom = atom((get) => get(baseNotificationsAtom).filter((n) => !n.read).length);

    const addAtom = atom(
        null,
        (get, set, newNotification: Omit<NotificationType, 'id' | 'timestamp' | 'read'>) => {
            const settings = getSettings();
            const category = notificationTypeToCategoryMap[newNotification.title] || null;

            // If the notification has a category, check if it's enabled in settings.
            if (category && settings.notifications[category] === false) {
                return; // Do not add the notification if its category is disabled.
            }

            const newId = `${new Date().toISOString()}_${Math.random()}`;
            const existing = get(baseNotificationsAtom);
            const isDuplicate = existing.some(n => 
                n.title === newNotification.title && 
                n.description === newNotification.description &&
                (new Date().getTime() - new Date(n.timestamp).getTime()) < 2000
            );

            if (!isDuplicate) {
                set(baseNotificationsAtom, (prev) => [
                    { ...newNotification, id: newId, timestamp: new Date(), read: false },
                    ...prev,
                ]);
            }
        }
    );

    const markAllReadAtom = atom(
        null,
        (_get, set) => {
            set(baseNotificationsAtom, (prev) => prev.map((n) => ({ ...n, read: true })));
        }
    );

    const clearAllAtom = atom(
        null,
        (_get, set) => {
            set(baseNotificationsAtom, []);
        }
    );

    return {
        notificationsAtom: baseNotificationsAtom,
        unreadNotificationsCountAtom: unreadCountAtom,
        addNotificationAtom: addAtom,
        markAllNotificationsAsReadAtom: markAllReadAtom,
        clearAllNotificationsAtom: clearAllAtom,
    };
};

// Provider component to wrap the app
export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { address } = useWallet();
  const { settings } = useSettings(); // Get current settings

  // Use a stable function to pass to the factory
  const getSettings = () => settings;
  
  const notificationAtoms = useMemo(() => createNotificationAtoms(address, getSettings), [address, settings]);

  return (
    <NotificationContext.Provider value={notificationAtoms}>
      {children}
    </NotificationContext.Provider>
  );
};
