import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, XCircle, MapPin, AlertCircle } from 'lucide-react';
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

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  type: string;
  date: string;
  time: string;
  location: string;
  status: BookingStatus;
  doctorName: string;
}

const mockBookings: Booking[] = [
  { id: '1', type: 'Progress Review', date: '2024-12-18', time: '10:00 AM', location: 'Virtual', status: 'upcoming', doctorName: 'Dr. Sarah Mitchell' },
  { id: '2', type: 'Follow-up Session', date: '2024-12-25', time: '2:00 PM', location: 'Virtual', status: 'upcoming', doctorName: 'Dr. Sarah Mitchell' },
  { id: '3', type: 'Initial Assessment', date: '2024-12-10', time: '11:00 AM', location: 'Virtual', status: 'completed', doctorName: 'Dr. Sarah Mitchell' },
  { id: '4', type: 'Consultation', date: '2024-12-05', time: '3:00 PM', location: 'Virtual', status: 'cancelled', doctorName: 'Dr. Sarah Mitchell' },
];

const statusColors: Record<BookingStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const PatientBookingsPage: React.FC = () => {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      toast({
        title: 'Booking Cancelled',
        description: `Your ${selectedBooking.type} on ${selectedBooking.date} has been cancelled.`,
      });
    }
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const upcomingBookings = mockBookings.filter((b) => b.status === 'upcoming');
  const pastBookings = mockBookings.filter((b) => b.status !== 'upcoming');

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
            {upcomingBookings.map((booking, index) => (
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
                        <h3 className="font-semibold text-foreground">{booking.type}</h3>
                        <p className="text-sm text-muted-foreground">{booking.doctorName}</p>
                      </div>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {booking.location}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelClick(booking)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Past Sessions</h2>
        <div className="space-y-3">
          {pastBookings.map((booking, index) => (
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
                      booking.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {booking.status === 'completed' ? (
                        <Calendar className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{booking.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[booking.status]}>
                    {booking.status}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {selectedBooking?.type} on {selectedBooking?.date} at {selectedBooking?.time}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmCancel}
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
