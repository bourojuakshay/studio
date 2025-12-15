
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
    const { setNowPlayingId, setActivePage } = useAppContext();
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
        if (!song.id) return;
        setNowPlayingId(song.id); 
        setActivePage(song.mood);
    };

    const handleNavigate = (page: string) => {
        if (page.startsWith('/')) {
            router.push(page);
        } else {
            setActivePage(page);
             // If navigating to a mood, we might want to go to the home page
            // to show the context, but for now we'll just switch the active page.
            // A redirect to home might be better ux.
            router.push('/');
        }
    };

    return (
        <SidebarProvider>
            <Sidebar side="left">
                 <AuthButtons onNavigate={handleNavigate} />
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
                    <h1 className="text-2xl font-bold mb-6">Search Results</h1>
                    {isLoading && !debouncedSearchTerm ? (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-muted-foreground">Search for your favorite songs and artists...</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center mt-8">
                            <Loader className="animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {results.map((song) => (
                                <div key={song.id} className="album-card" onClick={() => playSong(song)}>
                                    <div className="album-card-image">
                                        <Image src={song.cover} alt={song.title} width={150} height={150} className="rounded-md mb-2 aspect-square object-cover" />
                                    </div>
                                    <div className="album-card-info">
                                        <p className="album-card-title">{song.title}</p>
                                        <p className="album-card-artist">{song.artist}</p>
                                    </div>
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
