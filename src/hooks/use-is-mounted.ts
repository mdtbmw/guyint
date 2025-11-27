
'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if the component is mounted on the client.
 * This is useful to prevent hydration mismatches in Next.js when dealing
 * with client-side state like window properties or wallet connections.
 * 
 * @returns {boolean} `true` if the component is mounted, otherwise `false`.
 */
export function useIsMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
