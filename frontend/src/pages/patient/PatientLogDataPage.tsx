import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Droplets, Heart, Activity, Save, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { patientApi, TrackingEntry, PatientProgress } from '@/lib/api';

const metricTypes = [
  { value: 'weight', label: 'Weight', unit: 'kg', icon: Scale },
  { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets },
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Heart },
  { value: 'blood_pressure_systolic', label: 'Blood Pressure (Systolic)', unit: 'mmHg', icon: Activity },
  { value: 'blood_pressure_diastolic', label: 'Blood Pressure (Diastolic)', unit: 'mmHg', icon: Activity },
  { value: 'body_fat', label: 'Body Fat', unit: '%', icon: Scale },
];

export const PatientLogDataPage: React.FC = () => {
  const { toast } = useToast();
  const [recentEntries, setRecentEntries] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    metricType: 'weight',
    value: '',
    notes: '',
  });

  const selectedMetric = metricTypes.find((m) => m.value === formData.metricType);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await patientApi.getProgress();
        const data = response.data as PatientProgress;
        if (data.trackingData) {
          setRecentEntries(data.trackingData.slice(-10).reverse());
        }
      } catch (error) {
        // Silently fail - show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a value.',
        variant: 'destructive',
      });
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid number.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      await patientApi.logTrackingData({
        metricType: formData.metricType,
        value,
        unit: selectedMetric?.unit || '',
        notes: formData.notes || undefined,
      });

      // Add to local state
      const newEntry: TrackingEntry = {
        date: new Date().toISOString(),
        metricType: formData.metricType,
        value,
        unit: selectedMetric?.unit || '',
        notes: formData.notes,
      };
      setRecentEntries((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast({
        title: 'Data Logged',
        description: 'Your tracking data has been saved successfully.',
      });

      setFormData({ ...formData, value: '', notes: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMetricIcon = (metricType: string) => {
    const metric = metricTypes.find((m) => m.value === metricType);
    const IconComponent = metric?.icon || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getMetricLabel = (metricType: string) => {
    const metric = metricTypes.find((m) => m.value === metricType);
    return metric?.label || metricType;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Log Health Data</h1>
        <p className="mt-1 text-muted-foreground">Track your measurements and health metrics</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              New Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metricType">Metric Type</Label>
                <Select
                  value={formData.metricType}
                  onValueChange={(value) => setFormData({ ...formData, metricType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricTypes.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        <div className="flex items-center gap-2">
                          <metric.icon className="h-4 w-4" />
                          {metric.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="flex items-center gap-2">
                  {selectedMetric && <selectedMetric.icon className="h-4 w-4 text-muted-foreground" />}
                  Value ({selectedMetric?.unit || ''})
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  placeholder={`Enter ${selectedMetric?.label.toLowerCase() || 'value'}`}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this reading..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" variant="teal" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Log Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Entries</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <motion.div
                key={`${entry.date}-${entry.metricType}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-elevated">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(entry.metricType)}
                        <span className="font-semibold text-foreground">
                          {getMetricLabel(entry.metricType)}
                        </span>
                      </div>
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">{entry.value}</span>
                      <span className="text-sm text-muted-foreground">{entry.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-muted-foreground italic">"{entry.notes}"</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No entries yet</p>
                <p className="text-sm text-muted-foreground">Start logging your health metrics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};
