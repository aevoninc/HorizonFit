import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Calendar, ArrowLeft, CreditCard, Check, Loader2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay, RazorpayResponse } from '@/hooks/useRazorpay';
import { publicApi } from '@/lib/api';
import logo from "../../public/logo.png";

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').max(255),
  phone: z.string().min(10, 'Please enter a valid phone number').max(15),
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  consultationType: z.string().min(1, 'Please select a consultation type'),
  patientQuery: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const consultationTypes = [
  { value: 'initial', label: 'Initial Assessment', price: 200, description: 'Comprehensive fitness evaluation' },
  // { value: 'followup', label: 'Follow-up Session', price: 599, description: 'Progress review and adjustments' },
  // { value: 'nutrition', label: 'Nutrition Consultation', price: 799, description: 'Personalized diet planning' },
];

export const BookConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

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
      consultationType: 'initial',
    },
  });

  const selectedType = watch('consultationType');
  const selectedConsultation = consultationTypes.find((t) => t.value === selectedType);

  const validateAndProceed = () => {
    const values = getValues();
    
    // Validate date is in the future
    if (values.preferredDate) {
      const selectedDate = new Date(values.preferredDate);
      if (selectedDate <= new Date()) {
        toast({
          title: 'Invalid Date',
          description: 'Please select a future date.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setStep(2);
  };

const handlePayment = async () => {
    const data = getValues();
    if (!isLoaded) {
      toast({ title: 'Payment Not Ready', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Order ID
      const orderResponse = await publicApi.createOrderId('consultation', {
        consultationType: data.consultationType,
      });

      // ✅ CORRECTED EXTRACTION: Match your Backend keys
      const serverOrderId = orderResponse.data.orderId; 
      const serverAmount = orderResponse.data.amount;

      if (!serverOrderId) {
        throw new Error("Server did not return an Order ID");
      }

      // Step 2: Open Razorpay
      openPayment({
        orderId: serverOrderId, 
        amount: serverAmount,   
        description: `${selectedConsultation?.label || 'Consultation'} Booking`,
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        onSuccess: async (response: RazorpayResponse) => {
          try {
            // Step 3: Send data to your verify/book endpoint
            await publicApi.bookConsultation({
              name: data.name,
              email: data.email,
              mobileNumber: data.phone,
              requestedDateTime: data.preferredDate,
              patientQuery: data.patientQuery || "",
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature 
            });

            toast({ title: 'Booking Confirmed!' });
            navigate('/booking-success');
          } catch (error) {
            toast({ title: 'Booking Failed', variant: 'destructive' });
          } finally {
            setIsProcessing(false);
          }
        },
        onError: () => setIsProcessing(false),
        onDismiss: () => setIsProcessing(false),
      });
    } catch (error) {
      console.error("Order Creation Error:", error);
      toast({ title: 'Error', description: 'Failed to initiate payment.', variant: 'destructive' });
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
            <p className="mt-4 text-lg font-medium text-foreground">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">Please do not close this window</p>
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
                style={{
                  // Optional: if the logo has a white background you want to blend
                  mixBlendMode: "multiply",
                }}
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
          <h1 className="text-3xl font-bold text-foreground">Book a Consultation</h1>
          <p className="mt-2 text-muted-foreground">
            Schedule a session with our certified fitness professionals
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 1 ? 'gradient-phoenix' : 'bg-muted'}`}>
              <span className={step >= 1 ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'}>1</span>
            </div>
            <div className={`h-1 w-16 rounded ${step >= 2 ? 'gradient-phoenix' : 'bg-muted'}`} />
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 2 ? 'gradient-phoenix' : 'bg-muted'}`}>
              <span className={step >= 2 ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'}>2</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(() => {})}>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
                    <Input id="name" placeholder="John Smith" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+91 98765 43210" {...register('phone')} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date & Time</Label>
                    <Input id="preferredDate" type="datetime-local" {...register('preferredDate')} />
                    {errors.preferredDate && <p className="text-sm text-destructive">{errors.preferredDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientQuery">Your Query (Optional)</Label>
                    <Textarea
                      id="patientQuery"
                      placeholder="Tell us about your health goals or concerns..."
                      {...register('patientQuery')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Consultation Type */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Select Consultation Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedType}
                    onValueChange={(value) => setValue('consultationType', value)}
                    className="space-y-3"
                  >
                    {consultationTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${
                          selectedType === type.value
                            ? 'border-secondary bg-secondary/5 shadow-sm'
                            : 'border-border hover:border-secondary/50'
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
                  {errors.consultationType && (
                    <p className="mt-2 text-sm text-destructive">{errors.consultationType.message}</p>
                  )}
                </CardContent>
              </Card>

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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="card-elevated mx-auto max-w-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-secondary" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{selectedConsultation?.label}</p>
                        <p className="text-sm text-muted-foreground">{selectedConsultation?.description}</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">₹{selectedConsultation?.price}</span>
                    </div>
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
        </form>
      </div>
    </div>
  );
};
