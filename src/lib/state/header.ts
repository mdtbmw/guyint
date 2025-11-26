
'use client';

import { atom, useAtom } from 'jotai';

interface HeaderState {
  title: string;
  subtitle: string;
}

const headerStateAtom = atom<HeaderState>({
  title: '',
  subtitle: '',
});

export const useHeaderState = () => {
  const [headerState, setHeaderState] = useAtom(headerStateAtom);
  return { ...headerState, setHeaderState };
};

// A provider component isn't strictly necessary if you're using the base `Provider`
// from Jotai in your layout, but this can be a good pattern if you want to isolate states.
// For this case, we'll assume the root Jotai Provider is sufficient.

import { Provider as JotaiProvider, useSetAtom } from 'jotai';
import React, { createContext, useContext, useMemo } from 'react';

const HeaderContext = createContext<{
    setHeaderState: (update: HeaderState) => void;
} | null>(null);

export const HeaderStateProvider = ({ children }: { children: React.ReactNode }) => {
    const setHeaderState = useSetAtom(headerStateAtom);

    const value = useMemo(() => ({
        setHeaderState
    }), [setHeaderState]);

    return (
        <HeaderContext.Provider value={value}>
            {children}
        </HeaderContext.Provider>
    )
}
