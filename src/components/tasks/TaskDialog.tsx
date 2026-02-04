import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface Employee {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface Client {
  id: string;
  salon_name: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
  is_agency_task: boolean;
  client_id: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  employees: Employee[];
  clients: Client[];
  isSzef: boolean;
  currentUserId?: string;
}

const UNASSIGNED_VALUE = 'unassigned';

export function TaskDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  employees,
  clients,
  isSzef,
  currentUserId,
}: TaskDialogProps) {
  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.salon_name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Edytuj zadanie' : 'Nowe zadanie'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tytuł zadania *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Wpisz tytuł zadania..."
              className="form-input-elegant"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Opis</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Opcjonalny opis zadania..."
              className="form-input-elegant min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="form-input-elegant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Do zrobienia</SelectItem>
                  <SelectItem value="in_progress">W trakcie</SelectItem>
                  <SelectItem value="completed">Ukończone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priorytet</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger className="form-input-elegant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Termin wykonania</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="form-input-elegant"
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Klient (opcjonalnie)</Label>
            <SearchableSelect
              options={clientOptions}
              value={formData.client_id}
              onValueChange={(v) => setFormData({ ...formData, client_id: v || '' })}
              placeholder="Wybierz klienta..."
              searchPlaceholder="Szukaj klienta..."
              emptyMessage="Nie znaleziono klienta"
            />
          </div>

          {/* Assigned to */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Przypisz do</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
            >
              <SelectTrigger className="form-input-elegant">
                <SelectValue placeholder="Wybierz osobę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>Nieprzypisane</SelectItem>
                {isSzef ? (
                  employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email || 'Nieznany'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={currentUserId || ''}>
                    {employees.find(e => e.id === currentUserId)?.full_name || 
                     employees.find(e => e.id === currentUserId)?.email || 
                     'Ja'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Agency task checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
            <Checkbox
              id="is_agency_task"
              checked={formData.is_agency_task}
              onCheckedChange={(checked) => setFormData({ ...formData, is_agency_task: Boolean(checked) })}
            />
            <div>
              <Label htmlFor="is_agency_task" className="cursor-pointer font-medium">
                Zadanie agencyjne
              </Label>
              <p className="text-xs text-muted-foreground">Widoczne dla wszystkich członków zespołu</p>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            {isEditing ? 'Zapisz zmiany' : 'Utwórz zadanie'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
