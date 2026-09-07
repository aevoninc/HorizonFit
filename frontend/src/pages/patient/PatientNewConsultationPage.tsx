import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CreditCard,
  Check,
  Loader2,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  CheckCircle,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay, RazorpayResponse } from "@/hooks/useRazorpay";
import { patientApi, publicApi, TimeSlot } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const consultationSchema = z.object({
  patientQuery: z.string().max(500).optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const CONSULTATION_PRICE = 1;

const DEFAULT_SLOTS: TimeSlot[] = [
  { _id: "def-1", time: "9:30 AM", period: "morning", isActive: true, sortOrder: 1 },
  { _id: "def-2", time: "10:30 AM", period: "morning", isActive: true, sortOrder: 2 },
  { _id: "def-3", time: "11:30 AM", period: "morning", isActive: true, sortOrder: 3 },
  { _id: "def-4", time: "6:00 PM", period: "evening", isActive: true, sortOrder: 4 },
  { _id: "def-5", time: "7:00 PM", period: "evening", isActive: true, sortOrder: 5 },
  { _id: "def-6", time: "8:00 PM", period: "evening", isActive: true, sortOrder: 6 },
];

function todayDateString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function buildISODateTime(dateStr: string, timeStr: string): string {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const d = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return d.toISOString();
}

export const PatientNewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedEmail, setBookedEmail] = useState("");

  // Slot state
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
  });

  // Fetch slots
  useEffect(() => {
    const loadSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await publicApi.getTimeSlots();
        if (res.data.slots && res.data.slots.length > 0) {
          setAvailableSlots(res.data.slots);
        } else {
          setAvailableSlots(DEFAULT_SLOTS);
        }
      } catch (error) {
        console.error("Failed to load dynamic slots, using defaults:", error);
        setAvailableSlots(DEFAULT_SLOTS);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookedSlots = async () => {
      setBookingLoading(true);
      try {
        const res = await publicApi.getBookedSlots(selectedDate);
        // Backend returns ISO strings, we'll compare ISO strings
        setBookedTimes(res.data.bookedTimes);
      } catch (error) {
        console.error("Failed to fetch booked slots:", error);
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate]);

  const isToday = selectedDate === todayDateString();

  const getSlotState = (slot: TimeSlot) => {
    if (!selectedDate) return "available";

    const [tStr, period] = slot.time.split(" ");
    let [targetHours, targetMinutes] = tStr.split(":").map(Number);
    if (period === "PM" && targetHours !== 12) targetHours += 12;
    if (period === "AM" && targetHours === 12) targetHours = 0;

    const slotISO = `${selectedDate}T${String(targetHours).padStart(2, "0")}:${String(targetMinutes).padStart(2, "0")}:00`;
    const slotDate = new Date(slotISO);
    const slotTime = slotDate.getTime();

    // 1. Check if it's already booked (Rule 2)
    const isBooked = bookedTimes.some((bt) => {
      const bDate = new Date(bt);
      if (isNaN(bDate.getTime())) return false;

      const matchLocal =
        bDate.getFullYear() === slotDate.getFullYear() &&
        bDate.getMonth() === slotDate.getMonth() &&
        bDate.getDate() === slotDate.getDate() &&
        bDate.getHours() === targetHours &&
        bDate.getMinutes() === targetMinutes;

      const matchUTC =
        bDate.getUTCFullYear() === slotDate.getFullYear() &&
        bDate.getUTCMonth() === slotDate.getMonth() &&
        bDate.getUTCDate() === slotDate.getDate() &&
        bDate.getUTCHours() === targetHours &&
        bDate.getUTCMinutes() === targetMinutes;

      const matchTimestamp = Math.abs(bDate.getTime() - slotDate.getTime()) < 5 * 60 * 1000;

      return matchLocal || matchUTC || matchTimestamp;
    });

    if (isBooked) return "taken";

    // 2. Check if it's in the past or "too close" (Rule 1)
    if (isToday) {
      const now = Date.now();
      const fiveHoursInMs = 5 * 60 * 60 * 1000;
      if (slotTime < now + fiveHoursInMs) {
        return "past";
      }
    }

    return "available";
  };

  const morningSlots = availableSlots.filter((s) => s.period === "morning");
  const eveningSlots = availableSlots.filter((s) => s.period === "evening");

  const handleBooking = async (formData: ConsultationFormData) => {
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (!selectedSlot) {
      toast({ title: "Please select a time slot", variant: "destructive" });
      return;
    }

    if (!isLoaded) {
      toast({
        title: "Payment Not Ready",
        description: "Payment system is loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const requestedDateTime = buildISODateTime(selectedDate, selectedSlot.time);
      const orderResponse = await patientApi.createOrder({ requestedDateTime });
      const { orderId, amount } = orderResponse.data;
      console.log(amount);

      openPayment({
        orderId,
        amount: amount || CONSULTATION_PRICE,
        description: "Consultation Booking",
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        onSuccess: async (response: RazorpayResponse) => {
          try {
            setIsProcessing(false);
            await patientApi.requestConsultation({
              requestedDateTime,
              patientQuery: formData.patientQuery,
              patientName: user?.name,
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            setBookedEmail(user?.email || "");
            setShowSuccessModal(true);

            toast({
              title: "Booking Confirmed!",
              description: "Your consultation has been scheduled.",
            });
          } catch (error: any) {
            setIsProcessing(false);
            const errorMessage = error.response?.data?.message || "Payment succeeded but booking failed. Please contact support.";
            toast({
              title: "Booking Failed",
              description: errorMessage,
              variant: "destructive",
            });
            if (selectedDate) {
              const res = await publicApi.getBookedSlots(selectedDate);
              setBookedTimes(res.data.bookedTimes);
              setSelectedSlot(null);
            }
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (error) => {
          toast({
            title: "Payment Failed",
            description: error.message || "Payment could not be processed.",
            variant: "destructive",
          });
          setIsProcessing(false);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (error: any) {
      setIsProcessing(false);
      const errorMessage = error.response?.data?.message || "Failed to initiate payment. Please try again.";
      toast({
        title: "Slot Unavailable",
        description: errorMessage,
        variant: "destructive",
      });
      if (selectedDate) {
        try {
          const res = await publicApi.getBookedSlots(selectedDate);
          setBookedTimes(res.data.bookedTimes);
          setSelectedSlot(null);
        } catch (e) {
          console.error("Error refreshing slots", e);
        }
      }
    }
  };

  const isLoading = isProcessing || paymentLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Processing Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Processing Payment...
              </p>
              <p className="text-sm text-muted-foreground">
                Please do not close this window
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Schedule Consultation
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick a date and time for your video session
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Step 1: Date & Time */}
        <div className="space-y-6">
          <Card className="card-elevated border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                1. Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                min={todayDateString()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-12 text-lg"
              />
            </CardContent>
          </Card>

          <Card className="card-elevated border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                2. Select Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Morning Slots */}
                  <div className="relative">
                    {bookingLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <Sun className="h-4 w-4 text-orange-400" /> Morning
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {morningSlots.map((slot) => {
                        const state = getSlotState(slot);
                        const isSelected = selectedSlot?._id === slot._id;
                        return (
                          <button
                            key={slot._id}
                            disabled={state !== "available"}
                            onClick={() => setSelectedSlot(slot)}
                            className={`relative rounded-lg py-3 px-2 text-sm font-medium transition-all ${state === "taken" || state === "past"
                              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-secondary text-white shadow-lg scale-105"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                              }`}
                          >
                            {slot.time}
                            {state === "past" && (
                              <span className="absolute -top-2 -right-1 bg-amber-500 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                Past
                              </span>
                            )}
                            {state === "taken" && (
                              <span className="absolute -top-2 -right-1 bg-destructive text-[10px] text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                Taken
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evening Slots */}
                  <div className="relative">
                    {bookingLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <Moon className="h-4 w-4 text-indigo-400" /> Evening
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {eveningSlots.map((slot) => {
                        const state = getSlotState(slot);
                        const isSelected = selectedSlot?._id === slot._id;
                        return (
                          <button
                            key={slot._id}
                            disabled={state !== "available"}
                            onClick={() => setSelectedSlot(slot)}
                            className={`relative rounded-lg py-3 px-2 text-sm font-medium transition-all ${state === "taken" || state === "past"
                              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-primary text-white shadow-lg scale-105"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                              }`}
                          >
                            {slot.time}
                            {state === "past" && (
                              <span className="absolute -top-2 -right-1 bg-amber-500 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                Past
                              </span>
                            )}
                            {state === "taken" && (
                              <span className="absolute -top-2 -right-1 bg-destructive text-[10px] text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                Taken
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Form & Summary */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                3. Finalize & Pay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleBooking)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="patientQuery">Your Query (Optional)</Label>
                  <Textarea
                    id="patientQuery"
                    placeholder="Describe what you'd like to discuss..."
                    rows={4}
                    {...register("patientQuery")}
                  />
                  {errors.patientQuery && (
                    <p className="text-sm text-destructive">
                      {errors.patientQuery.message}
                    </p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Refund Policy:</span> Cancellations must be made within 24 hours of payment to be eligible for a full refund. Beyond this window, refunds are not processed.
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 border border-dashed border-muted-foreground/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Booking for:</span>
                    <span className="font-bold text-foreground">
                      {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '---'}
                      {selectedSlot ? `, ${selectedSlot.time}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{CONSULTATION_PRICE}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="phoenix"
                  size="lg"
                  className="w-full h-14 text-lg"
                  disabled={isLoading || !isLoaded || !selectedDate || !selectedSlot}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay & Confirm Booking
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="card-elevated bg-secondary/5 border border-secondary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Secure payment via Razorpay
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Instant booking confirmation
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post-Booking Confirmation Popup */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        if (!open) {
          setShowSuccessModal(false);
          navigate("/patient/bookings");
        }
      }}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <CheckCircle className="h-10 w-10 text-teal-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground text-center">
              Booking Confirmed!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <p className="text-sm text-muted-foreground text-center">
              Your consultation has been scheduled. Details & your Zoom meeting link have been sent to:
            </p>

            <div className="flex items-center justify-center gap-2 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm font-semibold text-teal-800">
              <Mail className="h-4 w-4 text-teal-600 shrink-0" />
              <span className="break-all">{bookedEmail || user?.email}</span>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950 mb-0.5">Check your Spam folder</p>
                <p className="text-amber-900/90 leading-relaxed">
                  If you don't see the email in your main inbox within 5 minutes, please check your <strong>Spam / Junk</strong> folder.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-11"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/patient/bookings");
              }}
            >
              View My Bookings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
