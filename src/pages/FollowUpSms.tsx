import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";

import { SmsFollowUpToday } from "@/components/templates/SmsFollowUpToday";
import { SmsTemplatesManager } from "@/components/templates/SmsTemplatesManager";

export default function FollowUpSms() {
  const [activeTab, setActiveTab] = useState<"sms-today" | "sms-templates">("sms-today");

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Follow-up SMS</h1>
          <p className="text-muted-foreground">Wysyłka SMS follow-up + zarządzanie szablonami</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="sms-today" className="gap-2">
              <Calendar className="w-4 h-4" />
              SMS do wysłania
            </TabsTrigger>
            <TabsTrigger value="sms-templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Szablony SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sms-today" className="mt-6">
            <SmsFollowUpToday />
          </TabsContent>

          <TabsContent value="sms-templates" className="mt-6">
            <SmsTemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
