
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search, Library, Heart, LogOut, LogIn, Plus } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useSongs } from '@/hooks/use-songs';
import { useAppContext } from '@/context/AppContext';

export default function AuthButtons() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { setActivePage, activePage } = useAppContext();
  const { likedSongIds } = useUserPreferences(user?.uid);
  const { songs } = useSongs();

  const likedSongs = songs.filter(song => likedSongIds.includes(song.id!));

  const handleNavigation = (path: string) => {
    setActivePage('home');
    router.push(path);
  };
  
  if (isUserLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => handleNavigation('/')} isActive={router.pathname === '/'}>
            <Home />
            <span>Home</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => handleNavigation('/search')}>
            <Search />
            <span>Search</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Library />
            <span>Your Library</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {user && (
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton>
                    <div className="liked-songs-icon"><Heart /></div>
                    <span>Liked Songs</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}

      <ScrollArea className="flex-grow p-2">
        {user && likedSongs.length > 0 && (
            <SidebarMenu>
                {likedSongs.slice(0, 10).map(song => (
                    <SidebarMenuItem key={song.id}>
                        <SidebarMenuButton className="h-auto py-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={song.cover} alt={song.title}/>
                                <AvatarFallback>{song.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start">
                                <span>{song.title}</span>
                                <small className="text-xs text-muted-foreground">{song.artist}</small>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        )}
      </ScrollArea>

      <SidebarFooter>
        {user ? (
          <SidebarMenuButton onClick={() => auth.signOut()}>
            <LogOut />
            <span>Sign Out</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton onClick={() => router.push('/login')}>
            <LogIn />
            <span>Sign In</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </>
  );
}
