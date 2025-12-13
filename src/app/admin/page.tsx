
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addSong } from '@/firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader } from 'lucide-react';
import { MOOD_DEFS } from '../lib/mood-definitions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [src, setSrc] = useState('');
  const [cover, setCover] = useState('');
  const [mood, setMood] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !src || !cover || !mood) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out all fields to add a new song.',
      });
      return;
    }
    setIsSubmitting(true);

    const songData = { title, artist, src, cover, mood: mood.toLowerCase() };

    try {
      await addSong(firestore, songData);

      toast({
        title: 'Song Added!',
        description: `${title} by ${artist} has been added to the database.`,
      });
      // Clear form
      setTitle('');
      setArtist('');
      setSrc('');
      setCover('');
      setMood('');
    } catch (error) {
      // The FirestorePermissionError is thrown by the listener, 
      // but we can still show a generic toast for other potential errors.
      if (!(error as any).name?.includes('FirestorePermissionError')) {
          toast({
              variant: 'destructive',
              title: 'Uh oh! Something went wrong.',
              description: (error as any).message || "Could not save song.",
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </header>
      <main>
        <div className="max-w-xl mx-auto">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl font-semibold leading-none tracking-tight mb-4">Add New Song</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="Song Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                placeholder="Artist Name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
              <Input
                placeholder="Song URL (e.g., /audio/song.mp3 or https://...)"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                required
              />
              <Input
                placeholder="Cover Image URL (e.g., /images/cover.png or https://...)"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                required
              />
              <Select onValueChange={setMood} value={mood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a mood" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(MOOD_DEFS).map((moodKey) => (
                    <SelectItem key={moodKey} value={moodKey}>
                      {MOOD_DEFS[moodKey as keyof typeof MOOD_DEFS].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader className="animate-spin mr-2" size={16} /> Adding...</> : 'Add Song'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
