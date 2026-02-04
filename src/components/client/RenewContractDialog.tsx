import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CalendarPlus, RefreshCw } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface RenewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentEndDate: Date | null;
  onSuccess: () => void;
}

export function RenewContractDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentEndDate,
  onSuccess,
}: RenewContractDialogProps) {
  const [saving, setSaving] = useState(false);
  const [durationMonths, setDurationMonths] = useState('1');
  const [newStartDate, setNewStartDate] = useState(() => {
    // Default: day after current end date, or today if no end date
    if (currentEndDate) {
      const nextDay = new Date(currentEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return format(nextDay, 'yyyy-MM-dd');
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const calculateNewEndDate = () => {
    if (!newStartDate) return null;
    const start = new Date(newStartDate);
    return addMonths(start, parseInt(durationMonths));
  };

  const newEndDate = calculateNewEndDate();

  const handleRenew = async () => {
    if (!newStartDate) {
      toast.error('Wybierz datę rozpoczęcia');
      return;
    }

    setSaving(true);
    try {
      const endDateStr = newEndDate ? format(newEndDate, 'yyyy-MM-dd') : null;

      const { error } = await supabase
        .from('clients')
        .update({
          contract_start_date: newStartDate,
          contract_end_date: endDateStr,
          contract_duration_months: parseInt(durationMonths),
          status: 'active', // Reactivate client if was churned
        })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Umowa została przedłużona');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error renewing contract:', error);
      toast.error('Błąd podczas przedłużania umowy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Przedłuż umowę
          </DialogTitle>
          <DialogDescription>
            Przedłużasz umowę dla: <span className="font-medium text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentEndDate && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Obecna data zakończenia</p>
              <p className="font-medium">{format(currentEndDate, 'd MMMM yyyy')}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="start-date">Nowa data rozpoczęcia</Label>
            <Input
              id="start-date"
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Okres trwania</Label>
            <Select value={durationMonths} onValueChange={setDurationMonths}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 miesiąc</SelectItem>
                <SelectItem value="2">2 miesiące</SelectItem>
                <SelectItem value="3">3 miesiące</SelectItem>
                <SelectItem value="6">6 miesięcy</SelectItem>
                <SelectItem value="12">12 miesięcy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newEndDate && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground mb-1">Nowa data zakończenia</p>
              <p className="font-medium text-green-400">{format(newEndDate, 'd MMMM yyyy')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Anuluj
          </Button>
          <Button onClick={handleRenew} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CalendarPlus className="w-4 h-4 mr-2" />
            )}
            Przedłuż umowę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
