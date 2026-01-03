import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'purple' | 'orange' | 'blue' | 'green' | 'rose';

export interface ThemeConfig {
  mode: ThemeMode;
  color: ThemeColor;
}

interface ThemeContextType {
  theme: ThemeConfig;
  mode: ThemeMode;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'theme-preference';

const defaultTheme: ThemeConfig = { mode: 'light', color: 'purple' };

export const themeColors: { id: ThemeColor; label: string; primary: string }[] = [
  { id: 'purple', label: 'Purple', primary: '#8B5CF6' },
  { id: 'orange', label: 'Orange', primary: '#F97316' },
  { id: 'blue', label: 'Blue', primary: '#3B82F6' },
  { id: 'green', label: 'Green', primary: '#10B981' },
  { id: 'rose', label: 'Rose', primary: '#F43F5E' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ThemeConfig;
        } catch {
          // Fall through to default
        }
      }
      // Check system preference for mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return { ...defaultTheme, mode: 'dark' };
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove('light', 'dark');
    themeColors.forEach((c) => root.classList.remove(`theme-${c.id}`));

    // Add current theme classes
    root.classList.add(theme.mode);
    root.classList.add(`theme-${theme.color}`);

    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  const toggleMode = () => {
    setThemeState((prev) => ({ ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' }));
  };

  const setMode = (mode: ThemeMode) => {
    setThemeState((prev) => ({ ...prev, mode }));
  };

  const setColor = (color: ThemeColor) => {
    setThemeState((prev) => ({ ...prev, color }));
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      mode: theme.mode,
      color: theme.color,
      setMode,
      setColor,
      toggleMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
