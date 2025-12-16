import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { patientApi, PatientProgress, TrackingEntry } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export const PatientProgressPage: React.FC = () => {
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<PatientProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await patientApi.getProgress();
        setProgressData(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load progress data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const masterTasks = progressData?.masterTasks || { total: 50, completed: 42 };
  const overallCompliance = masterTasks.total > 0 
    ? Math.round((masterTasks.completed / masterTasks.total) * 100) 
    : 0;

  const trackingData = progressData?.trackingData || [];
  const weeklyProgress = progressData?.weeklyProgress || [];
  const zoneProgress = progressData?.zoneProgress || [
    { zone: 'Zone 1', tasks: 10, completed: 10 },
    { zone: 'Zone 2', tasks: 10, completed: 7 },
    { zone: 'Zone 3', tasks: 10, completed: 3 },
    { zone: 'Zone 4', tasks: 10, completed: 0 },
    { zone: 'Zone 5', tasks: 10, completed: 0 },
  ];

  const complianceData = [
    { name: 'Completed', value: masterTasks.completed, color: 'hsl(16, 85%, 55%)' },
    { name: 'Pending', value: masterTasks.total - masterTasks.completed, color: 'hsl(var(--muted))' },
  ];

  // Process tracking data for health trends chart
  const healthTrends = trackingData
    .filter((entry: TrackingEntry) => entry.metricType === 'weight')
    .slice(-7)
    .map((entry: TrackingEntry) => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: entry.value,
    }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress History</h1>
        <p className="mt-1 text-muted-foreground">Track your fitness journey and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallCompliance}%</p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-teal shadow-teal">
                <Target className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{masterTasks.completed}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Zone {progressData?.currentZone || 1}</p>
                <p className="text-sm text-muted-foreground">Current Zone</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{weeklyProgress.length || 0}</p>
                <p className="text-sm text-muted-foreground">Weeks Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Tasks Progress Bar */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Overall Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {masterTasks.completed} of {masterTasks.total} tasks completed
              </span>
              <span className="font-medium text-foreground">{overallCompliance}%</span>
            </div>
            <Progress value={overallCompliance} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Completion Trend */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {weeklyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyProgress}>
                    <defs>
                      <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completion"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={3}
                      fill="url(#completionGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No weekly data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Pie Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Task Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              {complianceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Progress & Health Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Zone Progress */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Zone Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {zoneProgress.map((zone) => {
              const percent = zone.tasks > 0 ? Math.round((zone.completed / zone.tasks) * 100) : 0;
              return (
                <div key={zone.zone} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{zone.zone}</span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className={`h-full rounded-full ${
                        percent === 100 ? 'gradient-phoenix' : 'gradient-teal'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Health Trends */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Health Trends (Weight)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {healthTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No health data logged yet. Start logging your metrics!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
