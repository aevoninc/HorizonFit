import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Percent, Activity, Save, Loader2, Info, AlertTriangle, Lock, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BodyMetrics } from '@/lib/normalPlanTypes';

interface MetricsInputCardProps {
  currentZone: number;
  onSubmit: (metrics: Omit<BodyMetrics, 'id' | 'loggedAt'>) => Promise<void>;
  latestMetrics?: BodyMetrics;
  videosCompleted?: boolean;
  canEnterMetrics?: boolean;
  daysUntilNextEntry?: number;
  onWatchVideos?: () => void;
}

export const MetricsInputCard: React.FC<MetricsInputCardProps> = ({
  currentZone,
  onSubmit,
  latestMetrics,
  videosCompleted = true,
  canEnterMetrics = true,
  daysUntilNextEntry = 0,
  onWatchVideos,
}) => {
  const [weight, setWeight] = useState(latestMetrics?.weight?.toString() || '');
  const [bodyFat, setBodyFat] = useState(latestMetrics?.bodyFatPercentage?.toString() || '');
  const [visceralFat, setVisceralFat] = useState(latestMetrics?.visceralFat?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const handleSubmitClick = () => {
    if (!weight || !bodyFat || !visceralFat) return;
    // Show warning popup before submission
    setShowWarningDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowWarningDialog(false);
    setIsSubmitting(true);
    try {
      await onSubmit({
        weight: parseFloat(weight),
        bodyFatPercentage: parseFloat(bodyFat),
        visceralFat: parseFloat(visceralFat),
        zoneNumber: currentZone,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = weight && bodyFat && visceralFat && 
    parseFloat(weight) > 0 && 
    parseFloat(bodyFat) >= 0 && parseFloat(bodyFat) <= 60 &&
    parseFloat(visceralFat) >= 1 && parseFloat(visceralFat) <= 59;

  // Video Lock - Must watch videos first
  if (!videosCompleted) {
    return (
      <Card className="card-elevated border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
            <Video className="h-5 w-5" />
            Watch Videos First
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">Videos Required</p>
              <p className="text-sm text-amber-700 mt-1">
                You must watch all required zone videos before you can enter your body metrics. 
                This ensures you understand the program guidelines for this zone.
              </p>
            </div>
          </div>
          {onWatchVideos && (
            <Button onClick={onWatchVideos} className="w-full gradient-phoenix text-primary-foreground">
              <Video className="mr-2 h-4 w-4" />
              Watch Zone Videos
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Weekly Limit - Can only enter once per week
  if (!canEnterMetrics && daysUntilNextEntry > 0) {
    return (
      <Card className="card-elevated border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
            <Scale className="h-5 w-5" />
            Metrics Logged
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-blue-800 font-medium">Weekly Entry Limit</p>
              <p className="text-sm text-blue-700 mt-1">
                You can enter your body metrics once per week. Your next entry will be available in{' '}
                <span className="font-bold">{daysUntilNextEntry} day{daysUntilNextEntry !== 1 ? 's' : ''}</span>.
              </p>
            </div>
          </div>
          {latestMetrics && (
            <div className="rounded-lg bg-white p-4 border border-blue-100">
              <p className="text-xs text-muted-foreground mb-2">Last Entry</p>
              <div className="grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Weight:</span>{' '}
                  <span className="font-semibold">{latestMetrics.weight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Body Fat:</span>{' '}
                  <span className="font-semibold">{latestMetrics.bodyFatPercentage}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Visceral:</span>{' '}
                  <span className="font-semibold">{latestMetrics.visceralFat}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-secondary" />
            Log Your Body Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Enter your measurements from a BMI scale. These values help us calculate your personalized recommendations.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Weight Input */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Body Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="30"
                max="300"
                placeholder="e.g., 75.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-lg font-medium"
              />
            </motion.div>

            {/* Body Fat Input */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="bodyFat" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Body Fat (%)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Healthy ranges: Men 10-20%, Women 18-28%
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                min="3"
                max="60"
                placeholder="e.g., 22.5"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="text-lg font-medium"
              />
            </motion.div>

            {/* Visceral Fat Input */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="visceralFat" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Visceral Fat (1-59)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        1-9: Healthy | 10-14: Moderate | 15+: High
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="visceralFat"
                type="number"
                step="1"
                min="1"
                max="59"
                placeholder="e.g., 8"
                value={visceralFat}
                onChange={(e) => setVisceralFat(e.target.value)}
                className="text-lg font-medium"
              />
            </motion.div>
          </div>

          {latestMetrics && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Last logged: {new Date(latestMetrics.loggedAt).toLocaleDateString()} - 
                Weight: {latestMetrics.weight}kg, Body Fat: {latestMetrics.bodyFatPercentage}%, 
                Visceral: {latestMetrics.visceralFat}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSubmitClick} 
            disabled={!isValid || isSubmitting}
            className="w-full gradient-phoenix text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Metrics & Update Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Entry
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              <span className="font-semibold text-foreground block mb-2">
                You can only enter metrics once per week.
              </span>
              <span className="text-muted-foreground">
                After submitting, you won't be able to update these values for 7 days. 
                Please make sure your measurements are accurate.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/50 p-4 my-2">
            <p className="text-sm font-medium mb-2">Your values:</p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-semibold">{weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Body Fat:</span>
                <span className="font-semibold">{bodyFat}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visceral Fat:</span>
                <span className="font-semibold">{visceralFat}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} className="gradient-phoenix text-primary-foreground">
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
