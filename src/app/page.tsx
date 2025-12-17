'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { AnimatePresence } from 'framer-motion';
import { Bell, Search, Library, Plus, Heart, Music } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { MoodPage } from '@/components/MoodPage';
import { useSongs } from '@/hooks/use-songs';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { setUserSongPreference, type Song } from '@/firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { MOOD_DEFS, type MoodDefinition } from '@/app/lib/mood-definitions';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/context/AppContext';
import AuthButtons from '@/components/AuthButtons';
import Loader from '@/components/Loader';

export const dynamic = 'force-dynamic';

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


export default function Home() {
  const { setPlaylist, setNowPlayingId, currentTrack, setActivePage, activePage, globalLoading, setLoadingFlag } = useAppContext();
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { likedSongIds, loading: prefsLoading } = useUserPreferences(user?.uid);
  const { songs: firestoreSongs, loading: songsLoading } = useSongs();
  
  const [tracksByMood, setTracksByMood] = useState<Record<string, Song[]>>({});
  const [filteredTracks, setFilteredTracks] = useState<Song[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoadingFlag('user', isUserLoading);
    setLoadingFlag('songs', songsLoading);
    setLoadingFlag('prefs', prefsLoading);
  }, [isUserLoading, songsLoading, prefsLoading, setLoadingFlag]);

  const handleExitIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  useEffect(() => {
    if (firestoreSongs) {
      setPlaylist(firestoreSongs);

      const newTracksByMood: Record<string, Song[]> = {'all': firestoreSongs};
      firestoreSongs.forEach(song => {
        const moods = Array.isArray(song.emotions) ? song.emotions : [song.mood];
        moods.forEach(mood => {
            if (!newTracksByMood[mood]) {
                newTracksByMood[mood] = [];
            }
            newTracksByMood[mood].push(song);
        });
      });
      setTracksByMood(newTracksByMood);
    }
  }, [firestoreSongs, setPlaylist]);

  useEffect(() => {
    if (selectedEmotion === 'all') {
      setFilteredTracks(tracksByMood.all || []);
    } else {
      setFilteredTracks(tracksByMood[selectedEmotion] || []);
    }
  }, [selectedEmotion, tracksByMood]);

  const openPlayer = (songId: string) => {
    setNowPlayingId(songId);
  };
  
  const handleMoodCardClick = (moodKey: string) => {
      router.push(`/${moodKey}`);
  }

  const isLiked = (songId: string) => {
    if (!songId) return false;
    return likedSongIds.includes(songId);
  }

  const handleLike = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) {
        router.push('/login');
        toast({
            title: 'Please sign in',
            description: 'You need to be signed in to like songs.',
        });
        return;
    }
    if (!songId) return;
    
    const currentlyLiked = isLiked(songId);
    setUserSongPreference(firestore, user.uid, songId, !currentlyLiked);
  }

  const openPage = (id: string) => {
    if (id.startsWith('/')) {
        router.push(id);
    } else {
        // This is for legacy navigation from other components, can be phased out.
        if (id === 'home') {
            setShowIntro(false);
            router.push('/');
        } else {
            router.push(`/${id}`);
        }
    }
  };
  
  const allMoods = { ...MOOD_DEFS };
    
  // Determine current page for main content area
  const isHomePage = pathname === '/';
  const currentMood = Object.keys(allMoods).find(m => `/${m}` === pathname);
  
  useEffect(() => {
      // Logic to set active page in context for theme provider
      if(isHomePage) {
        setActivePage('home');
      } else if (currentMood) {
        setActivePage(currentMood);
      }
      // If we navigate away from home, we shouldn't see the intro again on this session.
      if (!isHomePage) {
        setShowIntro(false);
      }
  }, [pathname, isHomePage, currentMood, setActivePage]);

  // Hide intro if loading is finished
  useEffect(() => {
    if (!globalLoading) {
      handleExitIntro();
    }
  }, [globalLoading, handleExitIntro]);

  const MainContent = () => (
    <>
        <div className="home-section-grid">
            <h2 className="section-title">Recently Played</h2>
            <div className="album-grid">
                {(tracksByMood.all || []).slice(0, 6).map((track, i) => (
                    <AlbumCard key={track.id || i} track={track} onClick={() => openPlayer(track.id!)} />
                ))}
            </div>
        </div>
        <div className="home-section-grid">
            <h2 className="section-title">Recommended Stations</h2>
             <div className="album-grid">
                {(tracksByMood.all || []).slice(6, 12).map((track, i) => (
                    <AlbumCard key={track.id || i} track={track} onClick={() => openPlayer(track.id!)} />
                ))}
            </div>
        </div>
        <div className="home-section-grid">
            <div className="flex justify-between items-center">
              <h2 className="section-title">How are you feeling today?</h2>
              <Button variant="link" onClick={() => setSelectedEmotion('all')}>Show all</Button>
            </div>
            <div className="album-grid emotion-grid">
              {Object.entries(allMoods).map(([key, { emoji, title }]) => (
                <div 
                  key={key} 
                  className={cn("emotion-card", { active: selectedEmotion === key })}
                  onClick={() => handleMoodCardClick(key)}
                >
                  <span>{emoji}</span>
                  <p>{title}</p>
                </div>
              ))}
            </div>
        </div>
        <div className="home-section-grid">
            <h2 className="section-title">{selectedEmotion === 'all' ? 'Popular Playlists' : `For Your ${selectedEmotion.charAt(0).toUpperCase() + selectedEmotion.slice(1)}`}</h2>
            <div className="album-grid">
                {filteredTracks.slice(0, 12).map((track, i) => (
                    <AlbumCard key={track.id || i} track={track} onClick={() => openPlayer(track.id!)} />
                ))}
            </div>
        </div>
    </>
  );

  return (
    <SidebarProvider>
      <ThemeProvider 
        activePage={activePage} 
        customMoods={{}}
        tracks={tracksByMood}
        nowPlayingId={null} // nowPlayingId from context is sufficient
        allMoods={allMoods}
        currentTrack={currentTrack}
      />
      
      <Sidebar side="left">
        <AuthButtons onNavigate={openPage} />
      </Sidebar>
      
      <SidebarInset>
        <header className="app-header">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="What do you want to play?" className="pl-10" onFocus={() => router.push('/library')} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Premium</Button>
            <Button variant="ghost" size="icon"><Bell /></Button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => user && router.push('/admin')}>
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="app-main">
          {isHomePage ? (
              <MainContent />
          ) : currentMood ? (
             <AnimatePresence>
               <MoodPage
                  mood={currentMood}
                  definition={allMoods[currentMood]}
                  tracks={tracksByMood[currentMood]}
                  handleLike={handleLike}
                  isLiked={isLiked}
                  openPlayer={openPlayer}
               />
              </AnimatePresence>
          ) : null}
        </main>
        
        <footer className="app-footer">
          <small>Made with ❤️ by Bouroju Akshay • <a href="mailto:23eg106b12@anurag.edu.in">23eg106b12@anurag.edu.in</a> • MoodyO Demo</small>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
