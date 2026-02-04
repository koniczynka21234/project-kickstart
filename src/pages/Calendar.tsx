import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  MessageSquare, 
  Users, 
  CheckCircle, 
  Star, 
  Loader2, 
  Trash2,
  Clock,
  MapPin,
  ArrowRight,
  Zap
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO, startOfWeek, addDays, isSameMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  lead_id: string | null;
  client_id: string | null;
  color: string;
  created_by: string;
}

interface Lead {
  id: string;
  salon_name: string;
  next_follow_up_date: string | null;
  city: string | null;
}

interface Client {
  id: string;
  salon_name: string;
}

const eventTypes = [
  { value: 'follow_up', label: 'Follow-up', icon: MessageSquare, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { value: 'meeting', label: 'Spotkanie', icon: Users, color: 'bg-purple-500', textColor: 'text-purple-400' },
  { value: 'call', label: 'Rozmowa', icon: Phone, color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'task', label: 'Zadanie', icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-400' },
  { value: 'custom', label: 'Własne', icon: Star, color: 'bg-pink-500', textColor: 'text-pink-400' },
];

const colorOptions = [
  { value: 'pink', label: 'Różowy', class: 'bg-pink-500' },
  { value: 'blue', label: 'Niebieski', class: 'bg-blue-500' },
  { value: 'green', label: 'Zielony', class: 'bg-green-500' },
  { value: 'orange', label: 'Pomarańczowy', class: 'bg-orange-500' },
  { value: 'purple', label: 'Fioletowy', class: 'bg-purple-500' },
];

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'custom',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    all_day: false,
    lead_id: 'none',
    client_id: 'none',
    color: 'pink',
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const [eventsRes, leadsRes, clientsRes] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .gte('start_date', monthStart.toISOString())
        .lte('start_date', monthEnd.toISOString())
        .order('start_date', { ascending: true }),
      supabase
        .from('leads')
        .select('id, salon_name, next_follow_up_date, city')
        .not('status', 'in', '("converted","lost")'),
      supabase
        .from('clients')
        .select('id, salon_name'),
    ]);

    if (eventsRes.data) {
      const leadFollowUps: CalendarEvent[] = (leadsRes.data || [])
        .filter(lead => lead.next_follow_up_date)
        .map(lead => ({
          id: `lead-${lead.id}`,
          title: `Follow-up: ${lead.salon_name}`,
          description: lead.city || null,
          event_type: 'follow_up',
          start_date: lead.next_follow_up_date!,
          end_date: null,
          all_day: true,
          lead_id: lead.id,
          client_id: null,
          color: 'orange',
          created_by: '',
        }));

      setEvents([...eventsRes.data, ...leadFollowUps]);
    }
    if (leadsRes.data) setLeads(leadsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_date || !user) {
      toast.error('Wypełnij wymagane pola (tytuł i data)');
      return;
    }

    setSubmitting(true);

    const startDateTime = newEvent.all_day 
      ? `${newEvent.start_date}T00:00:00`
      : `${newEvent.start_date}T${newEvent.start_time}:00`;
    
    const endDateTime = newEvent.all_day
      ? null
      : `${newEvent.start_date}T${newEvent.end_time}:00`;

    const eventData = {
      title: newEvent.title,
      description: newEvent.description || null,
      event_type: newEvent.event_type,
      start_date: startDateTime,
      end_date: endDateTime,
      all_day: newEvent.all_day,
      lead_id: newEvent.lead_id !== 'none' ? newEvent.lead_id : null,
      client_id: newEvent.client_id !== 'none' ? newEvent.client_id : null,
      color: newEvent.color,
      created_by: user.id,
    };

    const { error } = await supabase.from('calendar_events').insert(eventData);

    if (error) {
      console.error('Calendar event error:', error);
      toast.error('Błąd podczas dodawania wydarzenia');
    } else {
      toast.success('Wydarzenie dodane');
      setIsAddDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'custom',
        start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        all_day: false,
        lead_id: 'none',
        client_id: 'none',
        color: 'pink',
      });
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (eventId.startsWith('lead-')) {
      toast.error('Nie można usunąć automatycznych follow-upów');
      return;
    }

    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (error) {
      toast.error('Błąd podczas usuwania');
    } else {
      toast.success('Wydarzenie usunięte');
      fetchData();
    }
  };

  // Get days for calendar grid (including days from prev/next months)
  const monthStart = startOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(calendarStart, i));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[4];
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewEvent(prev => ({
      ...prev,
      start_date: format(day, 'yyyy-MM-dd'),
    }));
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const todayEvents = getEventsForDay(new Date());

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
      <div className="mobile-page py-4 space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Kalendarz
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Planuj spotkania i zarządzaj czasem</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nowe wydarzenie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nowe wydarzenie</DialogTitle>
              </DialogHeader>
              <DialogHeader>
                <DialogTitle>Nowe wydarzenie</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Tytuł wydarzenia *"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Textarea
                  placeholder="Opis (opcjonalnie)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, event_type: type.value })}
                      className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                        newEvent.event_type === type.value
                          ? `border-primary bg-primary/10 ${type.textColor}`
                          : 'border-border/50 hover:border-primary/30 text-muted-foreground'
                      }`}
                    >
                      <type.icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  ))}
                </div>
                <Input
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newEvent.all_day}
                    onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
                    className="rounded"
                  />
                  Cały dzień
                </label>
                {!newEvent.all_day && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                )}
                <Select value={newEvent.lead_id} onValueChange={(v) => setNewEvent({ ...newEvent, lead_id: v, client_id: 'none' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Powiąż z leadem (opcjonalnie)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak leada</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>{lead.salon_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newEvent.client_id} onValueChange={(v) => setNewEvent({ ...newEvent, client_id: v, lead_id: 'none' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Powiąż z klientem (opcjonalnie)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak klienta</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.salon_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.class} transition-all ${newEvent.color === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
                <Button onClick={handleAddEvent} className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Dodaj wydarzenie
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's summary */}
        {todayEvents.length > 0 && (
          <Card className="border-0 bg-gradient-to-r from-pink-500/10 to-rose-500/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Dzisiaj masz {todayEvents.length} wydarzeń</p>
                  <p className="text-xs text-muted-foreground">
                    {todayEvents.slice(0, 3).map(e => e.title).join(', ')}
                    {todayEvents.length > 3 && ` i ${todayEvents.length - 3} więcej`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-hidden">
          {/* Calendar Grid */}
          <Card className="lg:col-span-3 border-border/50 bg-card/80 overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-xl font-semibold capitalize">
                  {format(currentMonth, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map((day) => (
                  <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all ${
                        isToday(day)
                          ? 'bg-pink-500/20 border-pink-500/50'
                          : isSelected
                          ? 'bg-secondary border-primary/50'
                          : !isCurrentMonth
                          ? 'border-transparent opacity-40'
                          : 'border-border/30 hover:border-border/60 hover:bg-secondary/30'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-pink-400' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => {
                          const typeInfo = getEventTypeInfo(event.event_type);
                          return (
                            <div
                              key={event.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate ${typeInfo.color} text-white`}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground text-center">
                            +{dayEvents.length - 2} więcej
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    {selectedDate 
                      ? format(selectedDate, 'd MMMM', { locale: pl })
                      : 'Wybierz dzień'
                    }
                  </span>
                  {selectedDate && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setNewEvent(prev => ({
                          ...prev,
                          start_date: format(selectedDate, 'yyyy-MM-dd'),
                        }));
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {selectedDayEvents.length === 0 ? (
                  <div className="p-6 text-center">
                    <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Brak wydarzeń</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        if (selectedDate) {
                          setNewEvent(prev => ({
                            ...prev,
                            start_date: format(selectedDate, 'yyyy-MM-dd'),
                          }));
                        }
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Dodaj
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {selectedDayEvents.map((event) => {
                      const typeInfo = getEventTypeInfo(event.event_type);
                      const Icon = typeInfo.icon;
                      const isAutoFollowUp = event.id.startsWith('lead-');
                      
                      return (
                        <div 
                          key={event.id}
                          className="p-4 hover:bg-secondary/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                              {!event.all_day && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {format(parseISO(event.start_date), 'HH:mm')}
                                  {event.end_date && ` - ${format(parseISO(event.end_date), 'HH:mm')}`}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.description}
                                </p>
                              )}
                            </div>
                            {!isAutoFollowUp && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>
                          {event.lead_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 text-xs h-7"
                              onClick={() => navigate(`/leads/${event.lead_id}`)}
                            >
                              Zobacz lead
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Type Legend */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Typy wydarzeń</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {eventTypes.map((type) => (
                    <div key={type.value} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded ${type.color}`} />
                      <span className="text-muted-foreground">{type.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
