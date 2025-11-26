
'use client';

import { atom, useAtom, SetStateAction, WritableAtom, Atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import React, { createContext, useContext, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';

export const defaultSettings = {
  username: '',
  bio: '',
  twitter: '',
  website: '',
  notifications: {
    onBetPlaced: true,
    onEventResolved: true,
    onWinningsClaimed: true,
  },
};

export type Settings = typeof defaultSettings;

interface SettingsContextType {
  settingsAtom: WritableAtom<Settings, [SetStateAction<Settings>], void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Custom hook to use settings context
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};


// Public hook for components to use settings
export const useSettings = (): { settings: Settings; setSettings: (update: SetStateAction<Settings>) => void } => {
    const { settingsAtom } = useSettingsContext();
    const [settings, setSettings] = useAtom(settingsAtom);

    return { settings, setSettings };
}

const createSettingsAtom = (address: string | null | undefined) => {
  const storageKey = address ? `settings_${address}` : 'settings_guest';
  return atomWithStorage<Settings>(storageKey, defaultSettings);
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { address } = useWallet();
  
  const settingsAtom = useMemo(() => createSettingsAtom(address), [address]);

  return (
    <SettingsContext.Provider value={{ settingsAtom }}>
      {children}
    </SettingsContext.Provider>
  );
};
