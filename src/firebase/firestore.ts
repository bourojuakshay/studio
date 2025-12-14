
'use a client';

import { collection, addDoc, updateDoc, deleteDoc, doc, type Firestore, query, onSnapshot, where, getDocs, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from './errors';

export interface Song {
    id?: string;
    title: string;
    artist: string;
    src: string;
    cover: string;
    mood: string;
    emotions: string[];
    popularity?: number;
    createdAt?: any;
}

export interface UserSongPreference {
    id?: string;
    userId: string;
    songId: string;
    liked: boolean;
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

export function updateSong(firestore: Firestore, songId: string, song: Partial<Omit<Song, 'id'>>) {
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

export async function setUserSongPreference(firestore: Firestore, userId: string, songId: string, liked: boolean) {
    if (!userId || !songId) return;

    const preferenceCollection = collection(firestore, `users/${userId}/song_preferences`);
    const q = query(preferenceCollection, where("songId", "==", songId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newPrefRef = doc(preferenceCollection);
        const preferenceData: UserSongPreference = { id: newPrefRef.id, userId, songId, liked };
        
        setDoc(newPrefRef, preferenceData).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: newPrefRef.path,
                operation: 'create',
                requestResourceData: preferenceData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
        const docToUpdate = querySnapshot.docs[0];
        updateDoc(docToUpdate.ref, { liked }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docToUpdate.ref.path,
                operation: 'update',
                requestResourceData: { liked },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
    }
}

export function getUserSongPreferences(
    firestore: Firestore,
    userId: string,
    callback: (preferences: UserSongPreference[]) => void,
    onError: (error: Error) => void
) {
    const preferenceCollection = collection(firestore, `users/${userId}/song_preferences`);
    const q = query(preferenceCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const preferences: UserSongPreference[] = [];
        querySnapshot.forEach((doc) => {
            preferences.push({ id: doc.id, ...doc.data() } as UserSongPreference);
        });
        callback(preferences);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: preferenceCollection.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        onError(permissionError);
    });

    return unsubscribe;
}
