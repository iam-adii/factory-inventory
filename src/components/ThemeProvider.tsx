
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

import { settingsService } from "@/lib/services/settingsService";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [loading, setLoading] = useState(true);

  // Load theme from Supabase on initial render
  useEffect(() => {
    const loadThemeFromSupabase = async () => {
      try {
        const { theme: savedTheme, error } = await settingsService.getTheme();
        if (!error && savedTheme) {
          setTheme(savedTheme as Theme);
        }
      } catch (error) {
        console.error("Error loading theme from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    loadThemeFromSupabase();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Save to localStorage for immediate access
      localStorage.setItem(storageKey, newTheme);
      
      // Save to Supabase for persistence across devices
      settingsService.setTheme(newTheme).catch(error => {
        console.error("Error saving theme to Supabase:", error);
      });
      
      setTheme(newTheme);
    },
  };

  // Show nothing until theme is loaded from Supabase
  if (loading) return null;

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
