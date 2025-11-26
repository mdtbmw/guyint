
'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/lib/state/notifications';
import { initializeBlockchainServiceNotifier } from '@/services/blockchain';

/**
 * A client component that should be placed at the root of the layout.
 * Its only purpose is to initialize the blockchain service with the 
 * Jotai atom for sending notifications from anywhere in the app.
 */
export function BlockchainServiceNotifier() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    initializeBlockchainServiceNotifier(addNotification);
  }, [addNotification]);

  return null; // This component does not render anything
}
