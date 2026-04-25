import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, CheckCircle, XCircle, Search, Filter, Eye, Loader2,
  Plus, Trash2, Settings, Sun, Moon, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useLocation } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { doctorApi, Consultation, TimeSlot } from '@/lib/api';

type ConsultationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusColors: Record<ConsultationStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

// ─── Time Slot Manager Sub-Component ─────────────────────────────────────────

const TimeSlotManager: React.FC = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'evening'>('morning');
  const [isAdding, setIsAdding] = useState(false);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const res = await doctorApi.getTimeSlots();
      setSlots(res.data.slots);
    } catch {
      toast({ title: 'Failed to load time slots', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleToggle = async (slot: TimeSlot) => {
    setIsTogglingId(slot._id);
    try {
      const res = await doctorApi.toggleTimeSlot(slot._id, !slot.isActive);
      setSlots(prev => prev.map(s => s._id === slot._id ? res.data.slot : s));
      toast({ title: `Slot ${!slot.isActive ? 'activated' : 'deactivated'}` });
    } catch {
      toast({ title: 'Failed to update slot', variant: 'destructive' });
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await doctorApi.deleteTimeSlot(id);
      setSlots(prev => prev.filter(s => s._id !== id));
      toast({ title: 'Time slot removed' });
    } catch {
      toast({ title: 'Failed to delete slot', variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAdd = async () => {
    if (!newTime.trim()) {
      toast({ title: 'Please enter a time (e.g. 9:30 AM)', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    try {
      const res = await doctorApi.addTimeSlot({ time: newTime.trim(), period: newPeriod });
      setSlots(prev => [...prev, res.data.slot]);
      setNewTime('');
      setShowAddForm(false);
      toast({ title: 'Time slot added' });
    } catch {
      toast({ title: 'Failed to add slot', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const morning = slots.filter(s => s.period === 'morning');
  const evening = slots.filter(s => s.period === 'evening');

  const SlotGroup = ({ title, icon, slots, accent }: {
    title: string; icon: React.ReactNode; slots: TimeSlot[]; accent: string;
  }) => (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-sm font-semibold ${accent}`}>
        {icon}{title}
      </div>
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-1">No slots</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map(slot => (
            <motion.div
              key={slot._id}
              layout
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                slot.isActive
                  ? 'border-secondary/40 bg-secondary/5 text-foreground'
                  : 'border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground opacity-60'
              }`}
            >
              <span className="font-medium">{slot.time}</span>
              <button
                onClick={() => handleToggle(slot)}
                disabled={isTogglingId === slot._id}
                className="transition-transform hover:scale-110"
                title={slot.isActive ? 'Deactivate' : 'Activate'}
              >
                {isTogglingId === slot._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : slot.isActive ? (
                  <ToggleRight className="h-5 w-5 text-secondary" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => handleDelete(slot._id)}
                disabled={isDeletingId === slot._id}
                className="text-muted-foreground/50 hover:text-destructive transition-colors"
                title="Delete slot"
              >
                {isDeletingId === slot._id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="card-elevated border-secondary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-5 w-5 text-secondary" />
          Manage Time Slots
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Toggle slots patients can book
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : (
          <>
            <SlotGroup
              title="Morning"
              icon={<Sun className="h-4 w-4" />}
              slots={morning}
              accent="text-amber-600"
            />
            <SlotGroup
              title="Evening"
              icon={<Moon className="h-4 w-4" />}
              slots={evening}
              accent="text-indigo-600"
            />

            {/* Add Slot Form */}
            <div className="border-t border-border pt-4">
              {!showAddForm ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Slot
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Time (e.g. 9:30 AM)</Label>
                    <Input
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      placeholder="9:30 AM"
                      className="w-32 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Period</Label>
                    <Select value={newPeriod} onValueChange={(v) => setNewPeriod(v as 'morning' | 'evening')}>
                      <SelectTrigger className="w-32 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="teal" onClick={handleAdd} disabled={isAdding} className="h-9">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="h-9">
                    Cancel
                  </Button>
                </motion.div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DoctorConsultationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [newStatus, setNewStatus] = useState<ConsultationStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      const isNewRequestPath = location.pathname.includes('new-requests');
      const response = isNewRequestPath
        ? await doctorApi.getNewConsultancyRequests()
        : await doctorApi.getConsultations();

      let bookingsArray: Consultation[] = [];
      if (Array.isArray(response.data)) {
        bookingsArray = response.data;
      } else if (response.data && Array.isArray((response.data as any).bookings)) {
        bookingsArray = (response.data as any).bookings;
      }
      setConsultations(bookingsArray);
    } catch {
      setConsultations([]);
      toast({ title: 'Fetch Error', description: 'Could not load requests.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchConsultations(); }, [location.pathname]);

  const filteredConsultations = consultations.filter((c) => {
    const search = searchQuery.toLowerCase();
    const name = ((c.patientName || (c as any).name || '')).toLowerCase();
    const type = (c.type || '').toLowerCase();
    return name.includes(search) || type.includes(search);
  });

  const handleUpdateStatus = async () => {
    if (!selectedConsultation || !newStatus) return;
    try {
      setIsSubmitting(true);
      const confirmedDateTime = selectedConsultation.requestedDateTime || new Date().toISOString();
      await doctorApi.updateConsultationStatus(selectedConsultation.id, newStatus, confirmedDateTime as any, notes.trim() || undefined);
      setConsultations(prev =>
        prev.map(c => c.id === selectedConsultation.id ? { ...c, status: newStatus, notes: notes.trim() || c.notes } : c)
      );
      toast({ title: 'Status Updated', description: `Changed to ${newStatus}.` });
      setSelectedConsultation(null);
      setNewStatus('');
      setNotes('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount   = consultations.filter(c => c.status === 'pending').length;
  const confirmedCount = consultations.filter(c => c.status === 'confirmed').length;
  const completedCount = consultations.filter(c => c.status === 'completed').length;
  const cancelledCount = consultations.filter(c => c.status === 'cancelled').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultations</h1>
          <p className="mt-1 text-muted-foreground">Manage consultation requests and bookings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSlotManager(v => !v)}
          className="gap-2 border-secondary/40 text-secondary hover:bg-secondary/10"
        >
          <Settings className="h-4 w-4" />
          Manage Slots
          {showSlotManager ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* New-request banner */}
      {location.pathname.includes('new-requests') && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 border-l-4 border-l-teal-500">
          <h3 className="text-teal-700 font-bold flex items-center gap-2">
            <span className="text-lg">🌟</span> New Patient Inquiries
          </h3>
          <p className="text-xs text-slate-600">
            These individuals haven't joined a program yet.
          </p>
        </div>
      )}

      {/* Time Slot Manager (collapsible) */}
      <AnimatePresence>
        {showSlotManager && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TimeSlotManager />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { count: pendingCount,   label: 'Pending',   icon: Clock,       bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { count: confirmedCount, label: 'Confirmed',  icon: Calendar,    bg: 'bg-blue-100',   color: 'text-blue-600' },
          { count: completedCount, label: 'Completed',  icon: CheckCircle, bg: 'bg-green-100',  color: 'text-green-600' },
          { count: cancelledCount, label: 'Cancelled',  icon: XCircle,     bg: 'gradient-phoenix text-primary-foreground', color: 'text-primary-foreground' },
        ].map(({ count, label, icon: Icon, bg, color }) => (
          <Card key={label} className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search consultations..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((consultation, index) => (
            <motion.div
              key={consultation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                        <User className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{consultation.patientName}</h3>
                          {!(consultation as any).patientId && (
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                              ✨ New Client
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{consultation.patientEmail}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {consultation.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {consultation.time}
                      </div>
                      <Badge variant="outline" className="text-xs">{consultation.type}</Badge>
                      <Badge className={statusColors[consultation.status as ConsultationStatus] || ''}>{consultation.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedConsultation(consultation);
                          setNewStatus(consultation.status as ConsultationStatus);
                          setNotes(consultation.notes || '');
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filteredConsultations.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No consultations found</p>
            </div>
          )}
        </div>
      )}

      {/* Update Status Modal */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Consultation Status</DialogTitle>
          </DialogHeader>
          {selectedConsultation && (
            <div className="space-y-4 pt-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-semibold text-foreground">{selectedConsultation.patientName}</p>
                <p className="text-sm text-muted-foreground">{selectedConsultation.date} at {selectedConsultation.time}</p>
                <p className="text-sm text-muted-foreground">{selectedConsultation.type}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as ConsultationStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add notes about this consultation..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedConsultation(null)}>Cancel</Button>
                <Button variant="teal" className="flex-1" onClick={handleUpdateStatus} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
