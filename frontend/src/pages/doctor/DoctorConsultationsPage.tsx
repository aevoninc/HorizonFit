import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, Search, Filter, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { doctorApi, Consultation } from '@/lib/api';

type ConsultationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusColors: Record<ConsultationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const DoctorConsultationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [newStatus, setNewStatus] = useState<ConsultationStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      const response = await doctorApi.getConsultations();
      setConsultations(response.data);
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load consultations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConsultations = consultations.filter(
    (consultation) =>
      consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = async () => {
    if (!selectedConsultation || !newStatus) return;

    try {
      setIsSubmitting(true);
      await doctorApi.updateConsultationStatus(selectedConsultation.id, newStatus, notes.trim() || undefined);
      
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === selectedConsultation.id ? { ...c, status: newStatus, notes: notes.trim() || c.notes } : c
        )
      );

      toast({
        title: 'Status Updated',
        description: `Consultation status changed to ${newStatus}.`,
      });
      
      setSelectedConsultation(null);
      setNewStatus('');
      setNotes('');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = consultations.filter((c) => c.status === 'pending').length;
  const confirmedCount = consultations.filter((c) => c.status === 'confirmed').length;
  const completedCount = consultations.filter((c) => c.status === 'completed').length;
  const cancelledCount = consultations.filter((c) => c.status === 'cancelled').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultations</h1>
        <p className="mt-1 text-muted-foreground">Manage consultation requests and bookings</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-phoenix">
                <XCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cancelledCount}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search consultations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {/* Consultations List */}
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
                          <h3 className="font-semibold text-foreground">{consultation.patientName}</h3>
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
                        <Badge variant="outline" className="text-xs">
                          {consultation.type}
                        </Badge>
                        <Badge className={statusColors[consultation.status]}>
                          {consultation.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultation(consultation);
                            setNewStatus(consultation.status);
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
        </>
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
                <p className="text-sm text-muted-foreground">
                  {selectedConsultation.date} at {selectedConsultation.time}
                </p>
                <p className="text-sm text-muted-foreground">{selectedConsultation.type}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ConsultationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedConsultation(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="teal" 
                  className="flex-1" 
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                >
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
