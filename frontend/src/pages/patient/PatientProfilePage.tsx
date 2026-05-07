import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Lock, Save, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { patientApi, PatientProfile, ProgramStatus, HabitLog } from '@/lib/api';
import { getZoneName } from '@/lib/zoneUtils';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const PatientProfilePage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [programStatus, setProgramStatus] = useState<ProgramStatus | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statusRes, historyRes] = await Promise.all([
          patientApi.getProfile(),
          patientApi.getProgramStatus(),
          patientApi.getHabitHistory(),
        ]);
        
        setProfile(profileRes.data);
        setProgramStatus(statusRes.data);
        setHabitLogs(historyRes.data.logs);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    
    try {
      await patientApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'Patient';
  const displayEmail = profile?.email || user?.email || '';
  
  // Calculations for Fix 2
  const totalHabitsCompleted = habitLogs.reduce((acc, log) => acc + (log.completedHabits?.length || 0), 0);
  const totalPossibleHabits = habitLogs.length * 5;
  const overallCompletionPercent = totalPossibleHabits > 0 
    ? Math.round((totalHabitsCompleted / totalPossibleHabits) * 100) 
    : 0;

  const formattedStartDate = profile?.enrolledDate 
    ? new Date(profile.enrolledDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const currentZoneName = programStatus?.currentZone 
    ? getZoneName(programStatus.currentZone) 
    : (profile?.currentZone ? getZoneName(profile.currentZone) : null);

  const dayProgress = programStatus?.started 
    ? `Day ${programStatus.currentDay} of ${programStatus.totalDaysInZone}`
    : "Program not yet started";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">View your account details and update your password</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Info */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-secondary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-teal shadow-teal">
                <span className="text-2xl font-bold text-secondary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <p className="text-muted-foreground">Patient</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{displayEmail}</p>
                </div>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{profile.phone}</p>
                  </div>
                </div>
              )}
              {formattedStartDate && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Program Start Date</p>
                    <p className="font-medium text-foreground">{formattedStartDate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
              {currentZoneName && (
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{currentZoneName}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Zone</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-bold text-secondary">
                  {dayProgress}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Zone Progress</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{habitLogs.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Submissions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{overallCompletionPercent}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-secondary" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('currentPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" variant="teal" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
