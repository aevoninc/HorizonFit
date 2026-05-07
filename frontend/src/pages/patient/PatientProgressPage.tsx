import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Target, Calendar, Loader2, CheckCircle2,Badge  } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, Legend } from "recharts";
import { patientApi, HabitLog, TrackingEntry } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const PatientProgressPage: React.FC = () => {
  const { toast } = useToast();
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [habitRes, progressRes] = await Promise.all([
          patientApi.getHabitHistory(),
          patientApi.getProgress()
        ]);
        setHabitLogs(habitRes.data.logs || []);
        // Note: trackingData mapping to match Trend Chart needs
        setTrackingData(progressRes.data.trackingData || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load progress data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  // 1. Calculate Core Stats
  const totalDaysSubmitted = habitLogs.length;
  const totalHabitsCompleted = habitLogs.reduce((acc, log) => acc + (log.completedHabits?.length || 0), 0);
  const avgHabitsPerDay = totalDaysSubmitted > 0 ? (totalHabitsCompleted / totalDaysSubmitted).toFixed(1) : "0";
  const overallCompliance = totalDaysSubmitted > 0 ? Math.round((totalHabitsCompleted / (totalDaysSubmitted * 5)) * 100) : 0;

  // 2. Day-by-Day Habit Completion (Last 7 Days)
  const habitChartData = [...habitLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString("en-US", { weekday: "short" }),
      count: log.completedHabits?.length || 0
    }));

  // 3. Zone Progress Chart (% of days with 5/5)
  const zones = [1, 2, 3, 4, 5];
  const zoneProgressData = zones.map(zoneNum => {
    const logsInZone = habitLogs.filter(l => l.zone === zoneNum);
    const perfectDays = logsInZone.filter(l => (l.completedHabits?.length || 0) === 5).length;
    const completionRate = logsInZone.length > 0 ? Math.round((perfectDays / logsInZone.length) * 100) : 0;
    
    return {
      zone: `Zone ${zoneNum}`,
      rate: completionRate,
      logs: logsInZone.length
    };
  });

  // 4. Weekly Completion Trend
  // We'll group logs by their program week: (zone-1)*3 + ceil(day/7)
  const weeklyDataMap: Record<number, { total: number; count: number }> = {};
  habitLogs.forEach(log => {
      const weekInZone = Math.ceil((log.day || 1) / 7);
      const programWeek = ((log.zone || 1) - 1) * 3 + weekInZone;
      
      if (!weeklyDataMap[programWeek]) {
          weeklyDataMap[programWeek] = { total: 0, count: 0 };
      }
      weeklyDataMap[programWeek].total += (log.completedHabits?.length || 0);
      weeklyDataMap[programWeek].count += 1;
  });

  const weeklyTrendData = Object.entries(weeklyDataMap)
    .map(([week, stats]) => ({
      week: `Week ${week}`,
      avg: Math.round((stats.total / (stats.count * 5)) * 100)
    }))
    .sort((a, b) => parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1]));

  // 5. Health Metrics Trend Processing
  // Group by date to show multiple metrics in one chart
  const metricsTrendMap: Record<string, any> = {};
  trackingData.forEach(entry => {
    const d = entry.dateRecorded || entry.date;
    const dateStr = d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A";
    if (!metricsTrendMap[dateStr]) {
      metricsTrendMap[dateStr] = { date: dateStr, rawDate: d ? new Date(d) : new Date(0) };
    }
    // Normalize type names
    const type = entry.type || entry.metricType;
    if (type === "Weight") metricsTrendMap[dateStr].weight = entry.value;
    if (type === "bodyFatPercentage" || type === "Body Fat") metricsTrendMap[dateStr].bodyFat = entry.value;
  });

  const healthTrendData = Object.values(metricsTrendMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Habit Progress</h1>
          <p className="mt-1 text-muted-foreground">
            Analysis of your consistent habits and program compliance
          </p>
        </div>
        <Badge variant="secondary" className="px-4 py-1 text-sm">
          {totalDaysSubmitted} Active Days
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallCompliance}%</p>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-teal shadow-teal">
                <CheckCircle2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalHabitsCompleted}</p>
                <p className="text-sm text-muted-foreground">Total Habits Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-l-4 border-l-secondary/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgHabitsPerDay}</p>
                <p className="text-sm text-muted-foreground">Avg Habits / Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-l-4 border-l-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {weeklyTrendData.length}
                </p>
                <p className="text-sm text-muted-foreground">Weeks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Day-by-Day Habit Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Daily Habit Performance (Last 7 Logs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {habitChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                      {habitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count === 5 ? "hsl(var(--secondary))" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground italic">
                  No habit data recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {weeklyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrendData}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                    <Area 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAvg)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground italic">
                  Complete your first week to see trends
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics Trend Section */}
      <Card className="card-elevated border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle className="text-lg">Health Metrics Trend</CardTitle>
                  <p className="text-sm text-muted-foreground">Tracking your physical transformation</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>Weight (kg)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-secondary" />
                      <span>Body Fat (%)</span>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <div className="h-80">
                  {healthTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={healthTrendData}>
                              <defs>
                                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} />
                              <YAxis fontSize={11} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                              <Area 
                                  type="monotone" 
                                  dataKey="weight" 
                                  name="Weight (kg)"
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorWeight)" 
                                  connectNulls
                              />
                              <Area 
                                  type="monotone" 
                                  dataKey="bodyFat" 
                                  name="Body Fat (%)"
                                  stroke="hsl(var(--secondary))" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorFat)" 
                                  connectNulls
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground italic">
                          Start logging your weekly metrics to see your transformation trend
                      </div>
                  )}
              </div>
          </CardContent>
      </Card>

      {/* Zone Success Chart */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Zone Success Rate (% of "Perfect Days" - 5/5 Habits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-5">
            {zoneProgressData.map((zone) => (
              <div key={zone.zone} className="flex flex-col items-center gap-3">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted/20 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <motion.circle
                      className="text-secondary stroke-current"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${(zone.rate / 100) * 251} 251` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute text-lg font-bold">{zone.rate}%</span>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{zone.zone}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{zone.logs} Logs</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
