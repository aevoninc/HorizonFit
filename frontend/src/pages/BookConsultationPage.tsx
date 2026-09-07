import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Calendar,
  ArrowLeft,
  CreditCard,
  Check,
  Loader2,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  Stethoscope,
  Star,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay, RazorpayResponse } from "@/hooks/useRazorpay";
import { publicApi, TimeSlot } from "@/lib/api";
import logo from "../../public/logo.png";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  phone: z.string().min(10, "Please enter a valid phone number").max(15),
  consultationType: z.string().min(1, "Please select a consultation type"),
  patientQuery: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const consultationTypes = [
  {
    value: "initial",
    label: "Initial Assessment",
    price: 500,
    description: "Comprehensive health evaluation",
  },
];

const DEFAULT_SLOTS: TimeSlot[] = [
  { _id: "def-1", time: "9:30 AM", period: "morning", isActive: true, sortOrder: 1 },
  { _id: "def-2", time: "10:30 AM", period: "morning", isActive: true, sortOrder: 2 },
  { _id: "def-3", time: "11:30 AM", period: "morning", isActive: true, sortOrder: 3 },
  { _id: "def-4", time: "6:00 PM", period: "evening", isActive: true, sortOrder: 4 },
  { _id: "def-5", time: "7:00 PM", period: "evening", isActive: true, sortOrder: 5 },
  { _id: "def-6", time: "8:00 PM", period: "evening", isActive: true, sortOrder: 6 },
];

// ─── Slot picker helpers ─────────────────────────────────────────────────────

function todayDateString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function buildISODateTime(dateStr: string, timeStr: string): string {
  // timeStr e.g. "9:30 AM" or "6:00 PM"
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const d = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return d.toISOString();
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BookConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
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
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      consultationType: "initial",
    },
  });

  const selectedType = watch("consultationType");
  const selectedConsultation = consultationTypes.find(
    (t) => t.value === selectedType
  );

  // Fetch active slots once
  useEffect(() => {
    const loadSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await publicApi.getTimeSlots();
        if (res.data.slots && res.data.slots.length > 0) {
          setAvailableSlots(res.data.slots);
        } else {
          // If backend returns empty, use defaults
          setAvailableSlots(DEFAULT_SLOTS);
        }
      } catch (error) {
        console.error("Failed to load dynamic slots, using defaults:", error);
        setAvailableSlots(DEFAULT_SLOTS);
        // Optionally show toast for dev but keep it smooth for user
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [toast]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const fetchBookedSlots = async () => {
      setBookingLoading(true);
      try {
        const res = await publicApi.getBookedSlots(selectedDate);
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
      if (slotTime < now + fiveHoursInMs) return "past";
    }
    return "available";
  };

  const morningSlots = availableSlots.filter((s) => s.period === "morning");
  const eveningSlots = availableSlots.filter((s) => s.period === "evening");

  const validateAndProceed = () => {
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (new Date(selectedDate) < new Date(todayDateString())) {
      toast({ title: "Please select a future date", variant: "destructive" });
      return;
    }
    if (!selectedSlot) {
      toast({ title: "Please select a time slot", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handlePayment = async () => {
    const data = getValues();
    if (!isLoaded) {
      toast({ title: "Payment Not Ready", variant: "destructive" });
      return;
    }
    if (!selectedDate || !selectedSlot) {
      toast({ title: "Please select a date and time slot", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const requestedDateTime = buildISODateTime(selectedDate, selectedSlot.time);
      const orderResponse = await publicApi.createOrderId("consultation", undefined, requestedDateTime);
      const serverOrderId = orderResponse.data.orderId;
      const serverAmount = orderResponse.data.amount;

      if (!serverOrderId) throw new Error("Server did not return an Order ID");

      openPayment({
        orderId: serverOrderId,
        amount: serverAmount,
        description: `${selectedConsultation?.label || "Consultation"} Booking`,
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        onSuccess: async (response: RazorpayResponse) => {
          try {
            setIsProcessing(false);
            await publicApi.bookConsultation({
              name: data.name,
              email: data.email,
              mobileNumber: data.phone,
              requestedDateTime,
              patientQuery: data.patientQuery || "",
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            setBookedEmail(data.email);
            setShowSuccessModal(true);
            toast({ title: "Booking Confirmed! 🎉" });
          } catch (error: any) {
            setIsProcessing(false);
            const errorMessage = error.response?.data?.message || "Booking Failed. Please contact support.";
            toast({ title: "Booking Failed", description: errorMessage, variant: "destructive" });
            // Re-fetch booked slots to update UI if slot was taken
            if (selectedDate) {
              const res = await publicApi.getBookedSlots(selectedDate);
              setBookedTimes(res.data.bookedTimes);
              setSelectedSlot(null);
            }
          }
        },
        onError: () => setIsProcessing(false),
        onDismiss: () => setIsProcessing(false),
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error("Order Creation Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to initiate payment.";
      toast({
        title: "Slot Unavailable",
        description: errorMessage,
        variant: "destructive",
      });
      // Re-fetch booked slots to refresh taken state
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
    <div className="min-h-screen bg-muted/30">
      {/* Processing Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Processing Payment...
            </p>
            <p className="text-sm text-muted-foreground">
              Please do not close this window
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center group">
            <div className="relative flex items-center py-2">
              <img
                src={logo}
                alt="HorizonFit Logo"
                className="h-14 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
          </Link>
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Book a Consultation
          </h1>
          <p className="mt-2 text-muted-foreground">
            Schedule a 1-on-1 session with Dr. M. Jabaarrul
          </p>
        </motion.div>

        {/* Doctor Header Banner / Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="flex-shrink-0">
                <div className="h-28 w-28 rounded-2xl gradient-teal p-1 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/DoctorImg.jpeg"
                    alt="Dr. M. Jabaarrul"
                    className="h-full w-full rounded-[12px] object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary uppercase">
                  <span>1-on-1 Clinical Assessment</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground pt-1">
                  Dr. M. Jabaarrul
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  MBBS · AFIH · Fellowship in Clinical Diabetology
                </p>
                <p className="text-xs text-muted-foreground pt-2 max-w-xl leading-relaxed">
                  Doctor-led metabolic health evaluation for weight loss, prediabetes, liver health, and cardiometabolic risk factors.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator Header */}
        <div className="mb-10 flex items-center justify-center gap-4 text-sm font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              01
            </span>
            <span>Appointment Details</span>
          </div>
          <span className="text-muted-foreground/40 font-normal">→</span>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              02
            </span>
            <span>Payment</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(() => { })}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-8 lg:grid-cols-2"
              >
                {/* Personal Info */}
                <Card className="rounded-3xl border border-border/80 shadow-sm p-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-foreground">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                      <Input id="name" placeholder="John Smith" className="rounded-xl" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" className="rounded-xl" {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                      <Input id="phone" placeholder="+91 98765 43210" className="rounded-xl" {...register("phone")} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="patientQuery" className="text-xs font-semibold">Health Concern / Notes (Optional)</Label>
                      <Textarea
                        id="patientQuery"
                        placeholder="Briefly describe your primary health goal or concern..."
                        className="rounded-xl resize-none min-h-[90px]"
                        {...register("patientQuery")}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Date & Time Selection */}
                <div className="space-y-6">
                  <Card className="rounded-3xl border border-border/80 shadow-sm p-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        Select Date & Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="selectedDate" className="text-xs font-semibold">Consultation Date</Label>
                        <Input
                          id="selectedDate"
                          type="date"
                          min={todayDateString()}
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedSlot(null);
                          }}
                          className="rounded-xl"
                        />
                      </div>

                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No slots available for this date.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {/* Morning */}
                          {morningSlots.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                                <Sun className="h-3.5 w-3.5" />
                                Morning Slots
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {morningSlots.map((slot) => {
                                  const state = getSlotState(slot);
                                  const isSelected = selectedSlot?._id === slot._id;
                                  return (
                                    <button
                                      key={slot._id}
                                      type="button"
                                      disabled={state !== "available"}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all ${state === "taken" || state === "past"
                                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50 border-transparent"
                                        : isSelected
                                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                          : "border-border/80 bg-card hover:border-primary/50 text-foreground"
                                        }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Evening */}
                          {eveningSlots.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                                <Moon className="h-3.5 w-3.5" />
                                Evening Slots
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {eveningSlots.map((slot) => {
                                  const state = getSlotState(slot);
                                  const isSelected = selectedSlot?._id === slot._id;
                                  return (
                                    <button
                                      key={slot._id}
                                      type="button"
                                      disabled={state !== "available"}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all ${state === "taken" || state === "past"
                                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50 border-transparent"
                                        : isSelected
                                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                          : "border-border/80 bg-card hover:border-primary/50 text-foreground"
                                        }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Summary Callout & Action */}
                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">Metabolic Assessment Fee</span>
                      <span className="text-xl font-bold text-foreground">₹500</span>
                    </div>

                    <Button
                      type="button"
                      variant="phoenix"
                      size="xl"
                      className="w-full rounded-2xl font-bold shadow-phoenix"
                      onClick={handleSubmit(validateAndProceed)}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="rounded-3xl border border-border/80 shadow-sm mx-auto max-w-lg p-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-2xl bg-muted/40 p-5 space-y-4 border border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground text-base">Metabolic Health Assessment</p>
                          <p className="text-xs text-muted-foreground mt-0.5">1-on-1 Consultation with Dr. M. Jabaarrul</p>
                        </div>
                        <span className="text-2xl font-extrabold text-primary">₹500</span>
                      </div>

                      {selectedDate && selectedSlot && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-t border-border/60 pt-3">
                          <Calendar className="h-4 w-4 text-secondary shrink-0" />
                          <span>
                            {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            {" "}at{" "}
                            <span className="text-primary">{selectedSlot.time}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Secure processing via Razorpay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Instant booking confirmation details sent to email</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="phoenix"
                        className="flex-1 rounded-xl font-bold shadow-phoenix"
                        onClick={handlePayment}
                        disabled={isLoading || !isLoaded}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Pay ₹500</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-gradient-to-b from-card to-muted/40 py-10 mt-16">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-xl font-black tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
                <span className="text-primary">HORIZON</span> FIT
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Doctor-Led Metabolic Health Transformation</p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
              <Link to="/" className="hover:text-secondary transition-colors">About Horizon Fit</Link>
              <span>|</span>
              <Link to="/book-consultation" className="hover:text-secondary transition-colors">Contact</Link>
              <span>|</span>
              <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
              <span>|</span>
              <Link to="/terms-and-conditions" className="hover:text-secondary transition-colors">Terms & Conditions</Link>
              <span>|</span>
              <Link to="/disclaimer" className="hover:text-secondary transition-colors">Disclaimer</Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Horizon Fit. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Post-Booking Confirmation Popup */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        if (!open) {
          setShowSuccessModal(false);
          navigate("/booking-success", { state: { email: bookedEmail } });
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
              <span className="break-all">{bookedEmail}</span>
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
                navigate("/booking-success", { state: { email: bookedEmail } });
              }}
            >
              View Booking Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookConsultationPage;
