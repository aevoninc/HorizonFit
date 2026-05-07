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
  allLogs: WeeklyLog[];
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
  allLogs = [],
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Sort logs by date (newest first)
  const sortedLogs = [...allLogs].sort((a, b) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const mostRecentLog = sortedLogs[0];
  const submittedDate = mostRecentLog ? new Date(mostRecentLog.submittedAt) : null;
  const daysSinceLastLog = submittedDate 
    ? Math.floor((Date.now() - submittedDate.getTime()) / (24 * 60 * 60 * 1000)) 
    : null;
  
  // A log is due if there are no logs or if 7 days have passed
  const daysUntilDueCalculated = daysSinceLastLog !== null ? Math.max(0, 7 - daysSinceLastLog) : 0;
  const isDue = mostRecentLog ? daysUntilDueCalculated === 0 : true;

  const renderLogCard = (log: WeeklyLog, index: number) => {
    const logDate = new Date(log.submittedAt);
    const formattedDate = logDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <Card key={log.id || index} className="card-elevated border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700">
              <CheckCircle className="h-5 w-5" />
              Weekly Log Submitted
            </CardTitle>
            <Badge variant="outline" className="border-green-200 text-green-700">Week {log.weekNumber || (sortedLogs.length - index)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Submitted on:</p>
              <p className="text-base font-semibold text-green-700">{formattedDate}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Zone {log.zoneNumber}</Badge>
          </div>
          
          {index === 0 && daysUntilDueCalculated !== null && daysUntilDueCalculated > 0 && (
            <div className="rounded-lg bg-green-100/50 p-4 border border-green-200 shadow-sm">
              <p className="text-green-800 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Next log due in <span className="text-2xl font-black text-green-600">{daysUntilDueCalculated}</span> {daysUntilDueCalculated === 1 ? 'day' : 'days'}
              </p>
            </div>
          )}

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Weight</p>
              <p className="text-xl font-bold text-foreground">{log.metrics?.weight ?? '--'} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Body Fat</p>
              <p className="text-xl font-bold text-foreground">{log.metrics?.bodyFatPercentage ?? '--'} <span className="text-sm font-normal text-muted-foreground">%</span></p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Visceral Fat</p>
              <p className="text-xl font-bold text-foreground">{log.metrics?.visceralFat ?? '--'}</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Compliance</p>
              <p className="text-xl font-bold capitalize text-foreground">{log.compliance ?? '--'}</p>
            </div>
          </div>

          {log.notes && (
            <div className="rounded-xl bg-white p-4 border border-border/30 italic text-sm text-muted-foreground relative overflow-hidden shadow-inner">
               <div className="absolute top-0 left-0 w-1 h-full bg-green-200" />
              "{log.notes}"
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-10 group">
      {/* 1. Submission Section (Form or Required Message) */}
      {isDue && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">New Weekly Submission</h3>
          </div>
          
          {!canSubmit ? (
            <Card className="card-elevated border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                  Prerequisites Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                   <div className="rounded-full bg-amber-100 p-2 mt-1">
                      <Scale className="h-4 w-4 text-amber-600" />
                   </div>
                   <p className="text-amber-800 leading-relaxed">
                     Please complete your **required zone videos** and log your **body metrics** in the overview tab before you can submit your weekly progress log.
                   </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-elevated border-primary/20 overflow-hidden">
              <div className="h-1.5 w-full gradient-phoenix" />
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <Calendar className="h-6 w-6 text-secondary" />
                      Week {currentWeek} Progress Report
                    </CardTitle>
                    <Badge variant="secondary" className="px-3 py-1">Zone {currentZone}</Badge>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold self-start border border-amber-100">
                    <AlertCircle className="h-3 w-3" />
                    <span>7-Day Update Due Now</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Metrics Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    <Scale className="h-4 w-4" />
                    Physical Measurements
                  </Label>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="logWeight" className="text-xs">Weight (kg)</Label>
                      <Input
                        id="logWeight"
                        type="number"
                        step="0.1"
                        placeholder="75.5"
                        value={formData.weight}
                        className="h-12 text-lg font-bold"
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logBodyFat" className="text-xs">Body Fat (%)</Label>
                      <Input
                        id="logBodyFat"
                        type="number"
                        step="0.1"
                        placeholder="22.5"
                        value={formData.bodyFat}
                        className="h-12 text-lg font-bold"
                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logVisceralFat" className="text-xs">Visceral Fat</Label>
                      <Input
                        id="logVisceralFat"
                        type="number"
                        step="1"
                        placeholder="8"
                        value={formData.visceralFat}
                        className="h-12 text-lg font-bold"
                        onChange={(e) => setFormData({ ...formData, visceralFat: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    <CheckCircle className="h-4 w-4" />
                    Program Compliance
                  </Label>
                  <RadioGroup
                    value={formData.compliance}
                    onValueChange={(value) => setFormData({ ...formData, compliance: value as WeeklyLog['compliance'] })}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {COMPLIANCE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={`group/item flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                          formData.compliance === option.value
                            ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}
                        onClick={() => setFormData({ ...formData, compliance: option.value as WeeklyLog['compliance'] })}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <div className={`h-4 w-4 rounded-full border-2 border-muted-foreground group-data-[state=checked]/item:border-primary group-data-[state=checked]/item:bg-primary`} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer font-bold">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Tasks Summary */}
                <div className="rounded-2xl bg-muted/30 p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-black text-foreground">Weekly Completion</p>
                      <p className="text-xs text-muted-foreground">Habit tracking for current week</p>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
                      {completedTasks} / {totalTasks}
                    </Badge>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                      className="h-full gradient-phoenix"
                    />
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-black text-muted-foreground uppercase tracking-widest">
                    <FileText className="h-4 w-4" />
                    Additional Reflections
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Share your challenges, wins, or any adjustments you've made this week... We're listening!"
                    value={formData.notes}
                    className="min-h-[120px] text-base resize-none rounded-xl"
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.weight || !formData.compliance}
                  className="w-full h-14 text-lg font-black gradient-phoenix text-primary-foreground rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Saving Progress...
                    </>
                  ) : (
                    <>
                      <Send className="mr-3 h-6 w-6" />
                      Lock in Weekly Log
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 2. Logs List */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 px-2">
            <FileText className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">Progress Timeline</h3>
        </div>
        
        {sortedLogs.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:left-[1.35rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-green-200 before:via-green-100 before:to-transparent">
            {sortedLogs.map((log, index) => (
               <div key={log.id || index} className="pl-4">
                  {renderLogCard(log, index)}
               </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="font-bold text-lg">No Journey Records Yet</p>
            <p className="text-sm max-w-xs mx-auto mt-2">
               Once you submit your first weekly log, it will appear here as part of your physical transformation timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
