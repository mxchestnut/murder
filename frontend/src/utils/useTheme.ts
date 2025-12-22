import { useEffect, useState } from 'react';

export interface ThemeSettings {
  mode: 'light' | 'dark';
  accentColor: string;
}

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1', hover: '#4f46e5' },
  { name: 'Blue', value: '#3b82f6', hover: '#2563eb' },
  { name: 'Purple', value: '#a855f7', hover: '#9333ea' },
  { name: 'Pink', value: '#ec4899', hover: '#db2777' },
  { name: 'Red', value: '#ef4444', hover: '#dc2626' },
  { name: 'Orange', value: '#f97316', hover: '#ea580c' },
  { name: 'Amber', value: '#f59e0b', hover: '#d97706' },
  { name: 'Green', value: '#10b981', hover: '#059669' },
  { name: 'Teal', value: '#14b8a6', hover: '#0d9488' },
  { name: 'Cyan', value: '#06b6d4', hover: '#0891b2' },
];

export function useTheme() {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    const savedAccent = localStorage.getItem('theme-accent') || '#6366f1';
    return {
      mode: savedMode || 'light',
      accentColor: savedAccent,
    };
  });

  useEffect(() => {
    // Apply theme mode
    document.documentElement.setAttribute('data-theme', theme.mode);
    localStorage.setItem('theme-mode', theme.mode);

    // Apply accent color
    const root = document.documentElement;
    const preset = PRESET_COLORS.find(c => c.value === theme.accentColor);
    
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-hover', preset?.hover || adjustColorBrightness(theme.accentColor, -20));
    
    // Create light version for backgrounds
    const rgb = hexToRgb(theme.accentColor);
    if (rgb) {
      const alpha = theme.mode === 'dark' ? 0.15 : 0.1;
      root.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
    }
    
    localStorage.setItem('theme-accent', theme.accentColor);
  }, [theme]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const setAccentColor = (color: string) => {
    setTheme(prev => ({ ...prev, accentColor: color }));
  };

  const toggleTheme = () => {
    setTheme(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  return {
    theme,
    setThemeMode,
    setAccentColor,
    toggleTheme,
    presetColors: PRESET_COLORS,
  };
}

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}
