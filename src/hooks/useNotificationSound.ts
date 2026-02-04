import { useCallback, useEffect, useState } from 'react';

interface NotificationSettings {
  notificationSound: boolean;
  notificationVolume: number;
  soundType: string;
}

const defaultSettings: NotificationSettings = {
  notificationSound: true,
  notificationVolume: 50,
  soundType: 'default',
};

export function useNotificationSound() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          notificationSound: parsed.notificationSound ?? true,
          notificationVolume: parsed.notificationVolume ?? 50,
          soundType: parsed.soundType ?? 'default',
        });
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = (e: CustomEvent<NotificationSettings>) => {
      setSettings({
        notificationSound: e.detail.notificationSound ?? true,
        notificationVolume: e.detail.notificationVolume ?? 50,
        soundType: e.detail.soundType ?? 'default',
      });
    };

    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);
    window.addEventListener('storage', loadSettings);

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
      window.removeEventListener('storage', loadSettings);
    };
  }, []);

  const playSound = useCallback(() => {
    if (!settings.notificationSound) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different sound types
      const frequencies: Record<string, number> = {
        default: 800,
        chime: 1200,
        pop: 600,
        ding: 1000,
      };
      
      const volume = settings.notificationVolume / 100;
      oscillator.frequency.value = frequencies[settings.soundType] || 800;
      oscillator.type = settings.soundType === 'chime' ? 'sine' : settings.soundType === 'pop' ? 'triangle' : 'square';
      
      gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Could not play notification sound:', e);
    }
  }, [settings]);

  return { playSound, settings };
}
