import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Calendar, ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  consultationType: z.string().min(1, 'Please select a consultation type'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const consultationTypes = [
  { value: 'initial', label: 'Initial Assessment', price: 99, description: 'Comprehensive fitness evaluation' },
  { value: 'followup', label: 'Follow-up Session', price: 59, description: 'Progress review and adjustments' },
  { value: 'nutrition', label: 'Nutrition Consultation', price: 79, description: 'Personalized diet planning' },
];

export const BookConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      consultationType: 'initial',
    },
  });

  const selectedType = watch('consultationType');
  const selectedConsultation = consultationTypes.find((t) => t.value === selectedType);

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    
    // Simulate API calls
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: 'Booking Confirmed!',
      description: 'You will receive a confirmation email shortly.',
    });
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
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

        <form onSubmit={handleSubmit(onSubmit)}>
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
                    <Input id="phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input id="preferredDate" type="date" {...register('preferredDate')} />
                    {errors.preferredDate && <p className="text-sm text-destructive">{errors.preferredDate.message}</p>}
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
                        <span className="text-lg font-bold text-primary">${type.price}</span>
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
                  onClick={() => setStep(2)}
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
                      <span className="text-2xl font-bold text-primary">${selectedConsultation?.price}</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      Secure payment processing
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
                    <Button type="submit" variant="phoenix" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Confirm Booking</>
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
