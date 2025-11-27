'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(q: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      setData([]);
      return;
    };

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      async (err) => {
        // Re-throw the original error to get the full context in the dev overlay,
        // including the link to create a composite index if that's the cause.
        setError(err);
        setLoading(false);
        throw err;
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
