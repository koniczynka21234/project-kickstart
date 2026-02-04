import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  notificationSound: boolean;
  notificationVolume: number;
  soundType: string;
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  showStatusIndicators: boolean;
  autoRefreshInterval: number;
  defaultLeadView: 'list' | 'kanban';
}

const defaultSettings: AppSettings = {
  notificationSound: true,
  notificationVolume: 50,
  soundType: 'default',
  theme: 'dark',
  compactMode: false,
  showStatusIndicators: true,
  autoRefreshInterval: 30,
  defaultLeadView: 'list',
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setLoaded(true);
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    if (!loaded) return;
    
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('dark', 'light');
    
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(settings.theme);
    }

    // Apply compact mode
    root.classList.toggle('compact', settings.compactMode);
  }, [settings.theme, settings.compactMode, loaded]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  // Listen for settings changes from other tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'app_settings' && e.newValue) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(e.newValue) });
        } catch (err) {
          console.error('Failed to parse settings:', err);
        }
      }
    };

    const handleSettingsEvent = (e: CustomEvent<AppSettings>) => {
      setSettings(e.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('settingsChanged', handleSettingsEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('settingsChanged', handleSettingsEvent as EventListener);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app_settings', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updated }));
      return updated;
    });
  }, []);

  return { settings, updateSettings, loaded };
}
