
'use a client';

import { collection, addDoc, updateDoc, deleteDoc, doc, type Firestore, query, onSnapshot } from 'firebase/firestore';
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
    
    return addDoc(songsCollection, song)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: songsCollection.path,
                operation: 'create',
                requestResourceData: song,
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}

export function updateSong(firestore: Firestore, songId: string, song: Omit<Song, 'id'>) {
    const songDoc = doc(firestore, 'songs', songId);

    return updateDoc(songDoc, song)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: songDoc.path,
                operation: 'update',
                requestResourceData: song,
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}

export function deleteSong(firestore: Firestore, songId: string) {
    const songDoc = doc(firestore, 'songs', songId);

    return deleteDoc(songDoc)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: songDoc.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', permissionError);
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

    