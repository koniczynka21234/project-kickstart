import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, Download, FileText, Users, Briefcase, Target, TrendingUp, 
  CheckCircle, DollarSign, Activity, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Loader2, Save, History, Upload, Filter,
  Megaphone, Hash
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, endOfDay, isLastDayOfMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { ReportHistory } from '@/components/report/ReportHistory';
import { MonthlyRevenueSection, RevenueStats } from '@/components/report/MonthlyRevenueSection';

interface MonthlyStats {
  // Leads
  newLeads: number;
  convertedLeads: number;
  lostLeads: number;
  activeLeads: number;
  totalLeads: number;
  conversionRate: number;
  leadSources: Record<string, number>;
  
  // Clients
  newClients: number;
  totalClients: number;
  totalMonthlyBudget: number;
  
  // Campaigns
  activeCampaigns: number;
  totalCampaigns: number;
  totalCampaignBudget: number;
  avgCampaignBudget: number;
  
  // Tasks
  tasksCreated: number;
  tasksCompleted: number;
  taskCompletionRate: number;
  
  // Documents
  reportsGenerated: number;
  invoicesGenerated: number;
  contractsGenerated: number;
  presentationsGenerated: number;
  totalDocuments: number;
  
  // Team
  teamMessages: number;
  activeUsers: number;
  
  // Pipeline
  pipelineValue: number;
  avgDaysToConversion: number;
  
  // Revenue (new)
  revenue?: RevenueStats;
}

interface SavedReport {
  id: string;
  month: number;
  year: number;
  data: MonthlyStats;
  created_at: string;
  report_number?: number;
}

const AVG_CLIENT_VALUE = 2000;

export default function MonthlyReport() {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Get next report number
  const getNextReportNumber = () => {
    const currentYearReports = savedReports.filter(r => r.year === year);
    return currentYearReports.length + 1;
  };

  useEffect(() => {
    fetchStats();
    fetchSavedReports();
    checkEndOfMonthReminder();
  }, [currentDate]);

  const checkEndOfMonthReminder = async () => {
    const today = new Date();
    const daysUntilEndOfMonth = endOfMonth(today).getDate() - today.getDate();
    
    // Show reminder 3 days before end of month
    if (daysUntilEndOfMonth <= 3 && daysUntilEndOfMonth >= 0) {
      // Check if report exists for current month
      const { data } = await supabase
        .from('monthly_reports')
        .select('id')
        .eq('month', today.getMonth() + 1)
        .eq('year', today.getFullYear())
        .maybeSingle();
      
      if (!data && user) {
        // Create reminder notification
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'report_reminder')
          .eq('reference_type', 'monthly_report')
          .eq('reference_id', `${today.getFullYear()}-${today.getMonth() + 1}`)
          .maybeSingle();
        
        if (!existingNotification) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'Czas na raport miesięczny',
            content: `Zbliża się koniec miesiąca. Wygeneruj raport za ${format(today, 'LLLL yyyy', { locale: pl })}.`,
            type: 'report_reminder',
            reference_type: 'monthly_report',
            reference_id: `${today.getFullYear()}-${today.getMonth() + 1}`,
          });
        }
      }
    }
  };

  const fetchSavedReports = async () => {
    const { data } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (data) {
      const reports = data.map((d, index, arr) => {
        // Calculate report number for display (based on year)
        const sameYearReports = arr.filter(r => r.year === d.year);
        const reportIndex = sameYearReports.findIndex(r => r.id === d.id);
        return {
          ...d,
          data: d.data as unknown as MonthlyStats,
          report_number: sameYearReports.length - reportIndex
        };
      });
      setSavedReports(reports);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const prevMonthStart = startOfMonth(subMonths(currentDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
    const today = new Date().toISOString().split('T')[0];

    try {
      const [leadsRes, clientsRes, tasksRes, docsRes, messagesRes, profilesRes, campaignsRes, paymentsRes, pendingFinalRes] = await Promise.all([
        supabase.from('leads').select('id, status, source, created_at, updated_at'),
        supabase.from('clients').select('id, monthly_budget, created_at'),
        supabase.from('tasks').select('id, status, created_at, completed_at'),
        supabase.from('documents').select('id, type, created_at, data'),
        supabase.from('team_messages').select('id, created_at'),
        supabase.from('profiles').select('id, last_seen_at'),
        supabase.from('campaigns').select('id, status, budget, created_at'),
        supabase.from('payments').select('id, amount, status, due_date, paid_date, notes, created_at'),
        supabase.from('pending_final_invoices').select('id, advance_amount, remaining_amount, total_amount, status, created_at'),
      ]);

      const leads = leadsRes.data || [];
      const clients = clientsRes.data || [];
      const tasks = tasksRes.data || [];
      const docs = docsRes.data || [];
      const messages = messagesRes.data || [];
      const profiles = profilesRes.data || [];
      const campaigns = campaignsRes.data || [];
      const payments = paymentsRes.data || [];
      const pendingFinal = pendingFinalRes.data || [];

      // Filter by month
      const monthLeads = leads.filter(l => new Date(l.created_at) >= monthStart && new Date(l.created_at) <= monthEnd);
      const monthClients = clients.filter(c => new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd);
      const monthTasks = tasks.filter(t => new Date(t.created_at) >= monthStart && new Date(t.created_at) <= monthEnd);
      const monthDocs = docs.filter(d => new Date(d.created_at) >= monthStart && new Date(d.created_at) <= monthEnd);
      const monthMessages = messages.filter(m => new Date(m.created_at) >= monthStart && new Date(m.created_at) <= monthEnd);
      const monthCampaigns = campaigns.filter(c => new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd);

      const convertedLeads = leads.filter(l => l.status === 'converted' && new Date(l.updated_at) >= monthStart && new Date(l.updated_at) <= monthEnd).length;
      const lostLeads = leads.filter(l => l.status === 'lost' && new Date(l.updated_at) >= monthStart && new Date(l.updated_at) <= monthEnd).length;
      const activeLeads = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;

      // Lead sources
      const leadSources: Record<string, number> = {};
      monthLeads.forEach(l => {
        const source = l.source || 'Nieznane';
        leadSources[source] = (leadSources[source] || 0) + 1;
      });

      // Tasks
      const completedTasks = monthTasks.filter(t => t.status === 'done').length;

      // Documents by type
      const reportsDocs = monthDocs.filter(d => d.type === 'report').length;
      const invoicesDocs = monthDocs.filter(d => d.type === 'invoice').length;
      const contractsDocs = monthDocs.filter(d => d.type === 'contract').length;
      const presentationsDocs = monthDocs.filter(d => d.type === 'presentation').length;

      // Active users (seen in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const activeUsers = profiles.filter(p => p.last_seen_at && new Date(p.last_seen_at) >= weekAgo).length;

      // Pipeline value
      const pipelineValue = activeLeads * (convertedLeads > 0 && monthLeads.length > 0 ? convertedLeads / monthLeads.length : 0.1) * AVG_CLIENT_VALUE;

      // Total monthly budget from clients
      const totalMonthlyBudget = clients.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);

      // Campaigns
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const totalCampaignBudget = monthCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const avgCampaignBudget = monthCampaigns.length > 0 ? totalCampaignBudget / monthCampaigns.length : 0;

      // ===== REVENUE STATS =====
      // Payments in current month (by paid_date or due_date for pending)
      const monthPayments = payments.filter(p => {
        if (p.status === 'paid' && p.paid_date) {
          return new Date(p.paid_date) >= monthStart && new Date(p.paid_date) <= monthEnd;
        }
        return new Date(p.due_date) >= monthStart && new Date(p.due_date) <= monthEnd;
      });

      const paidPayments = monthPayments.filter(p => p.status === 'paid');
      const pendingPayments = monthPayments.filter(p => p.status === 'pending' && p.due_date >= today);
      const overduePayments = monthPayments.filter(p => p.status === 'pending' && p.due_date < today);

      const paidAmount = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const overdueAmount = overduePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Advance invoices (by notes containing "zaliczka" or type)
      const advancePayments = monthPayments.filter(p => 
        p.notes?.toLowerCase().includes('zaliczka') || 
        p.notes?.toLowerCase().includes('advance')
      );
      const advanceAmount = advancePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Remaining from pending final invoices
      const monthPendingFinal = pendingFinal.filter(pf => 
        pf.status === 'pending' && 
        new Date(pf.created_at) >= monthStart && 
        new Date(pf.created_at) <= monthEnd
      );
      const remainingFromAdvances = pendingFinal
        .filter(pf => pf.status === 'pending')
        .reduce((sum, pf) => sum + Number(pf.remaining_amount || 0), 0);

      // Previous month payments for comparison
      const prevMonthPayments = payments.filter(p => {
        if (p.status === 'paid' && p.paid_date) {
          return new Date(p.paid_date) >= prevMonthStart && new Date(p.paid_date) <= prevMonthEnd;
        }
        return false;
      });
      const prevMonthPaid = prevMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const totalMonthRevenue = paidAmount;
      const monthOverMonthChange = totalMonthRevenue - prevMonthPaid;

      // Expected revenue = pipeline + pending payments
      const expectedRevenue = Math.round(pipelineValue) + pendingAmount + remainingFromAdvances;

      const revenueStats: RevenueStats = {
        paidInvoices: paidPayments.length,
        paidAmount,
        pendingInvoices: pendingPayments.length,
        pendingAmount,
        overdueInvoices: overduePayments.length,
        overdueAmount,
        advanceInvoices: advancePayments.length,
        advanceAmount,
        remainingFromAdvances,
        pipelineValue: Math.round(pipelineValue),
        expectedRevenue,
        prevMonthPaid,
        prevMonthRevenue: prevMonthPaid,
        monthOverMonthChange,
        totalMonthRevenue,
      };

      setStats({
        newLeads: monthLeads.length,
        convertedLeads,
        lostLeads,
        activeLeads,
        totalLeads: leads.length,
        conversionRate: monthLeads.length > 0 ? Math.round((convertedLeads / monthLeads.length) * 100) : 0,
        leadSources,
        newClients: monthClients.length,
        totalClients: clients.length,
        totalMonthlyBudget,
        activeCampaigns,
        totalCampaigns: monthCampaigns.length,
        totalCampaignBudget,
        avgCampaignBudget: Math.round(avgCampaignBudget),
        tasksCreated: monthTasks.length,
        tasksCompleted: completedTasks,
        taskCompletionRate: monthTasks.length > 0 ? Math.round((completedTasks / monthTasks.length) * 100) : 0,
        reportsGenerated: reportsDocs,
        invoicesGenerated: invoicesDocs,
        contractsGenerated: contractsDocs,
        presentationsGenerated: presentationsDocs,
        totalDocuments: monthDocs.length,
        teamMessages: monthMessages.length,
        activeUsers,
        pipelineValue: Math.round(pipelineValue),
        avgDaysToConversion: 14,
        revenue: revenueStats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Błąd podczas pobierania danych');
    }
    
    setLoading(false);
  };

  const handleSaveReport = async () => {
    if (!stats) return;

    const reportNumber = getNextReportNumber();

    // Check if report exists
    const { data: existing } = await supabase
      .from('monthly_reports')
      .select('id')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('monthly_reports')
        .update({ data: JSON.parse(JSON.stringify(stats)) })
        .eq('id', existing.id);
      
      if (error) {
        toast.error('Błąd podczas aktualizacji raportu');
        return;
      }
    } else {
      const { error } = await supabase.from('monthly_reports').insert([{
        month,
        year,
        data: JSON.parse(JSON.stringify(stats)),
        created_by: user?.id,
      }]);
      
      if (error) {
        toast.error('Błąd podczas zapisywania raportu');
        return;
      }
    }
    toast.success(`Raport #${reportNumber}/${year} zapisany`);
    fetchSavedReports();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setGenerating(true);

    try {
      // Create canvas from HTML with proper size
      const canvas = await htmlToImage.toCanvas(reportRef.current, {
        quality: 1,
        pixelRatio: 1.5,
        backgroundColor: '#0a0a0a',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // Ensure PDF pages have dark background (jsPDF defaults to white)
      const fillPageBackground = () => {
        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, pdfWidth, pdfPageHeight, 'F');
      };
      
      // Calculate scaled dimensions
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const scaledHeight = (imgHeightPx * pdfWidth) / imgWidthPx;
      
      // If content fits on one page
      if (scaledHeight <= pdfPageHeight) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        fillPageBackground();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, scaledHeight);
      } else {
        // Multi-page: slice canvas into page-sized chunks
        const pxPerMm = imgWidthPx / pdfWidth;
        const pageHeightPx = pdfPageHeight * pxPerMm;
        const totalPages = Math.ceil(imgHeightPx / pageHeightPx);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          fillPageBackground();
          
          // Create slice canvas for this page
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidthPx;
          const sliceHeight = Math.min(pageHeightPx, imgHeightPx - page * pageHeightPx);
          sliceCanvas.height = sliceHeight;
          
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            // Fill with background color first
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            // Draw the slice from the original canvas
            ctx.drawImage(
              canvas,
              0, page * pageHeightPx,           // source x, y
              imgWidthPx, sliceHeight,          // source width, height
              0, 0,                              // dest x, y
              imgWidthPx, sliceHeight           // dest width, height
            );
          }
          
          const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.85);
          const sliceScaledHeight = (sliceHeight / pxPerMm);
          pdf.addImage(sliceDataUrl, 'JPEG', 0, 0, pdfWidth, sliceScaledHeight);
        }
      }
      
      const reportNumber = savedReports.find(r => r.month === month && r.year === year)?.report_number || getNextReportNumber();
      const fileName = `Raport-${reportNumber}-${year}-${format(currentDate, 'MM')}.pdf`;
      
      pdf.save(fileName);
      toast.success('PDF wygenerowany');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Błąd podczas generowania PDF');
    }

    setGenerating(false);
  };

  const handleExportJSON = () => {
    if (!stats) return;
    
    const exportData = {
      month,
      year,
      generatedAt: new Date().toISOString(),
      stats
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const reportNumber = savedReports.find(r => r.month === month && r.year === year)?.report_number || getNextReportNumber();
    a.href = url;
    a.download = `Raport-${reportNumber}-${year}-${format(currentDate, 'MM')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dane wyeksportowane');
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.stats && data.month && data.year) {
          setCurrentDate(new Date(data.year, data.month - 1));
          setStats(data.stats);
          toast.success('Dane zaimportowane');
        } else {
          toast.error('Nieprawidłowy format pliku');
        }
      } catch (err) {
        toast.error('Błąd podczas importu');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSavedReport = (report: SavedReport) => {
    setCurrentDate(new Date(report.year, report.month - 1));
    setStats(report.data);
    setShowHistory(false);
  };

  const filteredReports = filterYear === 'all' 
    ? savedReports 
    : savedReports.filter(r => r.year === parseInt(filterYear));

  const availableYears = [...new Set(savedReports.map(r => r.year))].sort((a, b) => b - a);

  const currentReportNumber = savedReports.find(r => r.month === month && r.year === year)?.report_number;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-pink-400" />
              Podsumowanie miesiąca
              {currentReportNumber && (
                <span className="text-sm font-normal bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded">
                  #{currentReportNumber}/{year}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">Kompleksowy raport aktywności agencji</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="border-border/50">
              <History className="w-4 h-4 mr-2" />
              Historia
            </Button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImportJSON} 
              className="hidden" 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-border/50">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExportJSON} className="border-border/50">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleSaveReport} className="border-border/50">
              <Save className="w-4 h-4 mr-2" />
              Zapisz
            </Button>
            <Button onClick={handleExportPDF} disabled={generating} className="bg-primary hover:bg-primary/90">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Pobierz PDF
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">
                  {format(currentDate, 'LLLL yyyy', { locale: pl })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startOfMonth(currentDate), 'd')} - {format(endOfMonth(currentDate), 'd MMMM', { locale: pl })}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                disabled={currentDate >= new Date()}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Panel */}
        {showHistory && (
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Zapisane raporty
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Rok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      {availableYears.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak zapisanych raportów</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {filteredReports.map((report) => (
                    <Button
                      key={report.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedReport(report)}
                      className="justify-start border-border/50 flex-col items-start h-auto py-2"
                    >
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="w-3 h-3" />
                        {report.report_number}/{report.year}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(report.year, report.month - 1), 'MMM yyyy', { locale: pl })}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        {stats && (
          <div ref={reportRef} className="space-y-6 bg-background p-6 rounded-xl">
            {/* Report Header */}
            <div className="text-center border-b border-border/30 pb-4">
              <h2 className="text-lg font-bold text-foreground">
                Raport miesięczny {currentReportNumber ? `#${currentReportNumber}` : ''}
              </h2>
              <p className="text-muted-foreground">
                {format(currentDate, 'LLLL yyyy', { locale: pl })}
              </p>
            </div>

            {/* Revenue Section - NEW */}
            {stats.revenue && (
              <MonthlyRevenueSection 
                stats={stats.revenue} 
                monthLabel={format(currentDate, 'LLLL yyyy', { locale: pl })}
              />
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Nowe leady</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.newLeads}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Konwersje</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.convertedLeads}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-pink-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Konwersja</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.conversionRate}%</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Nowi klienci</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.newClients}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Megaphone className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Kampanie</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCampaigns}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-400 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Zadania</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.tasksCompleted}/{stats.tasksCreated}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Sections */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Leads Section */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Leady
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nowe (w miesiącu)</span>
                    <span className="font-medium text-blue-400">{stats.newLeads}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Skonwertowane</span>
                    <span className="font-medium text-green-400">{stats.convertedLeads}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stracone</span>
                    <span className="font-medium text-red-400">{stats.lostLeads}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktywne</span>
                    <span className="font-medium text-yellow-400">{stats.activeLeads}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/30">
                    <span className="text-sm font-medium text-foreground">Łącznie (wszystkie)</span>
                    <span className="font-bold text-foreground">{stats.totalLeads}</span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">Wskaźnik konwersji</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-pink-400 h-2 rounded-full"
                          style={{ width: `${stats.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-pink-400">{stats.conversionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaigns Section */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-400" />
                    Kampanie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nowe kampanie</span>
                    <span className="font-medium text-purple-400">{stats.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktywne kampanie</span>
                    <span className="font-medium text-green-400">{stats.activeCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budżet łączny</span>
                    <span className="font-medium text-emerald-400">{stats.totalCampaignBudget.toLocaleString()} zł</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Śr. budżet kampanii</span>
                    <span className="font-medium text-blue-400">{stats.avgCampaignBudget.toLocaleString()} zł</span>
                  </div>
                </CardContent>
              </Card>

              {/* Clients Section */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    Klienci
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nowi klienci</span>
                    <span className="font-medium text-emerald-400">{stats.newClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Łącznie klientów</span>
                    <span className="font-medium text-foreground">{stats.totalClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budżet miesięczny</span>
                    <span className="font-medium text-green-400">{stats.totalMonthlyBudget.toLocaleString()} zł</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Section */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    Zadania
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Utworzone</span>
                    <span className="font-medium text-foreground">{stats.tasksCreated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ukończone</span>
                    <span className="font-medium text-green-400">{stats.tasksCompleted}</span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">Wskaźnik ukończenia</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                          style={{ width: `${stats.taskCompletionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-orange-400">{stats.taskCompletionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Dokumenty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Raporty</span>
                    <span className="font-medium text-pink-400">{stats.reportsGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Faktury</span>
                    <span className="font-medium text-green-400">{stats.invoicesGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Umowy</span>
                    <span className="font-medium text-blue-400">{stats.contractsGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prezentacje</span>
                    <span className="font-medium text-orange-400">{stats.presentationsGenerated}</span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Łącznie</span>
                      <span className="font-bold text-foreground">{stats.totalDocuments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline & Revenue */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Pipeline i przychody
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wartość pipeline</span>
                    <span className="font-medium text-green-400">{stats.pipelineValue.toLocaleString()} zł</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budżet klientów</span>
                    <span className="font-medium text-emerald-400">{stats.totalMonthlyBudget.toLocaleString()} zł</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budżet kampanii</span>
                    <span className="font-medium text-purple-400">{stats.totalCampaignBudget.toLocaleString()} zł</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Śr. czas konwersji</span>
                    <span className="font-medium text-foreground">{stats.avgDaysToConversion} dni</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Sources */}
            {Object.keys(stats.leadSources).length > 0 && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Źródła leadów
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(stats.leadSources).map(([source, count]) => (
                      <div key={source} className="text-center p-3 rounded-lg bg-secondary/30">
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Activity */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-pink-400" />
                  Aktywność zespołu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-foreground">{stats.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Aktywni użytkownicy</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-foreground">{stats.teamMessages}</p>
                    <p className="text-xs text-muted-foreground">Wiadomości</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-foreground">{stats.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">Ukończone zadania</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-foreground">{stats.totalDocuments}</p>
                    <p className="text-xs text-muted-foreground">Dokumenty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
