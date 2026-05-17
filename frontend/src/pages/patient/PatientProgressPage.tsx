import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  Target,
  Calendar,
  Loader2,
  CheckCircle2,
  Flame,
  Star,
  Heart,
  Zap,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { patientApi, HabitLog, TrackingEntry } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Friendly Zone Names ──────────────────────────────────────────────────────
const ZONE_NAMES: Record<number, { name: string; emoji: string; color: string }> = {
  1: { name: "Foundation", emoji: "🌱", color: "hsl(var(--primary))" },
  2: { name: "Momentum", emoji: "🚀", color: "hsl(var(--secondary))" },
  3: { name: "Transformation", emoji: "🔥", color: "#f97316" },
  4: { name: "Mastery", emoji: "⚡", color: "#8b5cf6" },
  5: { name: "Freedom", emoji: "🏆", color: "#10b981" },
};

// ─── Motivational message based on compliance ─────────────────────────────────
function getMotivation(compliance: number): { message: string; color: string } {
  if (compliance >= 90) return { message: "You're absolutely crushing it! 🏆", color: "text-emerald-500" };
  if (compliance >= 70) return { message: "Great work — keep the momentum going! 🔥", color: "text-orange-500" };
  if (compliance >= 50) return { message: "You're making real progress. Stay consistent! 💪", color: "text-secondary" };
  if (compliance > 0) return { message: "Every habit counts. You've got this! 🌱", color: "text-primary" };
  return { message: "Start your first log to see your journey unfold!", color: "text-muted-foreground" };
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}{p.name.includes("%") || p.name.includes("Compliance") ? "%" : ""}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
          patientApi.getProgress(),
        ]);
        setHabitLogs(habitRes.data.logs || []);
        setTrackingData(progressRes.data.trackingData || []);
      } catch {
        toast({ title: "Error", description: "Failed to load progress data.", variant: "destructive" });
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

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalDaysSubmitted = habitLogs.length;
  const totalHabitsCompleted = habitLogs.reduce((acc, log) => acc + (log.completedHabits?.length || 0), 0);
  const avgHabitsPerDay = totalDaysSubmitted > 0 ? (totalHabitsCompleted / totalDaysSubmitted).toFixed(1) : "0";
  const overallCompliance = totalDaysSubmitted > 0
    ? Math.round((totalHabitsCompleted / (totalDaysSubmitted * 5)) * 100)
    : 0;

  // Perfect days (5/5 habits)
  const perfectDaysTotal = habitLogs.filter(l => (l.completedHabits?.length || 0) === 5).length;

  const motivation = getMotivation(overallCompliance);

  // ─── Daily Habit Chart (last 7 logs) ────────────────────────────────────────
  const habitChartData = [...habitLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(log => ({
      day: new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      "Habits Done": log.completedHabits?.length || 0,
      isPerfect: (log.completedHabits?.length || 0) === 5,
    }));

  // ─── Weekly Compliance ───────────────────────────────────────────────────────
  const weeklyDataMap: Record<number, { total: number; count: number }> = {};
  habitLogs.forEach(log => {
    const weekInZone = Math.ceil((log.day || 1) / 7);
    const programWeek = ((log.zone || 1) - 1) * 3 + weekInZone;
    if (!weeklyDataMap[programWeek]) weeklyDataMap[programWeek] = { total: 0, count: 0 };
    weeklyDataMap[programWeek].total += (log.completedHabits?.length || 0);
    weeklyDataMap[programWeek].count += 1;
  });

  const weeklyTrendData = Object.entries(weeklyDataMap)
    .map(([week, stats]) => ({
      week: `Week ${week}`,
      "Compliance %": Math.round((stats.total / (stats.count * 5)) * 100),
    }))
    .sort((a, b) => parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1]));

  // ─── Health Metrics ──────────────────────────────────────────────────────────
  const metricsTrendMap: Record<string, any> = {};
  trackingData.forEach(entry => {
    const d = entry.dateRecorded || entry.date;
    const dateStr = d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A";
    if (!metricsTrendMap[dateStr]) metricsTrendMap[dateStr] = { date: dateStr, rawDate: d ? new Date(d) : new Date(0) };
    const type = entry.type || entry.metricType;
    if (type === "Weight") metricsTrendMap[dateStr]["Weight (kg)"] = entry.value;
    if (type === "bodyFatPercentage" || type === "Body Fat") metricsTrendMap[dateStr]["Body Fat (%)"] = entry.value;
  });
  const healthTrendData = Object.values(metricsTrendMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  // ─── Zone Breakdown ───────────────────────────────────────────────────────────
  const zoneProgressData = [1, 2, 3, 4, 5].map(zoneNum => {
    const logsInZone = habitLogs.filter(l => l.zone === zoneNum);
    const perfectDays = logsInZone.filter(l => (l.completedHabits?.length || 0) === 5).length;
    const completionRate = logsInZone.length > 0 ? Math.round((perfectDays / logsInZone.length) * 100) : 0;
    const zone = ZONE_NAMES[zoneNum];
    return { ...zone, zoneNum, rate: completionRate, logs: logsInZone.length };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
          <p className="mt-1 text-muted-foreground">
            See how far you've come on your health journey 💪
          </p>
        </div>
        {totalDaysSubmitted > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary">
            <Flame className="h-4 w-4" />
            {totalDaysSubmitted} days logged
          </div>
        )}
      </div>

      {/* ── Motivational Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 px-6 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
            <Star className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className={`text-lg font-bold ${motivation.color}`}>{motivation.message}</p>
            {totalDaysSubmitted > 0 && (
              <p className="text-sm text-muted-foreground">
                You've had <span className="font-semibold text-foreground">{perfectDaysTotal} perfect days</span> (5/5 habits) out of {totalDaysSubmitted} logs
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Overall Score",
            sub: "How consistently you complete habits",
            value: `${overallCompliance}%`,
            icon: <Award className="h-6 w-6 text-primary-foreground" />,
            iconBg: "gradient-phoenix shadow-phoenix",
            border: "border-l-primary",
          },
          {
            label: "Perfect Days",
            sub: "Days you completed all 5 habits",
            value: perfectDaysTotal,
            icon: <Trophy className="h-6 w-6 text-yellow-600" />,
            iconBg: "bg-yellow-100",
            border: "border-l-yellow-400",
          },
          {
            label: "Daily Average",
            sub: "Habits completed per day on average",
            value: `${avgHabitsPerDay} / 5`,
            icon: <TrendingUp className="h-6 w-6 text-secondary" />,
            iconBg: "bg-secondary/10",
            border: "border-l-secondary",
          },
          {
            label: "Weeks Active",
            sub: "Program weeks you've participated in",
            value: weeklyTrendData.length,
            icon: <Calendar className="h-6 w-6 text-primary" />,
            iconBg: "bg-primary/10",
            border: "border-l-primary/50",
          },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className={`card-elevated border-l-4 ${stat.border}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm font-medium text-foreground/80">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Daily Habit Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              Recent Habit Completions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              How many habits you completed each day (out of 5). Green bars = a perfect day! 🎉
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {habitChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitChartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} fontSize={11} axisLine={false} tickLine={false} tickFormatter={v => `${v}/5`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                    <Bar dataKey="Habits Done" radius={[6, 6, 0, 0]} barSize={36}>
                      {habitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isPerfect ? "hsl(var(--secondary))" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Heart className="h-8 w-8 opacity-30" />
                  <p className="italic">No habit logs yet — start today!</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-secondary" /> Perfect day (5/5)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-primary" /> Partial day
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Compliance */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary" />
              Weekly Habit Score
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your average habit completion across each week of the program. Aim for 100%! 🎯
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {weeklyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrendData}>
                    <defs>
                      <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} fontSize={11} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Compliance %"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCompliance)"
                      dot={{ r: 5, fill: "hsl(var(--secondary))", strokeWidth: 0 }}
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Target className="h-8 w-8 opacity-30" />
                  <p className="italic">Complete your first week to see this chart</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Health Metrics ── */}
      <Card className="card-elevated border-t-4 border-t-primary">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Body Metrics Over Time
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your weight and body fat % recorded from weekly logs. A downward trend is great progress! 📉
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium mt-2 sm:mt-0">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-primary" /> Weight (kg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-secondary" /> Body Fat (%)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {healthTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthTrendData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Weight (kg)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    connectNulls
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Body Fat (%)"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFat)"
                    connectNulls
                    dot={{ r: 4, fill: "hsl(var(--secondary))", strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-30" />
                <p className="italic">Log your weekly metrics to track your transformation</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Zone Breakdown ── */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            Your Performance by Phase
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each phase of your program shown below. The higher the %, the more days in that phase where you hit all 5 habits.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5">
            {zoneProgressData.map((zone) => {
              const circumference = 2 * Math.PI * 40; // r=40
              const strokeDash = (zone.rate / 100) * circumference;
              return (
                <motion.div
                  key={zone.zoneNum}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: zone.zoneNum * 0.08 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Circle */}
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-muted/20 stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <motion.circle
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        stroke={zone.color}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${strokeDash} ${circumference}` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold leading-tight">{zone.rate}%</span>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="text-center">
                    <p className="text-xl">{zone.emoji}</p>
                    <p className="font-semibold text-sm">{zone.name}</p>
                    {zone.logs > 0 ? (
                      <p className="text-[11px] text-muted-foreground">{zone.logs} days logged</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/50 italic">Not started</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            💡 Each percentage shows how often you achieved all 5 habits in that phase
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
