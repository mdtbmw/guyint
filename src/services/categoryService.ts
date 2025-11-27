
'use client';
import { addDoc, collection, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const { firestore } = initializeFirebase();
const categoriesCollection = collection(firestore, 'categories');

export async function addCategory(category: { name: string; icon: string }): Promise<string> {
  try {
    const docRef = await addDoc(categoriesCollection, {
      ...category,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (serverError) {
    console.error("Firestore Add Error:", serverError);
    const permissionError = new FirestorePermissionError({
      path: categoriesCollection.path,
      operation: 'create',
      requestResourceData: category,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const docRef = doc(firestore, 'categories', id);
  try {
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (serverError) {
     console.error("Firestore Update Error:", serverError);
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updates,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(firestore, 'categories', id);
  try {
    await deleteDoc(docRef);
  } catch (serverError) {
    console.error("Firestore Delete Error:", serverError);
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
