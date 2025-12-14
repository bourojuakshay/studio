
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addSong, updateSong, deleteSong, type Song } from '@/firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useSongs } from '@/hooks/use-songs';
import { Loader, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import { MOOD_DEFS } from '../lib/mood-definitions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from 'next/image';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [src, setSrc] = useState('');
  const [cover, setCover] = useState('');
  const [mood, setMood] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null); // To store the ID of the song being edited
  const { toast } = useToast();
  const firestore = useFirestore();
  const { songs, loading: songsLoading } = useSongs();

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setSrc('');
    setCover('');
    setMood('');
    setEditMode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !src || !cover || !mood) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out all fields to add or update a song.',
      });
      return;
    }
    setIsSubmitting(true);

    const songData: Omit<Song, 'id'> = { title, artist, src, cover, mood: mood.toLowerCase(), emotions: [mood.toLowerCase()] };

    try {
      if (editMode) {
        await updateSong(firestore, editMode, songData);
        toast({
          title: 'Song Updated!',
          description: `${title} by ${artist} has been updated.`,
        });
      } else {
        await addSong(firestore, songData);
        toast({
          title: 'Song Added!',
          description: `${title} by ${artist} has been added to the database.`,
        });
      }
      resetForm();
    } catch (error) {
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

  const handleEdit = (song: Song) => {
    setEditMode(song.id!);
    setTitle(song.title);
    setArtist(song.artist);
    setSrc(song.src);
    setCover(song.cover);
    setMood(song.mood);
  };

  const handleDelete = async (songId: string) => {
    try {
      await deleteSong(firestore, songId);
      toast({
        title: 'Song Deleted',
        description: 'The song has been removed from the database.',
      });
    } catch (error) {
        if (!(error as any).name?.includes('FirestorePermissionError')) {
          toast({
              variant: 'destructive',
              title: 'Uh oh! Something went wrong.',
              description: (error as any).message || "Could not delete song.",
          });
      }
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button variant="outline" onClick={() => router.push('/')}>
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Home
        </Button>
      </header>
      <main className="flex flex-col gap-8">
        <div className="max-w-2xl mx-auto w-full">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl font-semibold leading-none tracking-tight mb-4">
              {editMode ? 'Update Song' : 'Add New Song'}
            </h2>
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

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-grow">
                  {isSubmitting ? <><Loader className="animate-spin mr-2" size={16} /> {editMode ? 'Updating...' : 'Adding...'}</> : (editMode ? 'Update Song' : 'Add Song')}
                </Button>
                {editMode && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
           <div className="p-6">
            <h2 className="text-2xl font-semibold leading-none tracking-tight">Manage Songs</h2>
           </div>
           <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader className="animate-spin mx-auto my-4" />
                    </TableCell>
                  </TableRow>
                ) : songs.length > 0 ? (
                  songs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell>
                        <Image src={song.cover} alt={song.title} width={48} height={48} className="rounded-md object-cover w-12 h-12" />
                      </TableCell>
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell>{song.mood}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(song)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the song
                                "{song.title}" from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(song.id!)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No songs found. Add one using the form above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
           </div>
        </div>
      </main>
    </div>
  );
}
