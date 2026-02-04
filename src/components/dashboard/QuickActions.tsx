import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, UserPlus, FileText, CheckSquare, CalendarPlus,
  Receipt, FileSignature, Presentation, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}

function QuickActionButton({ icon: Icon, label, color, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
        "bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border",
        "hover:scale-105 hover:shadow-lg group"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        color
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createQuickTask = async () => {
    if (!taskTitle.trim()) return;
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      title: taskTitle,
      description: taskDesc || null,
      created_by: user.id,
      status: "todo",
      priority: "medium",
      is_agency_task: true,
    });

    if (error) {
      toast({ title: "Błąd", description: "Nie udało się utworzyć zadania", variant: "destructive" });
    } else {
      toast({ title: "Zadanie utworzone", description: taskTitle });
      setTaskTitle("");
      setTaskDesc("");
      setShowTaskDialog(false);
    }
    setIsSubmitting(false);
  };

  const createQuickLead = async () => {
    if (!leadName.trim()) return;
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("leads").insert({
      salon_name: leadName,
      phone: leadPhone || null,
      created_by: user.id,
      status: "new",
    });

    if (error) {
      toast({ title: "Błąd", description: "Nie udało się utworzyć leada", variant: "destructive" });
    } else {
      toast({ title: "Lead dodany", description: leadName });
      setLeadName("");
      setLeadPhone("");
      setShowLeadDialog(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
          <DialogTrigger asChild>
            <div>
              <QuickActionButton
                icon={UserPlus}
                label="Nowy lead"
                color="bg-purple-500/20 text-purple-400"
                onClick={() => setShowLeadDialog(true)}
              />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Szybkie dodanie leada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nazwa salonu</Label>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="np. Beauty Studio"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefon (opcjonalnie)</Label>
                <Input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="+48..."
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={createQuickLead} 
                disabled={!leadName.trim() || isSubmitting}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogTrigger asChild>
            <div>
              <QuickActionButton
                icon={CheckSquare}
                label="Nowe zadanie"
                color="bg-orange-500/20 text-orange-400"
                onClick={() => setShowTaskDialog(true)}
              />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Szybkie zadanie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Tytuł zadania</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Co trzeba zrobić?"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Opis (opcjonalnie)</Label>
                <Textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Dodatkowe szczegóły..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={createQuickTask} 
                disabled={!taskTitle.trim() || isSubmitting}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Utwórz zadanie
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <QuickActionButton
          icon={FileText}
          label="Raport"
          color="bg-pink-500/20 text-pink-400"
          onClick={() => navigate("/report-generator")}
        />

        <QuickActionButton
          icon={CalendarPlus}
          label="Kalendarz"
          color="bg-blue-500/20 text-blue-400"
          onClick={() => navigate("/calendar")}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <QuickActionButton
          icon={Receipt}
          label="Faktura"
          color="bg-emerald-500/20 text-emerald-400"
          onClick={() => navigate("/invoice-generator")}
        />
        <QuickActionButton
          icon={FileSignature}
          label="Umowa"
          color="bg-blue-500/20 text-blue-400"
          onClick={() => navigate("/contract-generator")}
        />
        <QuickActionButton
          icon={Presentation}
          label="Prezentacja"
          color="bg-purple-500/20 text-purple-400"
          onClick={() => navigate("/presentation-generator")}
        />
      </div>
    </div>
  );
}
