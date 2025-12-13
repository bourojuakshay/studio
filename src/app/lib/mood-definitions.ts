
export type MoodDefinition = {
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  emoji: string;
  themeClass: string;
};

export const MOOD_DEFS: { [key: string]: MoodDefinition } = {
  happy: {
    title: 'Happy',
    subtitle: 'Feel-good tracks with a deep groove',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '😄',
    themeClass: 'happy-active',
  },
  joyful: {
    title: 'Joyful',
    subtitle: 'High-energy songs — perfect for smiles and movement',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '🥳',
    themeClass: 'joyful-active',
  },
  sad: {
    title: 'Sad',
    subtitle: 'Slow, emotional tracks to reflect',
    accent: 'hsl(220, 40%, 40%)',
    bg: 'linear-gradient(43deg, hsl(220, 40%, 20%) 0%, hsl(220, 20%, 10%) 100%)',
    emoji: '😢',
    themeClass: 'sad-active',
  },
  depression: {
    title: 'Depression',
    subtitle: 'Ambient textures and slow soundscapes',
    accent: 'hsl(240, 10%, 40%)',
    bg: 'linear-gradient(43deg, hsl(240, 10%, 15%) 0%, hsl(240, 5%, 5%) 100%)',
    emoji: '😔',
    themeClass: 'depression-active',
  }
};

export type Track = {
  title: string;
  artist: string;
  src: string;
  cover: string;
  mood?: string;
  index?: number;
};
