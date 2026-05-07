import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Flame,
  Loader2,
  PartyPopper,
  BookOpen,
  Droplets,
  Salad,
  Dumbbell,
  Moon,
  Brain,
  X,
  Target,
  Send,
  Video,
  Activity,
  CalendarCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { patientApi, HabitCode, HABIT_CODES, ProgramStatus, HabitGuide } from "@/lib/api";
import { normalPlanPatientApi } from "@/lib/normalPlanApi";
import { NormalPlanProgress, BodyMetrics, WeeklyLog } from "@/lib/normalPlanTypes";

import { GuideModal, HABIT_META } from "@/components/normalplan/GuideModal";
import { getZoneName, getZoneMotivation } from "@/lib/zoneUtils";

// Components for other features
import { ZoneNavigator } from "@/components/normalplan/ZoneNavigator";
import { ZoneVideoPlayer } from "@/components/normalplan/ZoneVideoPlayer";
import { MetricsInputCard } from "@/components/normalplan/MetricsInputCard";
import { WeeklyLogForm } from "@/components/normalplan/WeeklyLogForm";

// ─── Main Page ────────────────────────────────────────────────────────────────

export const PatientTasksPage: React.FC = () => {
  const { toast } = useToast();

  const [programStatus, setProgramStatus] = useState<ProgramStatus>({
    currentZone: 1,
    currentDay: 1,
    totalDaysInZone: 21,
    started: false,
  });

  const [habitDetails, setHabitDetails] = useState<Record<HabitCode, {
    completedTasks: string[],
    mainTicked: boolean,
    totalTasksCount?: number // We'll try to guess or fetch this
  }>>({
    Hydration: { completedTasks: [], mainTicked: false },
    Nutrition: { completedTasks: [], mainTicked: false },
    Exercise: { completedTasks: [], mainTicked: false },
    Sleep: { completedTasks: [], mainTicked: false },
    Mindset: { completedTasks: [], mainTicked: false },
  });

  const [localSelections, setLocalSelections] = useState<Record<HabitCode, boolean>>({
    Hydration: false,
    Nutrition: false,
    Exercise: false,
    Sleep: false,
    Mindset: false,
  });

  const [submittedToday, setSubmittedToday] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guideHabit, setGuideHabit] = useState<HabitCode | null>(null);
  const [mood, setMood] = useState<string>("good");
  const [notes, setNotes] = useState<string>("");
  const [selectedViewerZone, setSelectedViewerZone] = useState<number>(1);

  // Normal Plan Progress (for videos, logs, etc)
  const [npProgress, setNpProgress] = useState<NormalPlanProgress | null>(null);
  const [canEnterMetrics, setCanEnterMetrics] = useState(false);
  const [daysUntilNextMetrics, setDaysUntilNextMetrics] = useState(0);

  const completedCount = Object.values(localSelections).filter(Boolean).length;
  const progressPercent = (programStatus.currentDay / programStatus.totalDaysInZone) * 100;

  const loadData = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [statusRes, habitsRes, npRes] = await Promise.all([
        patientApi.getProgramStatus(),
        patientApi.getTodayHabits(),
        normalPlanPatientApi.getProgress(),
      ]);
      console.log(statusRes)
      console.log("habitsRes", habitsRes)
      console.log(npRes)
      setProgramStatus(statusRes.data);
      setSubmittedToday(habitsRes.data.submitted);
      setNpProgress(npRes.data);
      setCanEnterMetrics(npRes.data.canEnterMetrics);
      setDaysUntilNextMetrics(npRes.data.daysUntilNextMetrics);
      setSelectedViewerZone(statusRes.data.currentZone);

      const selections: any = {};
      const details: any = {};
      habitsRes?.data?.habits?.forEach(h => {
        selections[h.habitCode] = h.completed || h.mainTicked || h.completedTasks?.length > 0;
        details[h.habitCode] = {
          completedTasks: h.completedTasks || [],
          mainTicked: h.mainTicked || false,
        };
      });
      setLocalSelections(selections);
      setHabitDetails(details);
    } catch (err) {
      // console.log(err)
      toast({ title: err.message, variant: "destructive" });
      toast({ title: "Failed to load dashboard", variant: "destructive" });
    } finally {
      setLoadingPage(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitDaily = async () => {
    if (submittedToday) return;
    setSubmitting(true);
    try {
      const completedHabits = HABIT_CODES.filter(code => localSelections[code]);
      const detailsArray = HABIT_CODES.map(code => ({
        habitCode: code,
        completedTasks: habitDetails[code].completedTasks,
        mainTicked: habitDetails[code].mainTicked
      }));
      await patientApi.submitHabits(completedHabits, detailsArray, notes, mood);
      setSubmittedToday(true);
      toast({ title: "Awesome! Habits submitted.", description: "Keep up the momentum!" });
      loadData(); // refresh status
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.response?.data?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoComplete = async (videoId: string) => {
    try {
      await normalPlanPatientApi.markVideoWatched(videoId);
      loadData();
      toast({ title: "Video marked as watched!" });
    } catch {
      toast({ title: "Failed to update video status", variant: "destructive" });
    }
  };

  const handleMetricsSubmit = async (metrics: Omit<BodyMetrics, 'id' | 'loggedAt'>) => {
    try {
      await normalPlanPatientApi.submitMetrics(metrics);
      toast({ title: "Metrics saved successfully!" });
      loadData();
    } catch {
      toast({ title: "Failed to save metrics", variant: "destructive" });
    }
  };

  const handleWeeklyLogSubmit = async (log: Omit<WeeklyLog, 'id' | 'submittedAt'>) => {
    try {
      await normalPlanPatientApi.submitWeeklyLog(log);
      toast({ title: "Weekly log submitted!", description: "Keep going!" });
      loadData();
    } catch {
      toast({ title: "Failed to submit weekly log", variant: "destructive" });
    }
  };

  if (loadingPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-secondary mx-auto" />
          <p className="text-muted-foreground">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  const currentViewerZoneData = npProgress?.zones.find(z => z.zoneNumber === selectedViewerZone);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Transformation Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your journey, Your progress, Your victory.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Zone Navigator */}
      <ZoneNavigator
        zones={npProgress?.zones || []}
        activeZone={selectedViewerZone}
        onZoneSelect={setSelectedViewerZone}
      />

      {/* Main Tabs */}
      <Tabs defaultValue="habits" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full h-14 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="habits" className="rounded-xl gap-2 font-bold data-[state=active]:shadow-lg">
            <Target className="h-4 w-4" /> Habits
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-xl gap-2 font-bold data-[state=active]:shadow-lg">
            <Video className="h-4 w-4" /> Videos
          </TabsTrigger>
          {/* <TabsTrigger value="metrics" className="rounded-xl gap-2 font-bold data-[state=active]:shadow-lg">
            <Activity className="h-4 w-4" /> Metrics
          </TabsTrigger> */}
          <TabsTrigger value="weekly" className="rounded-xl gap-2 font-bold data-[state=active]:shadow-lg">
            <CalendarCheck className="h-4 w-4" /> Weekly Log
          </TabsTrigger>
        </TabsList>

        {/* ─── Habits Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="habits" className="space-y-6 focus-visible:outline-none">
          {/* Zone + Day Stat Card */}
          <Card className="card-elevated overflow-hidden border-none shadow-2xl">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-white">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                    <Flame className="h-8 w-8 text-yellow-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-white/70">Current Phase</p>
                    <div className="flex flex-col">
                      <h2 className="text-4xl font-black drop-shadow-md">
                        Zone {programStatus.currentZone}: {getZoneName(programStatus.currentZone)}
                      </h2>
                      <p className="text-white/80 font-medium italic mt-1">
                        "{getZoneMotivation(programStatus.currentZone)}"
                      </p>
                      <span className="text-lg font-medium text-white/90">
                        Day {programStatus.currentDay}/21
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-white/80">
                    <span>PROGRESS</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur-sm border border-white/10">
                    <motion.div
                      className="h-full rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {submittedToday && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="bg-gradient-to-r from-orange-600 to-rose-500 px-8 py-3 flex items-center gap-3 overflow-hidden text-white"
                  >
                    <CheckCircle className="h-5 w-5 text-yellow-200" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Today's session completed! 🔥
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Daily Checklist</h3>
            <div className="grid gap-3">
              {HABIT_CODES.map((code, idx) => {
                const meta = HABIT_META[code];
                const isSelected = localSelections[code];

                return (
                  <motion.div
                    key={code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`group relative transition-all duration-300 border-2 overflow-hidden ${isSelected ? `${meta.border} bg-gradient-to-r ${meta.bgGradient} ring-2 ring-emerald-500/20` : "border-transparent bg-white hover:border-muted-foreground/20"
                      }`}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Checkbox
                            id={`habit-${code}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (submittedToday) return;
                              setLocalSelections(prev => ({ ...prev, [code]: !!checked }));
                              setHabitDetails(prev => ({
                                ...prev,
                                [code]: { ...prev[code], mainTicked: !!checked }
                              }));
                            }}
                            disabled={submittedToday}
                            className="h-7 w-7 rounded-lg border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all scale-110"
                          />

                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'bg-muted/50'}`}>
                              <span className="text-xl">{meta.emoji}</span>
                            </div>
                            <div>
                              <label htmlFor={`habit-${code}`} className={`font-bold text-lg leading-none cursor-pointer ${submittedToday ? 'opacity-50' : ''}`}>
                                {code}
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">{meta.description}</p>
                                {habitDetails[code]?.completedTasks?.length > 0 && (
                                  <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">
                                    {habitDetails[code].completedTasks.length} tasks done
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs font-bold text-muted-foreground hover:bg-black/5 rounded-full"
                          onClick={() => setGuideHabit(code)}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          View Guide
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {!submittedToday ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-elevated">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">How are you feeling?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center gap-2">
                      {[
                        { val: 'terrible', label: '😫' },
                        { val: 'bad', label: '🙁' },
                        { val: 'okay', label: '😐' },
                        { val: 'good', label: '🙂' },
                        { val: 'great', label: '😁' }
                      ].map((m) => (
                        <button
                          key={m.val}
                          onClick={() => setMood(m.val)}
                          className={`flex-1 aspect-square rounded-2xl text-2xl transition-all ${mood === m.val ? 'bg-secondary text-white scale-110 shadow-lg' : 'bg-muted/50 hover:bg-muted grayscale opacity-60'
                            }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Any notes for today?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      placeholder="How was your workout? Any challenges?"
                      className="w-full h-24 rounded-xl border-2 border-muted bg-muted/20 p-3 text-sm focus:border-secondary outline-none transition-all resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </CardContent>
                </Card>
              </div>

              <Button
                size="lg"
                className="w-full h-16 text-xl font-black rounded-3xl gradient-phoenix shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
                onClick={handleSubmitDaily}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Send className="mr-3 h-6 w-6" />}
                COMPLETE SESSION
              </Button>
            </motion.div>
          ) : (
            <Card className="rounded-3xl bg-emerald-50 border-2 border-emerald-100 p-8 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-2xl font-black text-emerald-900">Great Job Today!</h3>
              <p className="text-emerald-700 font-medium tracking-tight">Your habits are locked in. Tomorrow will be Day {programStatus.currentDay + 1}.</p>
            </Card>
          )}
        </TabsContent>

        {/* ─── Videos Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="videos" className="focus-visible:outline-none">
          <ZoneVideoPlayer
            videos={currentViewerZoneData?.requiredVideos || []}
            zoneName={currentViewerZoneData?.zoneName || getZoneName(selectedViewerZone)}
            isZoneLocked={false}
            onVideoComplete={handleVideoComplete}
          />
        </TabsContent>

        {/* ─── Metrics Tab ────────────────────────────────────────────────── */}
        <TabsContent value="metrics" className="focus-visible:outline-none space-y-6">
          <MetricsInputCard
            currentZone={programStatus.currentZone}
            latestMetrics={npProgress?.latestMetrics || null}
            videosCompleted={currentViewerZoneData?.videosCompleted || false}
            canEnterMetrics={canEnterMetrics}
            daysUntilNextEntry={daysUntilNextMetrics}
            onWatchVideos={() => { }} // Could switch tab here
            onSubmit={handleMetricsSubmit}
          />
          {npProgress?.recommendations && (
            <Card className="card-elevated bg-secondary/5 border-secondary/20 border-l-4 border-l-secondary">
              <CardHeader>
                <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
                <p className="text-sm text-muted-foreground">{npProgress.recommendations.generalAdvices}</p>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* ─── Weekly Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="weekly" className="focus-visible:outline-none">
          <WeeklyLogForm
            currentZone={selectedViewerZone}
            currentWeek={npProgress?.totalWeeksCompleted ? npProgress.totalWeeksCompleted + 1 : 1}
            lastLog={npProgress?.weeklyLogs ? npProgress.weeklyLogs[npProgress.weeklyLogs.length - 1] : undefined}
            latestMetrics={npProgress?.latestMetrics || null}
            completedTasks={0} // This is the old task logic, can be 0 or calculated
            totalTasks={0}
            canSubmit={true}
            allLogs={npProgress.weeklyLogs}
            onSubmit={handleWeeklyLogSubmit}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {guideHabit && (
        <GuideModal
          habitCode={guideHabit}
          zone={programStatus.currentZone}
          completedTasks={habitDetails[guideHabit].completedTasks}
          onToggleTask={(taskName) => {
            if (submittedToday) return;
            setHabitDetails(prev => {
              const current = prev[guideHabit].completedTasks;
              const updated = current.includes(taskName)
                ? current.filter(t => t !== taskName)
                : [...current, taskName];

              // If any tasks are ticked, the main checkbox should also reflect completion/partial status
              const isAnyTicked = updated.length > 0;
              setLocalSelections(s => ({ ...s, [guideHabit]: isAnyTicked || habitDetails[guideHabit].mainTicked }));

              return {
                ...prev,
                [guideHabit]: { ...prev[guideHabit], completedTasks: updated }
              };
            });
          }}
          onClose={() => setGuideHabit(null)}
        />
      )}
    </motion.div>
  );
};
