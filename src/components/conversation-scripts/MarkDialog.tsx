import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScriptStatus } from "@/hooks/useConversationScriptsDB";

interface MarkDialogProps {
  open: boolean;
  onClose: () => void;
  markStatus: ScriptStatus | null;
  setMarkStatus: (s: ScriptStatus | null) => void;
  markDate: string;
  setMarkDate: (d: string) => void;
  markSentDate: string;
  setMarkSentDate: (d: string) => void;
  markUserId: string | null;
  setMarkUserId: (id: string | null) => void;
  markOutcome: string;
  setMarkOutcome: (o: string) => void;
  markNotes: string;
  setMarkNotes: (n: string) => void;
  teamMembers: { id: string; name: string }[];
  onSave: () => void;
}

export function MarkDialog({
  open, onClose, markStatus, setMarkStatus, markDate, setMarkDate,
  markSentDate, setMarkSentDate,
  markUserId, setMarkUserId, markOutcome, setMarkOutcome,
  markNotes, setMarkNotes, teamMembers, onSave,
}: MarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Oznacz rozmowę</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <p className="text-xs text-muted-foreground">
            Uzupełnij wynik rozmowy, datę, osobę oraz notatki.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data wysłania audytu</Label>
              <Input type="date" value={markSentDate} onChange={(e) => setMarkSentDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data rozmowy</Label>
              <Input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status rozmowy</Label>
              <Select value={markStatus ?? undefined} onValueChange={(v) => setMarkStatus(v as ScriptStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zrealizowany">Nie sprzedane</SelectItem>
                  <SelectItem value="sprzedany">Sprzedane</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Osoba przeprowadzająca</Label>
            <Select value={markUserId || "auto"} onValueChange={(v) => setMarkUserId(v === "auto" ? null : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wybierz osobę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatycznie (wygenerował)</SelectItem>
                {teamMembers.map(tm => (
                  <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Wynik rozmowy</Label>
            <Select value={markOutcome || undefined} onValueChange={setMarkOutcome}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wybierz wynik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="podjeto_wspolprace">Podjęto współpracę</SelectItem>
                <SelectItem value="zastanowienie">Do zastanowienia</SelectItem>
                <SelectItem value="umowiony_followup">Umówiony follow-up</SelectItem>
                <SelectItem value="prosba_o_oferte">Prośba o ofertę</SelectItem>
                <SelectItem value="brak_kontaktu">Brak kontaktu</SelectItem>
                <SelectItem value="odrzucone">Odrzucone</SelectItem>
                <SelectItem value="brak_zainteresowania">Brak zainteresowania</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notatki</Label>
            <Textarea placeholder="Notatki z rozmowy..." value={markNotes} onChange={(e) => setMarkNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Anuluj</Button>
            <Button type="submit">Zapisz</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
