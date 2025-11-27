
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { GeneratedEvent } from '@/ai/flows/generate-event-flow';

/**
 * An atom to temporarily hold a scouted topic string.
 * This is used to pass a topic from the Admin page to the Create Event page.
 */
export const scoutedTopicAtom = atom<string | null>(null);

/**
 * An atom to persistently store the last AI-generated event in localStorage.
 * This allows the admin to reload the page without losing their generated event data.
 */
export const generatedEventAtom = atomWithStorage<GeneratedEvent | null>('ai_generated_event', null);
