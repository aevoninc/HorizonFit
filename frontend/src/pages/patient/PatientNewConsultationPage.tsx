import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay, RazorpayResponse } from "@/hooks/useRazorpay";
import { patientApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const consultationSchema = z.object({
  requestedDateTime: z.string().min(1, "Please select a date and time"),
  patientQuery: z.string().max(500).optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const CONSULTATION_PRICE = 599;

export const PatientNewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
  });

  const handlePayment = async (data: ConsultationFormData) => {
    // Validate date is in the future
    const selectedDate = new Date(data.requestedDateTime);
    if (selectedDate <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date.",
        variant: "destructive",
      });
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
      // Step 1: Create Order ID
      const orderResponse = await patientApi.createOrder();
      const { orderId, amount } = orderResponse.data; 
      console.log("Order Data Received:", orderId, amount);
      // Step 2: Open Razorpay
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
            // Step 3: Verify and book
            await patientApi.requestConsultation({
              requestedDateTime: data.requestedDateTime,
              patientQuery: data.patientQuery,
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast({
              title: "Booking Confirmed!",
              description: "Your consultation has been scheduled.",
            });

            navigate("/patient/bookings");
          } catch (error) {
            toast({
              title: "Booking Failed",
              description:
                "Payment succeeded but booking failed. Please contact support.",
              variant: "destructive",
            });
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Book a Consultation
        </h1>
        <p className="mt-1 text-muted-foreground">
          Schedule a session with your doctor
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Schedule Your Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handlePayment)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requestedDateTime">Preferred Date & Time</Label>
                <Input
                  id="requestedDateTime"
                  type="datetime-local"
                  {...register("requestedDateTime")}
                />
                {errors.requestedDateTime && (
                  <p className="text-sm text-destructive">
                    {errors.requestedDateTime.message}
                  </p>
                )}
              </div>

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

              <Button
                type="submit"
                variant="phoenix"
                size="lg"
                className="w-full"
                disabled={isLoading || !isLoaded}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ₹{CONSULTATION_PRICE} & Book
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-secondary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Follow-up Consultation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    45-minute video session
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">
                  ₹{CONSULTATION_PRICE}
                </span>
              </div>
            </div>

            <div className="space-y-3">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Refund processed within 5-7 days
              </div>
            </div>

            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Logged in as:</strong> {user?.name || "Patient"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
