'use client';

import { collection, addDoc, type Firestore } from 'firebase/firestore';

export interface Song {
    title: string;
    artist: string;
    src: string;
    cover: string;
    mood: string;
}

export async function addSong(firestore: Firestore, song: Song) {
    try {
        const docRef = await addDoc(collection(firestore, 'songs'), song);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}
