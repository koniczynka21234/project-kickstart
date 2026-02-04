import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Loader2,
  Target,
  Users,
  FileText,
  Copy,
  Image as ImageIcon,
  Wand2,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Zap,
  Calendar,
  DollarSign,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  salon_name: string;
  city: string | null;
  industry: string | null;
  monthly_budget: number | null;
}

interface CampaignData {
  strategy?: {
    objective: string;
    targetAudience: string;
    budget_allocation: string;
    timeline: string;
  };
  adSets?: Array<{
    name: string;
    audience: string;
    placement: string;
  }>;
  posts?: Array<{
    type: string;
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
    imageIdea: string;
  }>;
  copyVariants?: Array<{
    style: string;
    text: string;
  }>;
  recommendations?: string[];
  rawContent?: string;
}

const objectives = [
  'Generowanie leadów',
  'Rezerwacje online',
  'Świadomość marki',
  'Ruch na stronie',
  'Wiadomości',
];

const industries = [
  'Fryzjerstwo',
  'Kosmetyka',
  'Paznokcie',
  'Spa & Wellness',
  'Barber',
  'Makijaż',
  'Brwi i rzęsy',
];

const styleLabels: Record<string, string> = {
  emotional: 'Emocjonalny',
  benefit: 'Korzyści',
  urgency: 'Pilność',
  social_proof: 'Dowód społeczny',
};

export default function CampaignGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  
  const [formData, setFormData] = useState({
    clientName: '',
    industry: '',
    city: '',
    budget: '',
    objective: '',
    targetAudience: '',
    services: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, salon_name, city, industry, monthly_budget')
      .order('salon_name');
    setClients(data || []);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.salon_name,
        city: client.city || '',
        industry: client.industry || '',
        budget: client.monthly_budget?.toString() || '',
      }));
    }
  };

  const generateCampaign = async () => {
    if (!formData.clientName || !formData.industry) {
      toast.error('Wypełnij nazwę klienta i branżę');
      return;
    }

    setLoading(true);
    setCampaign(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign', {
        body: formData,
      });

      if (error) throw error;

      if (data?.campaign) {
        setCampaign(data.campaign);
        toast.success('Kampania wygenerowana!');
      }
    } catch (err: any) {
      console.error('Error generating campaign:', err);
      toast.error(err.message || 'Błąd generowania kampanii');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano do schowka');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Generator Kampanii AI</h1>
                <p className="text-zinc-400 text-sm">Twórz strategie, posty i teksty reklamowe z AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-90px)]">
          {/* Left Panel - Form */}
          <div className="w-[420px] border-r border-zinc-800/50 bg-zinc-900/20 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Client Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    Dane klienta
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-400 text-xs">Wybierz klienta</Label>
                      <Select value={selectedClient} onValueChange={handleClientSelect}>
                        <SelectTrigger className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white hover:border-pink-500/30 focus:border-pink-500 transition-colors">
                          <SelectValue placeholder="Wybierz z listy..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id} className="text-white hover:bg-zinc-800">
                              {client.salon_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-zinc-400 text-xs">Nazwa salonu *</Label>
                      <Input
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder="np. Beauty Studio"
                        className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Branża *</Label>
                        <Select 
                          value={formData.industry} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}
                        >
                          <SelectTrigger className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white hover:border-pink-500/30">
                            <SelectValue placeholder="Wybierz" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {industries.map(ind => (
                              <SelectItem key={ind} value={ind} className="text-white hover:bg-zinc-800">{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Miasto</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="np. Warszawa"
                          className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-800/50" />

                {/* Campaign Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    Ustawienia kampanii
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Budżet miesięczny</Label>
                        <div className="relative mt-1.5">
                          <Input
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                            placeholder="2000"
                            className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">PLN</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Cel kampanii</Label>
                        <Select 
                          value={formData.objective} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, objective: v }))}
                        >
                          <SelectTrigger className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white hover:border-pink-500/30">
                            <SelectValue placeholder="Wybierz cel" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {objectives.map(obj => (
                              <SelectItem key={obj} value={obj} className="text-white hover:bg-zinc-800">{obj}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-zinc-400 text-xs">Grupa docelowa</Label>
                      <Textarea
                        value={formData.targetAudience}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        placeholder="np. Kobiety 25-45 lat, zainteresowane pielęgnacją..."
                        className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-zinc-400 text-xs">Główne usługi</Label>
                      <Textarea
                        value={formData.services}
                        onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                        placeholder="np. Manicure, pedicure, stylizacja paznokci..."
                        className="mt-1.5 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Generate Button */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30">
              <Button 
                onClick={generateCampaign} 
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-medium shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/30"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generuj kampanię AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 flex flex-col bg-zinc-950">
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping" />
                </div>
                <p className="text-zinc-400 mt-6 text-lg">AI generuje strategię kampanii...</p>
                <p className="text-zinc-600 text-sm mt-2">To może zająć do 30 sekund</p>
              </div>
            )}

            {!loading && !campaign && (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-zinc-700" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Wygeneruj kampanię AI</h3>
                <p className="text-zinc-500 text-center max-w-md">
                  Wypełnij formularz po lewej stronie i kliknij "Generuj kampanię", 
                  aby otrzymać kompletną strategię z postami i tekstami.
                </p>
                <div className="flex items-center gap-6 mt-8">
                  {[
                    { icon: Target, label: 'Strategia' },
                    { icon: Users, label: 'Zestawy reklam' },
                    { icon: ImageIcon, label: 'Posty' },
                    { icon: FileText, label: 'Teksty' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-zinc-600" />
                      </div>
                      <span className="text-xs text-zinc-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign && !campaign.rawContent && (
              <Tabs defaultValue="strategy" className="flex-1 flex flex-col">
                <div className="border-b border-zinc-800/50 px-6">
                  <TabsList className="h-14 bg-transparent gap-1">
                    <TabsTrigger 
                      value="strategy" 
                      className="data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-400 text-zinc-400 hover:text-white px-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Strategia
                    </TabsTrigger>
                    <TabsTrigger 
                      value="adsets" 
                      className="data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-400 text-zinc-400 hover:text-white px-4"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Zestawy
                    </TabsTrigger>
                    <TabsTrigger 
                      value="posts" 
                      className="data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-400 text-zinc-400 hover:text-white px-4"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Posty
                    </TabsTrigger>
                    <TabsTrigger 
                      value="copy" 
                      className="data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-400 text-zinc-400 hover:text-white px-4"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Teksty
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <TabsContent value="strategy" className="mt-0 space-y-6">
                      {campaign.strategy && (
                        <div className="grid gap-4">
                          {[
                            { label: 'Cel kampanii', value: campaign.strategy.objective, icon: Target },
                            { label: 'Grupa docelowa', value: campaign.strategy.targetAudience, icon: Users },
                            { label: 'Podział budżetu', value: campaign.strategy.budget_allocation, icon: DollarSign },
                            { label: 'Harmonogram', value: campaign.strategy.timeline, icon: Calendar },
                          ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                              <div className="flex items-center gap-2 text-pink-400 text-xs font-medium mb-2">
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                              </div>
                              <p className="text-white">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {campaign.recommendations && campaign.recommendations.length > 0 && (
                        <div className="p-5 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20">
                          <div className="flex items-center gap-2 text-pink-400 font-medium mb-4">
                            <Lightbulb className="w-4 h-4" />
                            Rekomendacje AI
                          </div>
                          <ul className="space-y-3">
                            {campaign.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-zinc-300 text-sm">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="adsets" className="mt-0 space-y-4">
                      {campaign.adSets?.map((adSet, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-pink-400" />
                            </div>
                            <h3 className="font-medium text-white">{adSet.name}</h3>
                          </div>
                          <div className="grid gap-3">
                            <div>
                              <span className="text-zinc-500 text-xs">Odbiorcy</span>
                              <p className="text-zinc-300 text-sm mt-1">{adSet.audience}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-xs">Umiejscowienie</span>
                              <p className="text-zinc-300 text-sm mt-1">{adSet.placement}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="posts" className="mt-0 space-y-4">
                      {campaign.posts?.map((post, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-pink-400" />
                              </div>
                              <h3 className="font-medium text-white">Post {idx + 1}</h3>
                            </div>
                            <Badge variant="outline" className="text-pink-400 border-pink-500/30">{post.type}</Badge>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <span className="text-zinc-500 text-xs">Nagłówek</span>
                              <p className="text-white font-medium mt-1">{post.headline}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-xs">Tekst główny</span>
                              <p className="text-zinc-300 text-sm mt-1">{post.primaryText}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <div className="flex-1 p-3 rounded-lg bg-zinc-800/50">
                                <span className="text-zinc-500 text-xs">CTA</span>
                                <p className="text-pink-400 text-sm font-medium mt-1">{post.cta}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`${post.headline}\n\n${post.primaryText}`)}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                              >
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Kopiuj
                              </Button>
                            </div>
                            {post.imageIdea && (
                              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                                <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                                  <ImageIcon className="w-3 h-3" />
                                  Pomysł na grafikę
                                </span>
                                <p className="text-zinc-400 text-sm mt-1">{post.imageIdea}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="copy" className="mt-0 space-y-4">
                      {campaign.copyVariants?.map((variant, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/30">
                              {styleLabels[variant.style] || variant.style}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.text)}
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Kopiuj
                            </Button>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">{variant.text}</p>
                        </div>
                      ))}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            )}

            {campaign?.rawContent && (
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-white">Wygenerowana treść</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(campaign.rawContent || '')}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Kopiuj całość
                      </Button>
                    </div>
                    <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {campaign.rawContent}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
