import { useState, useEffect } from 'react';

export interface ReportHistoryItem {
  id: string;
  clientName: string;
  city: string;
  period: string;
  createdAt: string;
  data: Record<string, string>;
}

const STORAGE_KEY = 'report-history';
const MAX_HISTORY = 20;

export const useReportHistory = () => {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const saveReport = (data: Record<string, string>) => {
    const newItem: ReportHistoryItem = {
      id: Date.now().toString(),
      clientName: data.clientName || 'Bez nazwy',
      city: data.city || '',
      period: data.period || '',
      createdAt: new Date().toISOString(),
      data,
    };

    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteReport = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, saveReport, deleteReport, clearHistory };
};
