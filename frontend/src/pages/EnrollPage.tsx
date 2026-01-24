import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Dumbbell,
  Target,
  Award,
  ShieldCheck,
  Crown,
  Star,
  MessageCircle,
  ClipboardCheck,
  Calendar,
  CreditCard,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay, RazorpayResponse } from "@/hooks/useRazorpay";
import { publicApi, ProgramTier } from "@/lib/api";
import { cn } from "@/lib/utils";
import logo from "../../public/logo.png";
const enrollSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email").max(255),
    phone: z.string().min(10, "Please enter a valid phone number").max(15),
    password: z.string().min(8, "Password must be at least 8 characters"),
    assignedCategory: z.enum(["Weight Loss", "Weight Gain"], {
      errorMap: () => ({ message: "Please select a fitness goal" }),
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EnrollFormData = z.infer<typeof enrollSchema>;

const PROGRAM_TIERS = {
  normal: {
    name: "Normal Program",
    price: 10000,
    features: [
      "15 weeks of structured training",
      "Personalized task allocation",
      "Progress tracking & analytics",
      "Access to all 5 zones",
      "Basic dashboard",
    ],
    icon: Star,
  },
  // premium: {
  //   name: "Premium Program",
  //   price: 25000,
  //   features: [
  //     "Everything in Normal Program",
  //     "Priority doctor consultations",
  //     "1-on-1 weekly video calls",
  //     "Advanced analytics dashboard",
  //     "Diet & nutrition planning",
  //     "Lifetime access to materials",
  //     "24/7 support access",
  //   ],
  //   icon: Crown,
  // },
};

const programBenefits = [
  { icon: Dumbbell, text: "15 weeks of structured training" },
  { icon: Target, text: "Personalized task allocation" },
  { icon: Award, text: "Progress tracking & analytics" },
];

const STEPS = [
  {
    id: 1,
    label: "Consultation Check",
    icon: MessageCircle,
    description: "Verify your consultation",
  },
  {
    id: 2,
    label: "Select Plan",
    icon: ClipboardCheck,
    description: "Choose your program",
  },
  {
    id: 3,
    label: "Your Details",
    icon: Calendar,
    description: "Create your account",
  },
  {
    id: 4,
    label: "Payment",
    icon: CreditCard,
    description: "Complete enrollment",
  },
];

const Category = ["Weight Loss", "Weight Gain"];



export const EnrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<ProgramTier>("normal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    setValue, // Add this
    watch,
    formState: { errors },
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollSchema),
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  const selectedProgram = PROGRAM_TIERS[selectedTier];

const handleVerifyConsultation = async () => {
  try {
    setIsProcessing(true);
    
    // Pass as an object { consultationId: "your_id_here" }
    const response = await publicApi.verifyBooking({ consultationId: bookingId }); 
    console.log("Verification Response:", response.data);
    setStep(2); 
    toast({ title: "Success", description: "Consultation verified!" });
  } catch (error) {
    toast({ title: "Invalid ID", variant: "destructive" });
  } finally {
    setIsProcessing(false);
  }
};

  const validateAndProceed = async () => {
    const isValid = await trigger();
    if (isValid) {
      setStep(4); // Move from Form (3) to Payment (4)
    }
  };

  const handlePayment = async () => {
    const data = getValues();

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
      // Step 1: Create Order ID with program type (amount calculated server-side)
      const orderResponse = await publicApi.createOrderId(
        "program",
        selectedTier
      );
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
              assignedCategory: data.assignedCategory,
              planTier: selectedTier,
              paymentToken: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              programStartDate: new Date().toISOString(),
            });

            toast({
              title: "Enrollment Successful!",
              description:
                "Your account has been created. Please log in to access your dashboard.",
            });

            navigate("/booking-success", {
              state: { email: data.email },
            });
          } catch (error) {
            toast({
              title: "Enrollment Failed",
              description:
                "Payment succeeded but enrollment failed. Please contact support.",
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

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Enroll in the 15-Week Program
          </h1>
          <p className="mt-2 text-muted-foreground">
            Doctor-personalized fitness journey awaits you
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 md:gap-4">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 md:gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full transition-all duration-300",
                        step >= s.id
                          ? "gradient-phoenix shadow-phoenix"
                          : "bg-muted border-2 border-border"
                      )}
                    >
                      {step > s.id ? (
                        <Check className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <s.icon
                          className={cn(
                            "h-4 w-4 md:h-5 md:w-5",
                            step >= s.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs md:text-sm font-medium hidden md:block",
                        step >= s.id ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-1 w-8 md:w-16 rounded transition-all duration-300",
                        step > s.id ? "gradient-phoenix" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Consultation Check */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="card-elevated overflow-hidden">
              <div className="gradient-teal p-6 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-secondary-foreground mb-3" />
                <h2 className="text-xl font-bold text-secondary-foreground">
                  Consultation Required
                </h2>
                <p className="text-secondary-foreground/80 mt-2">
                  By Invite Only Following a Specialist Consultation
                </p>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    To ensure the best results, all participants must first
                    complete a{" "}
                    <strong className="text-foreground">
                      1:1 specialist consultation
                    </strong>
                    . This allows our doctors to understand your unique needs
                    and create a truly personalized program.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Why consultation first?
                    </p>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>
                          Personalized assessment of your fitness level
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Understanding of your health conditions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Customized goals and expectations</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Already completed a consultation? Enter your Booking ID:
                  </p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter Booking ID (e.g., HF-12345)"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="teal" onClick={handleVerifyConsultation}>
                      Verify
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Link to="/book-consultation">
                    <Button
                      variant="phoenix"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Book My Consultation Now
                    </Button>
                  </Link>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Schedule your consultation and receive a Booking ID via
                    email
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Plan */}
        {step === 2 && (
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
                    "cursor-pointer transition-all duration-300 hover:shadow-lg",
                    isSelected
                      ? "ring-2 ring-primary shadow-phoenix"
                      : "card-elevated"
                  )}
                  onClick={() => setSelectedTier(tier)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            tier === "premium"
                              ? "gradient-phoenix"
                              : "gradient-teal"
                          )}
                        >
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {program.name}
                          </CardTitle>
                          {tier === "premium" && (
                            <span className="text-xs text-primary font-medium">
                              MOST POPULAR
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <span className="text-4xl font-bold text-gradient-phoenix">
                        ₹{program.price.toLocaleString()}
                      </span>
                      <p className="text-muted-foreground">One-time payment</p>
                    </div>

                    <div className="space-y-3">
                      {program.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="md:col-span-2 flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="phoenix" size="lg" onClick={() => setStep(3)}>
                Continue with {selectedProgram.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Form */}
        {step === 3 && (
          <div className="grid gap-8 lg:grid-cols-5 max-w-5xl mx-auto">
            {/* Program Summary */}
            <Card className="card-elevated lg:col-span-2">
              <CardHeader>
                <CardTitle>Selected Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      selectedTier === "premium"
                        ? "gradient-phoenix"
                        : "gradient-teal"
                    )}
                  >
                    <selectedProgram.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedProgram.name}
                    </p>
                    <p className="text-2xl font-bold text-gradient-phoenix">
                      ₹{selectedProgram.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  {selectedProgram.features.slice(0, 5).map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
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
                      <Input
                        id="name"
                        placeholder="John Smith"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Fitness Goal</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Category.map((cat) => (
                          <Button
                            key={cat}
                            type="button"
                            variant={
                              watch("assignedCategory") === cat
                                ? "teal"
                                : "outline"
                            }
                            onClick={() =>
                              setValue("assignedCategory", cat as any)
                            }
                            className="w-full"
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                      {errors.assignedCategory && (
                        <p className="text-sm text-destructive">
                          {errors.assignedCategory.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...register("confirmPassword")}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your account will be created automatically after
                      successful payment.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="phoenix"
                        className="flex-1"
                        onClick={validateAndProceed}
                      >
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

        {/* Step 4: Payment */}
        {step === 4 && (
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
                    <p className="text-lg font-medium">
                      {selectedProgram.name}
                    </p>
                    <p className="text-4xl font-bold">
                      ₹{selectedProgram.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      Secure payment via Razorpay
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      Instant account activation
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      30-day money-back guarantee
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(3)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="phoenix"
                      className="flex-1"
                      onClick={handlePayment}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ₹{selectedProgram.price.toLocaleString()}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer with Branding */}
      <footer className="border-t border-border bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-phoenix">
                <Flame className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">HorizonFit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 HorizonFit. All rights reserved.
            </p>
            <p className="text-xs text-secondary">
              Developed by <span className="font-medium">Javid Shariff</span>{" "}
              (Technical Lead) @ Aevon Inc
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
