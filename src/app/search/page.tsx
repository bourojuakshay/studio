
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser } from '@/firebase';
import { searchSongs, Song } from '@/firebase/firestore';
import { Loader, Music, Search as SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useDebounce } from '@/hooks/use-debounce';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AuthButtons from '@/components/AuthButtons';

export default function SearchPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { setNowPlaying, setIsPlaying } = useAppContext();
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const handleSearch = useCallback(async (term: string) => {
        if (term.trim() === '') {
            setResults([]);
            return;
        }
        setIsLoading(true);
        const searchResults = await searchSongs(firestore, term);
        setResults(searchResults);
        setIsLoading(false);
    }, [firestore]);

    useEffect(() => {
        handleSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, handleSearch]);

    const playSong = (song: Song) => {
        // This assumes your songs from useSongs() hook are indexed
        // In a real app, you might need a more robust way to find the index
        setNowPlaying({ mood: song.mood, index: song.id as any }); 
        setIsPlaying(true);
    };

    return (
        <SidebarProvider>
            <Sidebar side="left">
                <SidebarHeader>
                    <a href="/" className="logo">MoodyO</a>
                </SidebarHeader>
                <SidebarContent>
                    <AuthButtons />
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <header className="app-header">
                    <SidebarTrigger className="md:hidden" />
                    <div className="relative w-full max-w-lg">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search for songs or artists..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>
                <main className="app-main">
                    <h1 className="text-2xl font-bold mb-6">Search</h1>
                    {isLoading ? (
                        <div className="flex justify-center mt-8">
                            <Loader className="animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {results.map((song) => (
                                <div key={song.id} className="bg-card p-4 rounded-lg flex flex-col items-center text-center cursor-pointer" onClick={() => playSong(song)}>
                                    <Image src={song.cover} alt={song.title} width={150} height={150} className="rounded-md mb-2 aspect-square object-cover" />
                                    <p className="font-semibold truncate w-full">{song.title}</p>
                                    <p className="text-sm text-muted-foreground truncate w-full">{song.artist}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        debouncedSearchTerm && <p className="text-center text-muted-foreground mt-8">No results found for &quot;{debouncedSearchTerm}&quot;.</p>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
