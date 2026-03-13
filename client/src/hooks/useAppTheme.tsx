import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'dashboardTheme';

export function useAppTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark');

  useEffect(() => {
    const themeName = isDarkMode ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
    document.body.classList.toggle('app-theme-dark', isDarkMode);
    document.body.classList.toggle('app-theme-light', !isDarkMode);
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleTheme: () => setIsDarkMode((current) => !current),
  };
}
