import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, ArrowLeft, ArrowRight, Check, Loader2, Dumbbell, Target, Award } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const enrollSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EnrollFormData = z.infer<typeof enrollSchema>;

const programBenefits = [
  { icon: Dumbbell, text: '15 weeks of structured training' },
  { icon: Target, text: 'Personalized task allocation' },
  { icon: Award, text: 'Progress tracking & analytics' },
];

const PROGRAM_PRICE = 299;

export const EnrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollSchema),
  });

  const onSubmit = async (data: EnrollFormData) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: 'Enrollment Successful!',
      description: 'Please log in to access your dashboard.',
    });
    
    navigate('/auth');
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

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">Enroll in the 15-Week Program</h1>
          <p className="mt-2 text-muted-foreground">
            Start your transformation journey today
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2].map((s, i) => (
              <>
                <div
                  key={s}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step >= s ? 'gradient-phoenix' : 'bg-muted'
                  }`}
                >
                  <span className={step >= s ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'}>
                    {s}
                  </span>
                </div>
                {i < 1 && (
                  <div className={`h-1 w-16 rounded ${step >= 2 ? 'gradient-phoenix' : 'bg-muted'}`} />
                )}
              </>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Program Summary */}
          <Card className="card-elevated lg:col-span-2">
            <CardHeader>
              <CardTitle>Program Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-gradient-phoenix">${PROGRAM_PRICE}</span>
                <p className="text-muted-foreground">One-time payment</p>
              </div>

              <div className="space-y-4">
                {programBenefits.map((benefit) => (
                  <div key={benefit.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-teal">
                      <benefit.icon className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Full access to all 5 zones
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Personal dashboard & analytics
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Doctor-assigned tasks
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Lifetime access to materials
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="card-elevated lg:col-span-3">
            <CardHeader>
              <CardTitle>{step === 1 ? 'Create Your Account' : 'Complete Payment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
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
                      <Input id="phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
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
                    <Button type="button" variant="phoenix" size="lg" className="w-full" onClick={() => setStep(2)}>
                      Continue to Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="rounded-lg gradient-phoenix p-6 text-center text-primary-foreground">
                      <p className="text-lg font-medium">Total Amount</p>
                      <p className="text-4xl font-bold">${PROGRAM_PRICE}</p>
                    </div>

                    <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500" />
                        Secure payment processing
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
                          <>Complete Enrollment</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
