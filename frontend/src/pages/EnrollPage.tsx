import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  FileText,
  ChevronDown,
  AlertTriangle,
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
    assignedCategory: z.enum(["Weight Loss", "Weight Gain", "Pre diabetic"], {
      errorMap: () => ({ message: "Please select a health goal" }),
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
    name: "15-Week Self-Guided Weight Loss System",
    price: 6999,
    features: [
      "15 weeks of structured self-guided content",
      "Personal Horizon Fit dashboard",
      "Horizon Guide & learning videos",
      "5 Zone-specific workbooks",
      "Guided calculations and activities",
      "Daily Code & weekly progress tracking",
    ],
    icon: Star,
  },
};

const programBenefits = [
  { icon: Dumbbell, text: "15 weeks of structured self-guided content" },
  { icon: Target, text: "Personal Horizon Fit dashboard" },
  { icon: Award, text: "Daily Code & weekly progress tracking" },
];

const STEPS = [
  // {
  //   id: 1,
  //   label: "Consultation Check",
  //   icon: MessageCircle,
  //   description: "Verify your consultation",
  // },
  {
    id: 1,
    label: "Select Plan",
    icon: ClipboardCheck,
    description: "Choose your program",
  },
  {
    id: 2,
    label: "Your Details",
    icon: Calendar,
    description: "Create your account",
  },
  {
    id: 3,
    label: "Legal Agreement",
    icon: FileText,
    description: "Review & agree to terms",
  },
  {
    id: 4,
    label: "Payment",
    icon: CreditCard,
    description: "Complete enrollment",
  },
];

const Category = ["Weight Loss", "Weight Gain", "Pre diabetic"];

// ─── Legal Document Content ───────────────────────────────────────────────────
const LEGAL_DOCUMENTS = [
  {
    id: "terms",
    title: "Terms and Conditions",
    checkboxLabel: "I have read and agree to the Terms and Conditions.",
    content: `TERMS AND CONDITIONS
Horizon Fit Health Management Private Limited
Effective Date: 7 June 2026

1. DIGITAL EDUCATIONAL PRODUCT
The HorizonFit 15-Week Self-Learning Program is a digital educational product designed for self-learning and personal health improvement. It is not a medical treatment, clinical service, or substitute for professional medical care.

2. ACCESS PERIOD
Access to the program is granted for 15 weeks (105 days) from the date of account activation. After this period, access may be renewed at the discretion of Horizon Fit.

3. PERSONAL USE ONLY
The program is licensed for personal use only. You may not share your login credentials, distribute program content, or allow any other person to access your account.

4. PROHIBITED ACTIVITIES
The following activities are strictly prohibited:
• Sharing login credentials with any third party
• Recording, downloading, or redistributing any video or PDF content
• Reselling or sublicensing access to any other party
• Reverse engineering any part of the platform

5. INTELLECTUAL PROPERTY
All content within the HorizonFit platform — including but not limited to videos, PDFs, habit guides, dashboard design, and program structure — is the exclusive intellectual property of Horizon Fit Health Management Private Limited. Unauthorised reproduction is a violation of Indian copyright law.

6. GOVERNING LAW
These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts located in [Registered State], India.

7. MODIFICATIONS
Horizon Fit reserves the right to update these Terms at any time. Continued use of the platform after updates constitutes acceptance of the revised Terms.`,
  },
  {
    id: "userAgreement",
    title: "User Agreement",
    checkboxLabel: "I have read and agree to the User Agreement.",
    content: `USER AGREEMENT
Horizon Fit Health Management Private Limited
Effective Date: 7 June 2026

1. LICENSE GRANT
Horizon Fit grants you a limited, non-exclusive, non-transferable, revocable license to access and use the HorizonFit platform solely for your personal, non-commercial educational use.

2. NO DOCTOR-PATIENT RELATIONSHIP
Use of the HorizonFit platform does not create a doctor-patient relationship between you and Dr. M. Jabaarrul or Horizon Fit Health Management Private Limited. The program is an educational resource. The doctor's involvement is in designing the program content — not in providing you with individual medical advice.

3. USER RESPONSIBILITY
You are solely responsible for your own health decisions. Always consult a qualified healthcare professional before making significant changes to your diet, exercise, or medication regimen.

4. ACCOUNT SECURITY
You are responsible for maintaining the confidentiality of your login credentials. You must notify Horizon Fit immediately if you suspect unauthorised access to your account at info@horizonfit.in.

5. SUSPENSION WITHOUT REFUND
Horizon Fit reserves the right to suspend or terminate your account without refund if you violate any provision of this Agreement or the Terms and Conditions.

6. ELECTRONIC ACCEPTANCE
By checking the acceptance box and clicking "Proceed to Payment," you confirm that your electronic acceptance of this Agreement carries the same legal force and effect as a handwritten signature.

7. RECORDED ACCEPTANCE
Horizon Fit records the following at the time of your acceptance: your full name, email address, mobile number, the timestamp of acceptance, your IP address, your browser and device information, and the version date of the documents you accepted. This record is permanently stored for legal and compliance purposes.`,
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    checkboxLabel: "I have read and agree to the Disclaimer.",
    content: `DISCLAIMER
Horizon Fit Health Management Private Limited
Effective Date: 7 June 2026

1. EDUCATIONAL PURPOSE ONLY
The HorizonFit program is provided for educational and informational purposes only. All content — including videos, PDFs, habit guides, and program materials — is intended to support self-learning and general health awareness.

2. NOT MEDICAL ADVICE
Nothing in the HorizonFit program constitutes medical advice, diagnosis, or treatment. The content is not a substitute for professional medical advice, diagnosis, or treatment from a qualified physician or other licensed healthcare provider.

3. NO DOCTOR-PATIENT RELATIONSHIP
Access to or use of the HorizonFit platform does not create a doctor-patient relationship between you and Dr. M. Jabaarrul or any representative of Horizon Fit.

4. INDIVIDUAL RESULTS
Health outcomes vary between individuals based on genetics, existing health conditions, adherence, lifestyle, and other factors outside Horizon Fit's control. No specific health outcomes, weight changes, or medical improvements are guaranteed.

5. PRE-EXISTING CONDITIONS
If you have a pre-existing medical condition — including but not limited to diabetes, cardiovascular disease, kidney disease, or any chronic illness — you must consult your treating physician before beginning this program.

6. NOT FOR EMERGENCIES
The HorizonFit platform is not designed for use in emergency situations. If you experience a medical emergency, call your local emergency services immediately.`,
  },
  {
    id: "privacyPolicy",
    title: "Privacy Policy",
    checkboxLabel: "I have read and agree to the Privacy Policy.",
    content: `PRIVACY POLICY
Horizon Fit Health Management Private Limited
Effective Date: 7 June 2026

1. INFORMATION WE COLLECT
When you register and use the HorizonFit platform, we collect the following information:
• Full name, email address, mobile number
• Age, gender, and location (if provided)
• Health goal category selected at enrollment
• Login activity and session data
• Daily habit logs and weekly progress data
• Payment reference number (Razorpay order ID and payment ID)
• IP address, browser, and device information at time of legal acceptance

2. WHAT WE DO NOT STORE
Horizon Fit does NOT store credit card numbers, debit card numbers, UPI PINs, bank account details, or any raw payment credentials. All payment processing is handled by Razorpay, which is PCI-DSS compliant.

3. HOW WE USE YOUR DATA
Your data is used for:
• Creating and managing your patient account
• Delivering the program content zone by zone
• Tracking your daily habits and weekly progress
• Enabling consultation booking
• Sending important account and program notifications by email
• Maintaining legal compliance records (acceptance of terms)

4. DATA SHARING
We may share your data with:
• Razorpay (payment processing — for transaction verification only)
• Email delivery providers (for sending account credentials and notifications)
• Government authorities or law enforcement when legally required

We do not sell your personal data to any third party for marketing purposes.

5. DATA RETENTION
We retain your data for as long as your account is active and as required by applicable Indian law for legal compliance and audit purposes.

6. CONTACT
For any privacy-related queries or data deletion requests, contact us at:
Email: info@horizonfit.in`,
  },
  {
    id: "refundPolicy",
    title: "Refund Policy",
    checkboxLabel: "I have read and agree to the Refund Policy.",
    content: `REFUND POLICY
Horizon Fit Health Management Private Limited
Effective Date: 7 June 2026

1. NO REFUND AFTER ACCESS ACTIVATION
All sales are final. Once your login credentials have been issued and access to the HorizonFit patient portal has been activated following your payment, no refund will be issued under any circumstances.

2. NON-REFUNDABLE SITUATIONS
The following situations do not qualify for a refund:
• Change of mind after purchase
• Lack of time or inability to use the program
• Failure to use the program or complete zones
• Dissatisfaction with results (results vary by individual)
• Technical issues arising from your own device, internet connection, or browser
• Accidental purchase (please verify your selection before completing payment)

3. LIMITED EXCEPTION
The only exception to this policy is if Horizon Fit fails to provide you with access to the program (i.e., login credentials are not delivered) within 72 hours of confirmed payment due to a technical error on Horizon Fit's side.

In such cases, contact us at info@horizonfit.in with your payment reference number within 72 hours of payment. We will investigate and issue a refund if the error is confirmed to be on our end.

4. NO CHARGEBACKS
You agree not to initiate a chargeback or payment dispute through your bank or card provider without first contacting Horizon Fit at info@horizonfit.in and giving us a reasonable opportunity to resolve the issue. Initiating an unjustified chargeback may result in legal action.

5. CONTACT
Email: info@horizonfit.in`,
  },
];

// ─── Accordion for a single legal document ───────────────────────────────────
const LegalDocAccordion = ({
  doc,
  isOpen,
  onToggle,
}: {
  doc: (typeof LEGAL_DOCUMENTS)[0];
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div
    className={`overflow-hidden rounded-xl border transition-all duration-200 ${isOpen ? "border-primary/30" : "border-border/60"
      }`}
  >
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors ${isOpen ? "bg-primary/5" : "bg-background hover:bg-muted/40"
        }`}
      onClick={onToggle}
    >
      <span
        className={`text-sm font-semibold ${isOpen ? "text-primary" : "text-foreground"}`}
      >
        {doc.title}
      </span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
          }`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="max-h-72 overflow-y-auto border-t border-border/40 bg-muted/20 px-6 py-5">
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
              {doc.content}
            </pre>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const EnrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isLoading: paymentLoading, openPayment } = useRazorpay();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<ProgramTier>("normal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [duplicateError, setDuplicateError] = useState<{
    emailTaken?: boolean;
    phoneTaken?: boolean;
    message?: string;
  } | null>(null);

  // ─── Legal Agreement State ────────────────────────────────────────────────
  const [legalAcceptances, setLegalAcceptances] = useState({
    terms: false,
    userAgreement: false,
    disclaimer: false,
    privacyPolicy: false,
    refundPolicy: false,
  });
  const [acceptedAt, setAcceptedAt] = useState<Date | null>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  const allLegalAccepted = Object.values(legalAcceptances).every(Boolean);

  const resetLegalAcceptances = () => {
    setLegalAcceptances({
      terms: false,
      userAgreement: false,
      disclaimer: false,
      privacyPolicy: false,
      refundPolicy: false,
    });
    setAcceptedAt(null);
    setOpenDocId(null);
  };

  const toggleAcceptance = (key: keyof typeof legalAcceptances) => {
    setLegalAcceptances((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Set the timestamp when all become checked
      if (Object.values(updated).every(Boolean)) {
        setAcceptedAt(new Date());
      }
      return updated;
    });
  };

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    setValue,
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
    if (!isValid) return;

    // Check for duplicate email / phone before advancing
    setDuplicateError(null);
    const { email, phone } = getValues();
    try {
      setIsProcessing(true);
      await publicApi.checkDuplicate({ email, mobileNumber: phone });
      // No duplicate — advance to Legal Agreement step
      setIsProcessing(false);
      setStep(3);
    } catch (err: any) {
      setIsProcessing(false);
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.duplicate) {
        setDuplicateError({
          emailTaken: data.emailTaken,
          phoneTaken: data.phoneTaken,
          message: data.message,
        });
        toast({
          title: "Account Already Exists",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not verify your details. Please try again.",
          variant: "destructive",
        });
      }
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

    // Build legal acceptance payload
    const legalAcceptancePayload = {
      termsAccepted: legalAcceptances.terms,
      userAgreementAccepted: legalAcceptances.userAgreement,
      disclaimerAccepted: legalAcceptances.disclaimer,
      privacyPolicyAccepted: legalAcceptances.privacyPolicy,
      refundPolicyAccepted: legalAcceptances.refundPolicy,
      acceptedAt: (acceptedAt || new Date()).toISOString(),
      agreementVersion: "7 June 2026",
    };

    try {
      // Step 1: Create Order ID
      const orderResponse = await publicApi.createOrderId("program", selectedTier);
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
            // Step 3: Verify and enroll — include legal acceptance
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
              legalAcceptance: legalAcceptancePayload,
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

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Enrol in the 15-Week Self-Guided Weight Loss System
          </h1>
          <p className="mt-2 text-muted-foreground">
            Learn the framework. Build your plan. Follow your journey.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-1 md:gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 md:gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full transition-all duration-300",
                        step >= s.id
                          ? "gradient-phoenix shadow-phoenix"
                          : "bg-muted border-2 border-border"
                      )}
                    >
                      {step > s.id ? (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <s.icon
                          className={cn(
                            "h-4 w-4",
                            step >= s.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium hidden md:block",
                        step >= s.id ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-1 w-5 md:w-10 rounded transition-all duration-300",
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
        {/* {step === 1 && (
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
                        <span>Personalized assessment of your metabolic health</span>
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
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link to="/book-consultation">
                    <Button variant="phoenix" size="lg" className="w-full sm:w-auto">
                      <Calendar className="mr-2 h-5 w-5" />
                      Book My Consultation Now
                    </Button>
                  </Link>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Schedule your consultation and receive a Booking ID via email
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )} */}

        {/* Step 2: Select Plan */}
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
                    "cursor-pointer transition-all duration-300 hover:shadow-lg",
                    isSelected ? "ring-2 ring-primary shadow-phoenix" : "card-elevated"
                  )}
                  onClick={() => setSelectedTier(tier)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            tier === "premium" ? "gradient-phoenix" : "gradient-teal"
                          )}
                        >
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{program.name}</CardTitle>
                          {tier === "premium" && (
                            <span className="text-xs text-primary font-medium">MOST POPULAR</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <span className="text-4xl font-bold text-gradient-phoenix">
                        ₹{program.price.toLocaleString()}
                      </span>
                      <p className="text-muted-foreground">One-time payment (Inclusive of GST)</p>
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
              {/* <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button> */}
              <Button variant="phoenix" size="lg" onClick={() => setStep(2)}>
                Continue to Enrolment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Form */}
        {step === 2 && (
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
                      selectedTier === "premium" ? "gradient-phoenix" : "gradient-teal"
                    )}
                  >
                    <selectedProgram.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedProgram.name}</p>
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
                  onClick={() => setStep(1)}
                >
                  Change Plan
                </Button>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="card-elevated lg:col-span-3">
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(() => { })} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Smith" {...register("name")} />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email", {
                          onChange: () => setDuplicateError(null),
                        })}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                      {duplicateError?.emailTaken && !errors.email && (
                        <p className="text-sm text-destructive">This email address is already registered. Please log in or use a different email.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        {...register("phone", {
                          onChange: () => setDuplicateError(null),
                        })}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                      {duplicateError?.phoneTaken && !errors.phone && (
                        <p className="text-sm text-destructive">This phone number is already registered. Please use a different number.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Health Goal</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Category.map((cat) => (
                          <Button
                            key={cat}
                            type="button"
                            variant={watch("assignedCategory") === cat ? "teal" : "outline"}
                            onClick={() => setValue("assignedCategory", cat as any)}
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
                        <p className="text-sm text-destructive">{errors.password.message}</p>
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
                      Your Horizon Fit account and dashboard access will be activated after successful payment.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="phoenix"
                        className="flex-1"
                        onClick={validateAndProceed}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            Review Legal Terms
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Legal Agreement */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="card-elevated overflow-hidden">
              <div className="gradient-teal p-6 text-center">
                <FileText className="mx-auto h-10 w-10 text-secondary-foreground mb-3" />
                <h2 className="text-xl font-bold text-secondary-foreground">
                  Legal Agreement
                </h2>
                <p className="text-secondary-foreground/80 mt-1 text-sm">
                  Please read each document carefully and check each box before proceeding to payment.
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Document Accordions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Expand each document to read it in full:
                  </p>
                  {LEGAL_DOCUMENTS.map((doc) => (
                    <LegalDocAccordion
                      key={doc.id}
                      doc={doc}
                      isOpen={openDocId === doc.id}
                      onToggle={() =>
                        setOpenDocId((prev) => (prev === doc.id ? null : doc.id))
                      }
                    />
                  ))}
                </div>

                {/* Checkboxes */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    I confirm that I have read and agree to the following:
                  </p>
                  {LEGAL_DOCUMENTS.map((doc) => {
                    const keyMap: Record<string, keyof typeof legalAcceptances> = {
                      terms: "terms",
                      userAgreement: "userAgreement",
                      disclaimer: "disclaimer",
                      privacyPolicy: "privacyPolicy",
                      refundPolicy: "refundPolicy",
                    };
                    const key = keyMap[doc.id];
                    return (
                      <label
                        key={doc.id}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                            legalAcceptances[key]
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 group-hover:border-primary/60"
                          )}
                          onClick={() => toggleAcceptance(key)}
                        >
                          {legalAcceptances[key] && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span
                          className="text-sm text-foreground leading-snug"
                          onClick={() => toggleAcceptance(key)}
                        >
                          {doc.checkboxLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Progress indicator */}
                {!allLegalAccepted && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {Object.values(legalAcceptances).filter(Boolean).length} of 5 agreements
                      checked —{" "}
                      {5 - Object.values(legalAcceptances).filter(Boolean).length} remaining
                    </span>
                  </div>
                )}
                {allLegalAccepted && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>All 5 agreements confirmed. You may proceed to payment.</span>
                  </div>
                )}

                {/* Binding acknowledgement */}
                <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
                  <p className="text-xs text-muted-foreground leading-relaxed text-center">
                    By clicking <strong className="text-foreground">"Proceed to Payment"</strong>,{" "}
                    you confirm that you have read, understood and agreed to the above
                    documents. This acceptance is legally binding. Horizon Fit records your name,
                    email, IP address, device information, and the timestamp of this acceptance
                    for legal and compliance purposes.
                  </p>
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      resetLegalAcceptances();
                      setStep(2);
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="phoenix"
                    className="flex-1"
                    disabled={!allLegalAccepted}
                    onClick={() => setStep(4)}
                  >
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
                    <p className="text-lg font-medium">{selectedProgram.name}</p>
                    <p className="text-4xl font-bold">
                      ₹{selectedProgram.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Legal acceptance confirmation summary */}
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        Legal agreements confirmed
                      </span>
                    </div>
                    <p className="text-xs text-green-600">
                      You have agreed to all 5 legal documents (Terms & Conditions, User
                      Agreement, Disclaimer, Privacy Policy, Refund Policy). Your acceptance will
                      be permanently recorded with this booking.
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
                      Login credentials sent by email
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        resetLegalAcceptances();
                        setStep(3);
                      }}
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
              <span className="font-bold text-foreground">Horizon Fit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Horizon Fit. All rights reserved.
            </p>
            <p className="text-xs text-secondary ">
              Developed by <span className="font-medium ">Javid Shariff</span>{" "}
              (Technical Lead) @ Aevon Inc
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
