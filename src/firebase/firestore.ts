'use client';

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

export interface UserProfile {
    id?: string;
    name: string;
    email: string;
    createdAt: any;
    likedSongs: string[];
    playlists: { id: string; name: string; songIds: string[] }[];
    recentPlays: string[];
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

    const userDocRef = doc(firestore, 'users', userId);
    
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            let likedSongs = userData.likedSongs || [];
            if (liked) {
                if (!likedSongs.includes(songId)) {
                    likedSongs.push(songId);
                }
            } else {
                likedSongs = likedSongs.filter(id => id !== songId);
            }
            updateDoc(userDocRef, { likedSongs }).catch((serverError) => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: { likedSongs },
                }));
            });
        }
    } catch (error) {
        // This could be a permission error on getDoc
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        }));
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

export async function searchSongs(firestore: Firestore, searchTerm: string): Promise<Song[]> {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return [];
    
    const songsCollection = collection(firestore, 'songs');
    // Firestore does not support case-insensitive querying directly.
    // A common workaround is to store a lowercased version of the fields.
    // Since we don't have that, we'll do a prefix match which is case-sensitive.
    // This will match 'SearchTerm' but not 'searchterm'.
    // For a real-world app, you'd use a dedicated search service like Algolia/Elasticsearch
    // or store lowercase fields.
    const titleQuery = query(songsCollection, where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'));
    const artistQuery = query(songsCollection, where('artist', '>=', searchTerm), where('artist', '<=', searchTerm + '\uf8ff'));

    try {
        const [titleSnapshot, artistSnapshot] = await Promise.all([
            getDocs(titleQuery),
            getDocs(artistQuery)
        ]);

        const results: { [key: string]: Song } = {};
        titleSnapshot.forEach(doc => {
            results[doc.id] = { id: doc.id, ...doc.data() } as Song;
        });
        artistSnapshot.forEach(doc => {
            // This might overwrite a title match if the same song matches both artist and title, which is fine.
            results[doc.id] = { id: doc.id, ...doc.data() } as Song;
        });

        return Object.values(results);
    } catch (error) {
        console.error("Error searching songs: ", error);
        if (error instanceof Error && error.message.includes('permission-denied')) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: songsCollection.path,
                operation: 'list'
            }));
        }
        return [];
    }
}
