import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, ArrowLeft, ArrowRight, Check, Loader2, Dumbbell, Target, Award, ShieldCheck, Crown, Star } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay, RazorpayResponse } from '@/hooks/useRazorpay';
import { publicApi, ProgramTier } from '@/lib/api';
import { cn } from '@/lib/utils';

const enrollSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').max(255),
  phone: z.string().min(10, 'Please enter a valid phone number').max(15),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EnrollFormData = z.infer<typeof enrollSchema>;

const PROGRAM_TIERS = {
  normal: {
    name: 'Normal Program',
    price: 10000,
    features: [
      '15 weeks of structured training',
      'Personalized task allocation',
      'Progress tracking & analytics',
      'Access to all 5 zones',
      'Basic dashboard',
    ],
    icon: Star,
  },
  premium: {
    name: 'Premium Program',
    price: 25000,
    features: [
      'Everything in Normal Program',
      'Priority doctor consultations',
      '1-on-1 weekly video calls',
      'Advanced analytics dashboard',
      'Diet & nutrition planning',
      'Lifetime access to materials',
      '24/7 support access',
    ],
    icon: Crown,
  },
};

const programBenefits = [
  { icon: Dumbbell, text: '15 weeks of structured training' },
  { icon: Target, text: 'Personalized task allocation' },
  { icon: Award, text: 'Progress tracking & analytics' },
];

export const EnrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<ProgramTier>('normal');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollSchema),
  });

  const selectedProgram = PROGRAM_TIERS[selectedTier];

  const validateAndProceed = async () => {
  const isValid = await trigger(); // Validates Zod schema
  if (isValid) {
    setStep(3); // This MUST be 3 to show the payment card
  }
  };

  const handlePayment = async () => {
    const data = getValues();
    
    if (!isLoaded) {
      toast({
        title: 'Payment Not Ready',
        description: 'Payment system is loading. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Order ID with program type (amount calculated server-side)
      const orderResponse = await publicApi.createOrderId('program', selectedTier);
      const { orderId, amount } = orderResponse.data;

      // Step 2: Open Razorpay
      openPayment({
        orderId,
        amount,
        description: `${selectedProgram.name} Enrollment`,
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        onSuccess: async (response: RazorpayResponse) => {
          try {
            // Step 3: Verify and enroll
            await publicApi.bookProgram({
              name: data.name,
              email: data.email,
              mobileNumber: data.phone,
              password: data.password,
              programType: selectedTier,
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast({
              title: 'Enrollment Successful!',
              description: 'Your account has been created. Please log in to access your dashboard.',
            });

            navigate('/booking-success');
          } catch (error) {
            toast({
              title: 'Enrollment Failed',
              description: 'Payment succeeded but enrollment failed. Please contact support.',
              variant: 'destructive',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (error) => {
          toast({
            title: 'Payment Failed',
            description: error.message || 'Payment could not be processed.',
            variant: 'destructive',
          });
          setIsProcessing(false);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
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
            <p className="mt-4 text-lg font-medium text-foreground">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">Please do not close this window</p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HorizonFit</span>
          </Link>
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">Choose Your Program</h1>
          <p className="mt-2 text-muted-foreground">
            Start your transformation journey today
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step >= s ? 'gradient-phoenix' : 'bg-muted'
                  }`}
                >
                  <span className={step >= s ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'}>
                    {s}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`h-1 w-16 rounded ${step > s ? 'gradient-phoenix' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-8 text-sm">
            <span className={step === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}>Select Plan</span>
            <span className={step === 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}>Your Details</span>
            <span className={step === 3 ? 'text-primary font-semibold' : 'text-muted-foreground'}>Payment</span>
          </div>
        </div>

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto"
          >
            {(Object.keys(PROGRAM_TIERS) as ProgramTier[]).map((tier) => {
              const program = PROGRAM_TIERS[tier];
              const isSelected = selectedTier === tier;
              const Icon = program.icon;

              return (
                <Card
                  key={tier}
                  className={cn(
                    'cursor-pointer transition-all duration-300 hover:shadow-lg',
                    isSelected ? 'ring-2 ring-primary shadow-phoenix' : 'card-elevated'
                  )}
                  onClick={() => setSelectedTier(tier)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          tier === 'premium' ? 'gradient-phoenix' : 'gradient-teal'
                        )}>
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{program.name}</CardTitle>
                          {tier === 'premium' && (
                            <span className="text-xs text-primary font-medium">MOST POPULAR</span>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}>
                        {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <span className="text-4xl font-bold text-gradient-phoenix">₹{program.price.toLocaleString()}</span>
                      <p className="text-muted-foreground">One-time payment</p>
                    </div>

                    <div className="space-y-3">
                      {program.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="md:col-span-2 flex justify-center mt-4">
              <Button variant="phoenix" size="lg" onClick={() => setStep(2)}>
                Continue with {selectedProgram.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div className="grid gap-8 lg:grid-cols-5 max-w-5xl mx-auto">
            {/* Program Summary */}
            <Card className="card-elevated lg:col-span-2">
              <CardHeader>
                <CardTitle>Selected Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    selectedTier === 'premium' ? 'gradient-phoenix' : 'gradient-teal'
                  )}>
                    <selectedProgram.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedProgram.name}</p>
                    <p className="text-2xl font-bold text-gradient-phoenix">₹{selectedProgram.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  {selectedProgram.features.slice(0, 5).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                  Change Plan
                </Button>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="card-elevated lg:col-span-3">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(() => {})} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
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
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                      {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your account will be created automatically after successful payment.
                    </p>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button type="button" variant="phoenix" className="flex-1" onClick={validateAndProceed}>
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-lg gradient-phoenix p-6 text-center text-primary-foreground">
                    <p className="text-lg font-medium">{selectedProgram.name}</p>
                    <p className="text-4xl font-bold">₹{selectedProgram.price.toLocaleString()}</p>
                  </div>

                  <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      Secure payment via Razorpay
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      30-day money-back guarantee
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      Instant access upon payment
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
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
                        <>Pay ₹{selectedProgram.price.toLocaleString()}</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
