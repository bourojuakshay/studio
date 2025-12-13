'use client';

import { collection, addDoc, type Firestore } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from './errors';

export interface Song {
    title: string;
    artist: string;
    src: string;
    cover: string;
    mood: string;
}

export function addSong(firestore: Firestore, song: Song) {
    const songsCollection = collection(firestore, 'songs');
    
    // No await, chaining .catch() for error handling
    return addDoc(songsCollection, song)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: songsCollection.path,
                operation: 'create',
                requestResourceData: song,
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', permissionError);
            
            // Re-throw the original error to be caught by the caller if needed,
            // though in this new architecture, we let the emitter handle it.
            throw serverError;
        });
}
