export interface SeekbarColorTheme {
  id: string;
  name: string;
  hex: string;
  gradient: string;
  glow: string;
  textColor: string;
}

export const SEEKBAR_COLOR_THEMES: SeekbarColorTheme[] = [
  {
    id: 'milk-blue',
    name: 'Milk Blue',
    hex: '#5B9FE8',
    gradient: 'linear-gradient(90deg, #5B9FE8 0%, #3B82F6 100%)',
    glow: 'rgba(91, 159, 232, 0.65)',
    textColor: '#BFDFFF',
  },
  {
    id: 'emerald-green',
    name: 'Neon Emerald',
    hex: '#10B981',
    gradient: 'linear-gradient(90deg, #34D399 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.65)',
    textColor: '#A7F3D0',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    hex: '#F59E0B',
    gradient: 'linear-gradient(90deg, #FBBF24 0%, #D97706 100%)',
    glow: 'rgba(245, 158, 11, 0.65)',
    textColor: '#FDE68A',
  },
  {
    id: 'crimson-ruby',
    name: 'Ruby Crimson',
    hex: '#EF4444',
    gradient: 'linear-gradient(90deg, #F87171 0%, #DC2626 100%)',
    glow: 'rgba(239, 68, 68, 0.65)',
    textColor: '#FECACA',
  },
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    hex: '#8B5CF6',
    gradient: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)',
    glow: 'rgba(139, 92, 246, 0.65)',
    textColor: '#DDD6FE',
  },
  {
    id: 'hot-magenta',
    name: 'Hot Magenta',
    hex: '#EC4899',
    gradient: 'linear-gradient(90deg, #F472B6 0%, #DB2777 100%)',
    glow: 'rgba(236, 72, 153, 0.65)',
    textColor: '#FBCFE8',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    hex: '#06B6D4',
    gradient: 'linear-gradient(90deg, #22D3EE 0%, #0891B2 100%)',
    glow: 'rgba(6, 182, 212, 0.65)',
    textColor: '#A5F3FC',
  },
  {
    id: 'volt-lime',
    name: 'Volt Lime',
    hex: '#84CC16',
    gradient: 'linear-gradient(90deg, #A3E635 0%, #65A30D 100%)',
    glow: 'rgba(132, 204, 22, 0.65)',
    textColor: '#D9F99D',
  },
  {
    id: 'imperial-gold',
    name: 'Imperial Gold',
    hex: '#EAB308',
    gradient: 'linear-gradient(90deg, #FACC15 0%, #CA8A04 100%)',
    glow: 'rgba(234, 179, 8, 0.65)',
    textColor: '#FEF08A',
  },
];

const STORAGE_KEY = 'dataktif_player_seekbar_color';

export function getStoredSeekbarTheme(): SeekbarColorTheme {
  try {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const match = SEEKBAR_COLOR_THEMES.find((t) => t.id === savedId);
      if (match) return match;
    }
  } catch {}
  return SEEKBAR_COLOR_THEMES[0];
}

export function saveStoredSeekbarTheme(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {}
}

export function getNextSeekbarTheme(currentId: string): SeekbarColorTheme {
  const currentIndex = SEEKBAR_COLOR_THEMES.findIndex((t) => t.id === currentId);
  const nextIndex = (currentIndex + 1) % SEEKBAR_COLOR_THEMES.length;
  const nextTheme = SEEKBAR_COLOR_THEMES[nextIndex];
  saveStoredSeekbarTheme(nextTheme.id);
  return nextTheme;
}
