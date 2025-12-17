'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useSongs } from '@/hooks/use-songs';
import { Song } from '@/firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import AuthButtons from '@/components/AuthButtons';
import { Plus, Music } from 'lucide-react';
import Loader from '@/components/Loader';

const AlbumCard = ({ track, onClick }: { track: Song; onClick: () => void }) => (
    <div className="album-card" onClick={onClick}>
        <div className="album-card-image">
            <Image src={track.cover} alt={track.title} width={150} height={150} />
            <Button variant="default" size="icon" className="play-button">
              <Music size={20} />
            </Button>
        </div>
        <div className="album-card-info">
            <p className="album-card-title">{track.title}</p>
            <p className="album-card-artist">{track.artist}</p>
        </div>
    </div>
);

export default function LibraryPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { likedSongIds, loading: prefsLoading } = useUserPreferences(user?.uid);
    const { songs, loading: songsLoading } = useSongs();
    const { setNowPlayingId, setActivePage } = useAppContext();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
        setActivePage('home'); // Use default theme
    }, [user, isUserLoading, router, setActivePage]);

    const likedSongs = React.useMemo(() => {
        if (!songs || !likedSongIds) return [];
        return songs.filter(song => likedSongIds.includes(song.id!));
    }, [songs, likedSongIds]);
    
    const openPlayer = (songId: string) => {
        setNowPlayingId(songId);
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    }
    
    const isLoading = isUserLoading || prefsLoading || songsLoading;

    return (
        <SidebarProvider>
            <Sidebar side="left">
                <AuthButtons onNavigate={handleNavigate} />
            </Sidebar>

            <SidebarInset>
                <header className="app-header">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-2xl font-bold">Your Library</h1>
                </header>
                <main className="app-main">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <Button size="lg">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Create new playlist
                                </Button>
                            </div>

                            <div className="home-section-grid">
                                <h2 className="section-title">Liked Songs</h2>
                                {likedSongs.length > 0 ? (
                                    <div className="album-grid">
                                        {likedSongs.map((track, i) => (
                                            <AlbumCard key={track.id || i} track={track} onClick={() => openPlayer(track.id!)} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">You haven&apos;t liked any songs yet. Start exploring and like some songs to see them here!</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
