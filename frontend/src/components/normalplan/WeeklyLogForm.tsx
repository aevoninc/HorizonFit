import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Scale, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Loader2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { WeeklyLog, BodyMetrics, COMPLIANCE_OPTIONS } from '@/lib/normalPlanTypes';
import { useToast } from '@/hooks/use-toast';

interface WeeklyLogFormProps {
  currentZone: number;
  currentWeek: number;
  lastLog?: WeeklyLog;
  latestMetrics?: BodyMetrics;
  completedTasks: number;
  totalTasks: number;
  onSubmit: (log: Omit<WeeklyLog, 'id' | 'submittedAt'>) => Promise<void>;
  canSubmit: boolean;
  daysUntilDue?: number;
}

export const WeeklyLogForm: React.FC<WeeklyLogFormProps> = ({
  currentZone,
  currentWeek,
  lastLog,
  latestMetrics,
  completedTasks,
  totalTasks,
  onSubmit,
  canSubmit,
  daysUntilDue,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("lastLog: ",lastLog)
  const [formData, setFormData] = useState({
    weight: latestMetrics?.weight?.toString() || '',
    bodyFat: latestMetrics?.bodyFatPercentage?.toString() || '',
    visceralFat: latestMetrics?.visceralFat?.toString() || '',
    compliance: '' as WeeklyLog['compliance'] | '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.weight || !formData.bodyFat || !formData.visceralFat || !formData.compliance) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        weekNumber: currentWeek,
        zoneNumber: currentZone,
        metrics: {
          weight: parseFloat(formData.weight),
          bodyFatPercentage: parseFloat(formData.bodyFat),
          visceralFat: parseFloat(formData.visceralFat),
          loggedAt: new Date().toISOString(),
          zoneNumber: currentZone,
        },
        compliance: formData.compliance as WeeklyLog['compliance'],
        completedTasks,
        totalTasks,
        notes: formData.notes || undefined,
      });
      
      toast({
        title: 'Weekly Log Submitted!',
        description: 'Your progress has been recorded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit weekly log. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (lastLog && new Date(lastLog.submittedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
    return (
      <Card className="card-elevated border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-700">
            <CheckCircle className="h-5 w-5" />
            Weekly Log Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">
            You've already submitted your log for Week {lastLog.weekNumber}. 
            Your next log is due in {daysUntilDue || 7} days.
          </p>
<div className="mt-4 grid gap-3 sm:grid-cols-3">
  <div className="rounded-lg bg-white p-3">
    <p className="text-xs text-muted-foreground">Weight</p>
    {/* Use ?. and provide a fallback */}
    <p className="font-semibold">{lastLog?.metrics?.weight ?? '--'} kg</p>
  </div>
  <div className="rounded-lg bg-white p-3">
    <p className="text-xs text-muted-foreground">Compliance</p>
    <p className="font-semibold capitalize">{lastLog?.compliance ?? '--'}</p>
  </div>
  <div className="rounded-lg bg-white p-3">
    <p className="text-xs text-muted-foreground">Tasks</p>
    <p className="font-semibold">
      {lastLog?.completedTasks ?? 0}/{lastLog?.totalTasks ?? 0}
    </p>
  </div>
</div>
        </CardContent>
      </Card>
    );
  }

  if (!canSubmit) {
    return (
      <Card className="card-elevated border-yellow-200 bg-yellow-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            Weekly Log Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">
            Complete the required zone videos and log your body metrics before submitting your weekly log.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-secondary" />
            Week {currentWeek} Log
          </CardTitle>
          <Badge variant="outline">Zone {currentZone}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Section */}
        <div>
          <Label className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Scale className="h-4 w-4 text-primary" />
            Updated Body Metrics
          </Label>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="logWeight">Weight (kg)</Label>
              <Input
                id="logWeight"
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logBodyFat">Body Fat (%)</Label>
              <Input
                id="logBodyFat"
                type="number"
                step="0.1"
                placeholder="e.g., 22.5"
                value={formData.bodyFat}
                onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logVisceralFat">Visceral Fat</Label>
              <Input
                id="logVisceralFat"
                type="number"
                step="1"
                placeholder="e.g., 8"
                value={formData.visceralFat}
                onChange={(e) => setFormData({ ...formData, visceralFat: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Compliance Section */}
        <div>
          <Label className="mb-3 flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="h-4 w-4 text-primary" />
            How was your compliance this week?
          </Label>
          <RadioGroup
            value={formData.compliance}
            onValueChange={(value) => setFormData({ ...formData, compliance: value as WeeklyLog['compliance'] })}
            className="grid gap-3 sm:grid-cols-2"
          >
            {COMPLIANCE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  formData.compliance === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                    {option.label}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Tasks Summary */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tasks Completed This Week</span>
            <Badge variant="secondary">
              {completedTasks} / {totalTasks}
            </Badge>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              className="h-full gradient-phoenix"
            />
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <Label htmlFor="notes" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="How are you feeling? Any challenges or wins this week?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.weight || !formData.compliance}
          className="w-full gradient-phoenix text-primary-foreground"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Weekly Log
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
