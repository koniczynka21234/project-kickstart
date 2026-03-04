export type ConversationScriptStatus = "ready" | "draft";
export interface ConversationScript {
  id: string;
  clientName: string;
  scheduledDate: string;
  status: ConversationScriptStatus;
}

export const conversationScripts: ConversationScript[] = [
  {
    id: "cs-1",
    clientName: "Studio Urody Bella",
    scheduledDate: "2026-02-27T09:00:00",
    status: "ready",
  },
  {
    id: "cs-2",
    clientName: "Beauty Point",
    scheduledDate: "2026-03-01T11:30:00",
    status: "draft",
  },
  {
    id: "cs-3",
    clientName: "Lash & Brow",
    scheduledDate: "2026-02-20T14:00:00",
    status: "ready",
  },
];
