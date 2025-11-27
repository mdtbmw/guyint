'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("A detailed Firestore permission error was caught:", error);
      
      // In development, we want the full Next.js error overlay for debugging.
      // Re-throwing the error achieves this.
      if (process.env.NODE_ENV === 'development') {
         // We're throwing this in a timeout to break out of the current
         // event loop and prevent React from catching it in its boundary.
         // This forces the Next.js development overlay to appear.
         setTimeout(() => {
            throw error;
         });
      }

      // In production, we show a friendly toast.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
