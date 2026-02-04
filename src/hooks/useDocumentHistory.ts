import { useState, useEffect, useCallback } from "react";

export type DocumentType = "report" | "invoice" | "contract" | "presentation" | "welcomepack" | "audit";

export interface DocumentHistoryItem {
  id: string;
  type: DocumentType;
  title: string;
  subtitle: string;
  data: Record<string, string>;
  thumbnail?: string;
  createdAt: string;
}

const STORAGE_KEY = "aurine_document_history";
const MAX_ITEMS = 50;

// Helper function to get current history from localStorage
const getStoredHistory = (): DocumentHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error("Error parsing stored history");
  }
  return [];
};

// Helper function to save to localStorage
const saveToStorage = (items: DocumentHistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
};

export const useDocumentHistory = () => {
  const [history, setHistory] = useState<DocumentHistoryItem[]>(() => getStoredHistory());

  // Re-sync from localStorage when component mounts (for navigation between pages)
  useEffect(() => {
    const stored = getStoredHistory();
    setHistory(stored);
  }, []);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setHistory(getStoredHistory());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveDocument = useCallback((
    type: DocumentHistoryItem["type"],
    title: string,
    subtitle: string,
    data: Record<string, string>,
    thumbnail?: string
  ): string => {
    const newItem: DocumentHistoryItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      subtitle,
      data,
      thumbnail,
      createdAt: new Date().toISOString(),
    };

    // Read directly from localStorage to get the latest state
    const currentHistory = getStoredHistory();
    const updated = [newItem, ...currentHistory].slice(0, MAX_ITEMS);
    
    // Save to localStorage first
    saveToStorage(updated);
    
    // Then update state
    setHistory(updated);
    
    return newItem.id;
  }, []);

  const getDocumentById = useCallback((id: string) => {
    const currentHistory = getStoredHistory();
    return currentHistory.find(item => item.id === id);
  }, []);

  const getDocumentsByType = useCallback((type: DocumentHistoryItem["type"]) => {
    const currentHistory = getStoredHistory();
    return currentHistory.filter(item => item.type === type);
  }, []);

  const deleteDocument = useCallback((id: string) => {
    const currentHistory = getStoredHistory();
    const updated = currentHistory.filter(item => item.id !== id);
    saveToStorage(updated);
    setHistory(updated);
  }, []);

  const updateThumbnail = useCallback((id: string, thumbnail: string) => {
    const currentHistory = getStoredHistory();
    const updated = currentHistory.map(item => 
      item.id === id ? { ...item, thumbnail } : item
    );
    saveToStorage(updated);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback((type?: DocumentHistoryItem["type"]) => {
    if (type) {
      const currentHistory = getStoredHistory();
      const updated = currentHistory.filter(item => item.type !== type);
      saveToStorage(updated);
      setHistory(updated);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    }
  }, []);

  const getRecentDocuments = useCallback((limit: number = 10) => {
    return history.slice(0, limit);
  }, [history]);

  const getStats = useCallback(() => {
    return {
      total: history.length,
      reports: history.filter(i => i.type === "report").length,
      invoices: history.filter(i => i.type === "invoice").length,
      contracts: history.filter(i => i.type === "contract").length,
      presentations: history.filter(i => i.type === "presentation").length,
      audits: history.filter(i => i.type === "audit").length,
    };
  }, [history]);

  const exportHistory = useCallback(() => {
    const currentHistory = getStoredHistory();
    return JSON.stringify(currentHistory, null, 2);
  }, []);

  const importHistory = useCallback((jsonData: string): boolean => {
    try {
      const imported = JSON.parse(jsonData) as DocumentHistoryItem[];
      if (!Array.isArray(imported)) return false;
      
      // Validate structure
      const valid = imported.every(item => 
        item.id && item.type && item.title && item.data && item.createdAt
      );
      if (!valid) return false;
      
      // Merge with existing, avoiding duplicates by id
      const currentHistory = getStoredHistory();
      const existingIds = new Set(currentHistory.map(item => item.id));
      const newItems = imported.filter(item => !existingIds.has(item.id));
      const merged = [...newItems, ...currentHistory].slice(0, MAX_ITEMS);
      
      saveToStorage(merged);
      setHistory(merged);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    history,
    saveDocument,
    getDocumentById,
    getDocumentsByType,
    deleteDocument,
    updateThumbnail,
    clearHistory,
    getRecentDocuments,
    getStats,
    exportHistory,
    importHistory,
  };
};
