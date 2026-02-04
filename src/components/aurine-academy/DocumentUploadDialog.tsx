import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

const DOCUMENT_TYPES = [
  { value: "invoice", label: "Faktura" },
  { value: "contract", label: "Umowa" },
  { value: "report", label: "Raport" },
  { value: "terms", label: "Regulamin" },
  { value: "other", label: "Inny dokument" },
];

export function DocumentUploadDialog({ open, onClose, clientId }: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedType, setSelectedType] = useState("report");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Brak pliku");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;

      // Upload pliku
      const { error: uploadError } = await supabase.storage
        .from("client_documents")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Pobierz URL
      const { data: { publicUrl } } = supabase.storage
        .from("client_documents")
        .getPublicUrl(fileName);

      // Zapisz w bazie
      const { error: insertError } = await supabase.from("client_app_documents").insert({
        client_id: clientId,
        title: customTitle || selectedFile.name,
        type: selectedType,
        file_url: publicUrl,
        storage_path: fileName,
        file_size: selectedFile.size,
        created_by: user?.id,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      toast.success("Dokument został dodany");
      handleClose();
    },
    onError: () => {
      toast.error("Błąd podczas przesyłania dokumentu");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!customTitle) {
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCustomTitle("");
    setSelectedType("report");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj dokument do Aurine Academy</DialogTitle>
          <DialogDescription>
            Dokument będzie widoczny dla klientki w jej aplikacji mobilnej
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="doc-type">Typ dokumentu</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="doc-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doc-title">Nazwa dokumentu</Label>
            <Input
              id="doc-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="np. Faktura styczeń 2024"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Plik</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            
            {selectedFile ? (
              <div className="mt-1 p-3 rounded-lg border bg-muted/50 flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Zmień
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full mt-1 h-20 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm">Kliknij, aby wybrać plik</span>
                </div>
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || !customTitle || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Dodaj dokument
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
