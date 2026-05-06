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
    price: 1,
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
  return `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BookConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

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
    const slotISO = buildISODateTime(selectedDate, slot.time);
    const slotDate = new Date(slotISO);
    const slotTime = slotDate.getTime();

    // 1. Check if it's already booked (Rule 2)
    const isBooked = bookedTimes.some((bt) => {
      const bDate = new Date(bt);
      return (
        bDate.getFullYear() === slotDate.getFullYear() &&
        bDate.getMonth() === slotDate.getMonth() &&
        bDate.getDate() === slotDate.getDate() &&
        bDate.getHours() === slotDate.getHours() &&
        bDate.getMinutes() === slotDate.getMinutes()
      );
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

    setIsProcessing(true);

    try {
      const orderResponse = await publicApi.createOrderId("consultation");
      const serverOrderId = orderResponse.data.orderId;
      const serverAmount = orderResponse.data.amount;

      if (!serverOrderId) throw new Error("Server did not return an Order ID");

      const requestedDateTime = buildISODateTime(selectedDate, selectedSlot!.time);

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
            toast({ title: "Booking Confirmed! 🎉" });
            navigate("/booking-success");
          } catch {
            toast({ title: "Booking Failed", variant: "destructive" });
          }
        },
        onError: () => setIsProcessing(false),
        onDismiss: () => setIsProcessing(false),
      });
    } catch (error) {
      console.error("Order Creation Error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
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
            Schedule a session with our certified health specialists
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 1 ? "gradient-phoenix" : "bg-muted"}`}
            >
              <span
                className={step >= 1 ? "text-primary-foreground font-semibold" : "text-muted-foreground"}
              >
                1
              </span>
            </div>
            <div className={`h-1 w-16 rounded ${step >= 2 ? "gradient-phoenix" : "bg-muted"}`} />
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 2 ? "gradient-phoenix" : "bg-muted"}`}
            >
              <span
                className={step >= 2 ? "text-primary-foreground font-semibold" : "text-muted-foreground"}
              >
                2
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(() => { })}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                {/* Personal Info */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Smith" {...register("name")} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientQuery">Your Query (Optional)</Label>
                      <Textarea
                        id="patientQuery"
                        placeholder="Tell us about your health goals or concerns..."
                        {...register("patientQuery")}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column: Date + Slot + Type */}
                <div className="space-y-6">
                  {/* Date Picker */}
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-secondary" />
                        Select Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        id="selectedDate"
                        type="date"
                        min={todayDateString()}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot(null);
                        }}
                        className="text-foreground"
                      />
                    </CardContent>
                  </Card>

                  {/* Time Slot Picker */}
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-secondary" />
                        Select Time Slot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No time slots available. Please check back later.
                        </p>
                      ) : (
                        <>
                          {/* Morning Slots */}
                          {morningSlots.length > 0 && (
                            <div className="relative space-y-2">
                              {bookingLoading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                                <Sun className="h-4 w-4" />
                                Morning
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
                                      className={`relative rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${state === "taken" || state === "past"
                                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60 border-transparent"
                                          : isSelected
                                            ? "border-secondary bg-secondary text-white shadow-md scale-105"
                                            : "border-border bg-card hover:border-secondary/60 hover:bg-secondary/5 text-foreground"
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
                          )}

                          {/* Evening Slots */}
                          {eveningSlots.length > 0 && (
                            <div className="relative space-y-2">
                              {bookingLoading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                                <Moon className="h-4 w-4" />
                                Evening
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
                                      className={`relative rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${state === "taken" || state === "past"
                                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60 border-transparent"
                                          : isSelected
                                            ? "border-secondary bg-secondary text-white shadow-md scale-105"
                                            : "border-border bg-card hover:border-secondary/60 hover:bg-secondary/5 text-foreground"
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
                          )}

                          {selectedSlot && selectedDate && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg bg-secondary/10 border border-secondary/30 px-4 py-2.5 text-sm font-medium text-secondary"
                            >
                              ✅ Selected: {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} at {selectedSlot.time}
                            </motion.div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Consultation Type */}
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle>Consultation Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedType}
                        onValueChange={(value) => setValue("consultationType", value)}
                        className="space-y-3"
                      >
                        {consultationTypes.map((type) => (
                          <label
                            key={type.value}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${selectedType === type.value
                                ? "border-secondary bg-secondary/5 shadow-sm"
                                : "border-border hover:border-secondary/50"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={type.value} />
                              <div>
                                <p className="font-medium text-foreground">{type.label}</p>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-primary">₹{type.price}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Button
                    type="button"
                    variant="phoenix"
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit(validateAndProceed)}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="card-elevated mx-auto max-w-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-secondary" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{selectedConsultation?.label}</p>
                          <p className="text-sm text-muted-foreground">{selectedConsultation?.description}</p>
                        </div>
                        <span className="text-2xl font-bold text-primary">₹{selectedConsultation?.price}</span>
                      </div>
                      {selectedDate && selectedSlot && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-3">
                          <Calendar className="h-4 w-4 text-secondary" />
                          <span>
                            {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            {" "}at{" "}
                            <span className="font-semibold text-foreground">{selectedSlot.time}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        Secure payment via Razorpay
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500" />
                        Instant booking confirmation
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500" />
                        Free cancellation up to 24h before
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="phoenix"
                        className="flex-1"
                        onClick={handlePayment}
                        disabled={isLoading || !isLoaded}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Pay ₹{selectedConsultation?.price}</>
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
    </div >
  );
};
