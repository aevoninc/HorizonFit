import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Ruler, Heart, Activity, Save, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface TrackingEntry {
  date: string;
  weight: string;
  bodyFat: string;
  heartRate: string;
  notes: string;
}

const recentEntries: TrackingEntry[] = [
  { date: '2024-12-13', weight: '75.5', bodyFat: '18.2', heartRate: '68', notes: 'Feeling great after morning run' },
  { date: '2024-12-12', weight: '75.8', bodyFat: '18.4', heartRate: '72', notes: 'Rest day' },
  { date: '2024-12-11', weight: '76.0', bodyFat: '18.5', heartRate: '70', notes: 'Intense HIIT session' },
];

export const PatientLogDataPage: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    heartRate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least your weight.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Data Logged',
      description: 'Your tracking data has been saved successfully.',
    });
    setFormData({ weight: '', bodyFat: '', heartRate: '', notes: '' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Log Data</h1>
        <p className="mt-1 text-muted-foreground">Track your measurements and progress</p>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFat" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    Body Fat (%)
                  </Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    placeholder="18.5"
                    value={formData.bodyFat}
                    onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartRate" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  Resting Heart Rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="68"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="How are you feeling today?"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" variant="teal" size="lg" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Log Data
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Entries</h2>
          {recentEntries.map((entry, index) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold text-foreground">{entry.date}</span>
                    <TrendingUp className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="mb-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p className="font-semibold text-foreground">{entry.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Body Fat</p>
                      <p className="font-semibold text-foreground">{entry.bodyFat}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Heart Rate</p>
                      <p className="font-semibold text-foreground">{entry.heartRate} bpm</p>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground italic">"{entry.notes}"</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
