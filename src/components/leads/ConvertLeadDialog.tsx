import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { UserCheck, Users, Calendar as CalendarIcon, Clock, DollarSign, Target, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  full_name: string | null;
}

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  notes: string | null;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onConvert: (lead: Lead, assignedTo: string, contractDurationMonths?: number, startDate?: string, endDate?: string, contractAmount?: number, monthlyBudget?: number) => Promise<void> | void;
}

export function ConvertLeadDialog({ lead, open, onClose, onConvert }: ConvertLeadDialogProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<string>("");
  const [contractDuration, setContractDuration] = useState<string>("");
  const [useManualDates, setUseManualDates] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [contractAmount, setContractAmount] = useState<string>("");
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Ref guard to prevent double conversion
  const conversionInProgressRef = useRef(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      setTeamMembers(data || []);
    };

    if (open) {
      fetchTeamMembers();
      setSelectedGuardian("");
      setContractDuration("");
      setUseManualDates(false);
      setStartDate(new Date());
      setEndDate(undefined);
      setContractAmount("");
      setMonthlyBudget("");
    }
  }, [open]);

  // Auto-calculate end date when duration changes
  useEffect(() => {
    if (!useManualDates && contractDuration && startDate) {
      const months = parseInt(contractDuration);
      setEndDate(addMonths(startDate, months));
    }
  }, [contractDuration, startDate, useManualDates]);

  const handleConvert = async () => {
    if (!lead || !selectedGuardian) return;
    
    // Prevent double-clicks with ref guard
    if (conversionInProgressRef.current) return;
    conversionInProgressRef.current = true;
    setLoading(true);
    
    try {
      const durationMonths = contractDuration ? parseInt(contractDuration) : undefined;
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      const amount = contractAmount ? parseFloat(contractAmount) : undefined;
      const budget = monthlyBudget ? parseFloat(monthlyBudget) : undefined;
      
      await onConvert(lead, selectedGuardian, durationMonths, formattedStartDate, formattedEndDate, amount, budget);
      onClose();
    } finally {
      setLoading(false);
      conversionInProgressRef.current = false;
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-500" />
            Konwertuj na klienta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium">{lead.salon_name}</p>
            {lead.owner_name && (
              <p className="text-sm text-muted-foreground">{lead.owner_name}</p>
            )}
            {lead.city && (
              <p className="text-sm text-muted-foreground">{lead.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardian" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Opiekun klienta <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
              <SelectTrigger id="guardian">
                <SelectValue placeholder="Wybierz opiekuna..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || 'Bez nazwy'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Opiekun będzie odpowiedzialny za obsługę tego klienta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Okres współpracy
            </Label>
            <Select value={contractDuration} onValueChange={setContractDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Wybierz okres..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 miesiąc</SelectItem>
                <SelectItem value="3">3 miesiące</SelectItem>
                <SelectItem value="6">6 miesięcy</SelectItem>
                <SelectItem value="12">12 miesięcy</SelectItem>
                <SelectItem value="24">24 miesiące</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual date toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Ręczne daty</Label>
              <p className="text-xs text-muted-foreground">
                Ustaw własne daty rozpoczęcia i zakończenia
              </p>
            </div>
            <Switch
              checked={useManualDates}
              onCheckedChange={setUseManualDates}
            />
          </div>

          {/* Financial fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contractAmount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Kwota współpracy
              </Label>
              <Input
                id="contractAmount"
                type="number"
                placeholder="np. 3000"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Miesięczna kwota za usługi (PLN)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyBudget" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Budżet kampanii
              </Label>
              <Input
                id="monthlyBudget"
                type="number"
                placeholder="np. 2000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Budżet reklamowy klientki (PLN)
              </p>
            </div>
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Data rozpoczęcia
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "d MMM yyyy", { locale: pl }) : "Wybierz..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Data zakończenia
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!useManualDates && !contractDuration}
                  >
                    {endDate ? format(endDate, "d MMM yyyy", { locale: pl }) : "Wybierz..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && (
            <p className="text-xs text-muted-foreground text-center">
              Umowa: {format(startDate, "d MMMM yyyy", { locale: pl })} → {format(endDate, "d MMMM yyyy", { locale: pl })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={!selectedGuardian || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Konwertuję...' : 'Konwertuj'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}