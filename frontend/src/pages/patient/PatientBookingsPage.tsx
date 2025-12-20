import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, XCircle, AlertCircle, CheckCircle, Loader2, RefreshCw, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { patientApi, PatientBooking } from '@/lib/api';
import { format } from 'date-fns';

type BookingStatus = PatientBooking['status'];

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  'Payment Successful': { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="h-4 w-4" /> },
  'Cancelled': { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="h-4 w-4" /> },
  'Pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="h-4 w-4" /> },
  'Confirmed': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle className="h-4 w-4" /> },
  'Completed': { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="h-4 w-4" /> },
  'Refunded': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <RefreshCw className="h-4 w-4" /> },
};

export const PatientBookingsPage: React.FC = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

const fetchBookings = async () => {
  setLoading(true);
  try {
    const response = await patientApi.getBookings();
    
    // 1. Get the array from the response object
    const rawBookings = response.data?.bookings || response.data || [];

    // 2. Map MongoDB's _id to id so 'selectedBooking.id' works
    const formattedBookings = rawBookings.map((b: any) => ({
      ...b,
      id: b._id || b.id, // This ensures 'id' is populated for the frontend
    }));

    setBookings(formattedBookings);
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to load bookings.',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBookings();
  }, []);

const handleCancelClick = (booking: PatientBooking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    // 1. Safety check for ID
    if (!selectedBooking?.id) {
      toast({
        title: "Error",
        description: "Booking ID not found. Please refresh.",
        variant: "destructive"
      });
      setCancelDialogOpen(false);
      return;
    }

    setCancelling(true);
    try {
      const response = await patientApi.cancelBooking(selectedBooking.id);
      
      // Update local state to show 'Cancelled' immediately
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: 'Cancelled' as const, refundId: response.data.refundId }
            : b
        )
      );

      toast({
        title: 'Booking Cancelled',
        description: response.data.refundId
          ? `Refund initiated. ID: ${response.data.refundId}`
          : 'Your booking has been cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.response?.data?.message || 'Failed to cancel booking.',
        variant: 'destructive',
      });
    } finally {
      // 2. Always reset states to stop loading spinners and close dialogs
      setCancelling(false);
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return {
        date: format(date, 'MMM dd, yyyy'),
        time: format(date, 'hh:mm a'),
      };
    } catch {
      return { date: dateTime, time: '' };
    }
  };

const upcomingBookings = bookings.filter((b) => 
  ['Pending', 'Confirmed', 'Payment Successful'].includes(b.status)
);
  const pastBookings = bookings.filter((b) => !['Pending', 'Confirmed'].includes(b.status));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">Manage your consultation appointments</p>
      </div>

      {/* Upcoming Bookings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Upcoming Sessions</h2>
        {upcomingBookings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
{upcomingBookings.map((booking, index) => {
  const { date, time } = formatDateTime(booking.requestedDateTime);
  const config = statusConfig[booking.status] || { color: 'bg-gray-100', icon: null };

  // --- Logic for Refund Window ---
  const paymentDate = new Date(booking.createdAt || Date.now()).getTime();
  const currentTime = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const isEligibleForRefund = (currentTime - paymentDate) < twentyFourHours;
  const hoursRemaining = Math.max(0, 24 - (currentTime - paymentDate) / (1000 * 60 * 60)).toFixed(1);

  return (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="card-elevated border-l-4 border-l-secondary">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                {booking.type ? booking.type : "General Consultation"}
              </h3>
              <p className="text-sm text-muted-foreground">Dr. Jaburral</p>
            </div>
            <Badge className={config.color}>
              <span className="mr-1">{config.icon}</span>
              {booking.status}
            </Badge>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {date}
            </div>
            {time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {time}
              </div>
            )}
          </div>

          {booking.patientQuery && (
            <p className="mb-4 text-sm text-muted-foreground italic">
              "{booking.patientQuery}"
            </p>
          )}

          {/* Refund Logic UI */}
          {isEligibleForRefund ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={() => handleCancelClick(booking)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel & Refund
              </Button>
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Refund window ends in {hoursRemaining} hours
              </p>
            </div>
          ) : (
            <div className="p-2 bg-muted/50 rounded-md text-center border border-dashed">
              <p className="text-xs text-muted-foreground font-medium">Refund window closed</p>
              <p className="text-[10px] text-muted-foreground">(24h post-payment limit reached)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
})}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No upcoming bookings</p>
              <p className="text-sm text-muted-foreground">Book a consultation to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Past Sessions</h2>
          <div className="space-y-3">
            {pastBookings.map((booking, index) => {
              const { date, time } = formatDateTime(booking.requestedDateTime);
              const config = statusConfig[booking.status];
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`card-elevated ${booking.status === 'cancelled' ? 'opacity-70' : ''}`}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          booking.status === 'Completed' ? 'bg-green-100' : 
                          booking.status === 'Refunded' ? 'bg-purple-100' : 'bg-red-100'
                        }`}>
                          {booking.status === 'Completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : booking.status === 'Refunded' ? (
                            <RefreshCw className="h-5 w-5 text-purple-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{booking.type ? booking.type : "General Consultation"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {date} {time && `at ${time}`}
                          </p>
                          {booking.refundId && (
                            <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                              <CreditCard className="h-3 w-3" />
                              Refund ID: {booking.refundId}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={config.color}>
                        {booking.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {selectedBooking?.type}? 
              You will receive a refund which can be tracked using the refund ID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
