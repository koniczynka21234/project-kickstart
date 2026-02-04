import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Bell, Volume2, Moon, Sun, Monitor } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const soundOptions = [
  { value: 'default', label: 'Domyślny' },
  { value: 'chime', label: 'Dzwonek' },
  { value: 'pop', label: 'Pop' },
  { value: 'ding', label: 'Ding' },
];

export default function Settings() {
  const { settings, updateSettings } = useAppSettings();

  const playTestSound = () => {
    if (!settings.notificationSound) {
      toast.error('Dźwięki są wyłączone');
      return;
    }
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
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
      
      toast.success('Test dźwięku');
    } catch (e) {
      console.error('Could not play sound:', e);
      toast.error('Nie można odtworzyć dźwięku');
    }
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
            Ustawienia
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Dostosuj aplikację do swoich preferencji</p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Notification Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-pink-400" />
                Powiadomienia
              </CardTitle>
              <CardDescription>Ustawienia dźwięków i powiadomień</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dźwięki powiadomień</Label>
                  <p className="text-xs text-muted-foreground">Odtwarzaj dźwięk przy nowych powiadomieniach</p>
                </div>
                <Switch
                  checked={settings.notificationSound}
                  onCheckedChange={(checked) => updateSettings({ notificationSound: checked })}
                />
              </div>

              {settings.notificationSound && (
                <>
                  <div className="space-y-3">
                    <Label>Rodzaj dźwięku</Label>
                    <Select
                      value={settings.soundType}
                      onValueChange={(value) => updateSettings({ soundType: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Głośność</Label>
                      <span className="text-sm text-muted-foreground">{settings.notificationVolume}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <Slider
                        value={[settings.notificationVolume]}
                        onValueChange={([value]) => updateSettings({ notificationVolume: value })}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button variant="outline" onClick={playTestSound} className="w-full">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Testuj dźwięk
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5 text-pink-400" />
                Wygląd
              </CardTitle>
              <CardDescription>Personalizuj wygląd interfejsu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Motyw</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'dark' | 'light' | 'system') => updateSettings({ theme: value })}
                >
                    <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Ciemny
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Jasny
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Systemowy
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aktualny motyw: {settings.theme === 'dark' ? 'ciemny' : settings.theme === 'light' ? 'jasny' : 'systemowy'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tryb kompaktowy</Label>
                  <p className="text-xs text-muted-foreground">Zmniejsz odstępy między elementami</p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wskaźniki statusu</Label>
                  <p className="text-xs text-muted-foreground">Pokaż statusy online/offline</p>
                </div>
                <Switch
                  checked={settings.showStatusIndicators}
                  onCheckedChange={(checked) => updateSettings({ showStatusIndicators: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Behavior Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Zachowanie</CardTitle>
              <CardDescription>Dostosuj działanie aplikacji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Domyślny widok leadów</Label>
                <Select
                  value={settings.defaultLeadView}
                  onValueChange={(value: 'list' | 'kanban') => updateSettings({ defaultLeadView: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Automatyczne odświeżanie</Label>
                  <span className="text-sm text-muted-foreground">{settings.autoRefreshInterval}s</span>
                </div>
                <Slider
                  value={[settings.autoRefreshInterval]}
                  onValueChange={([value]) => updateSettings({ autoRefreshInterval: value })}
                  min={10}
                  max={120}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Częstotliwość odświeżania danych w tle
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
