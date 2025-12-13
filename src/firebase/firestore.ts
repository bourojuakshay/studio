
'use a client';

import { collection, addDoc, type Firestore, query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from './errors';

export interface Song {
    id?: string;
    title: string;
    artist: string;
    src: string;
    cover: string;
    mood: string;
}

export function addSong(firestore: Firestore, song: Omit<Song, 'id'>) {
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

export function getSongs(
    firestore: Firestore,
    callback: (songs: Song[]) => void,
    onError: (error: Error) => void
) {
    const songsCollection = collection(firestore, 'songs');
    const q = query(songsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const songs: Song[] = [];
        querySnapshot.forEach((doc) => {
            songs.push({ id: doc.id, ...doc.data() } as Song);
        });
        callback(songs);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: songsCollection.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        onError(permissionError);
    });

    return unsubscribe;
}
