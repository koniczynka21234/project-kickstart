import { History, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportHistoryItem } from "@/hooks/useReportHistory";

interface ReportHistoryProps {
  history: ReportHistoryItem[];
  onSelect: (data: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const ReportHistory = ({ history, onSelect, onDelete, onClear }: ReportHistoryProps) => {
  if (history.length === 0) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-white">Historia raportów</h3>
        </div>
        <p className="text-zinc-500 text-sm">Brak zapisanych raportów. Wygeneruj pierwszy raport, aby pojawił się tutaj.</p>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-white">Historia raportów</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Wyczyść
        </Button>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-pink-500/30 transition-colors group"
            >
              <button
                onClick={() => onSelect(item.data)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-pink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {item.clientName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {item.city && `${item.city} • `}{item.period} • {formatDate(item.createdAt)}
                  </p>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
