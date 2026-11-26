import { useState, useEffect, useCallback, useMemo } from "react";
import { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
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
  FolderOpen,
  Activity,
  CalendarCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { patientApi, HabitCode, HABIT_CODES, ProgramStatus, HabitGuide } from "@/lib/api";
import { normalPlanPatientApi } from "@/lib/normalPlanApi";
import { NormalPlanProgress, BodyMetrics, WeeklyLog } from "@/lib/normalPlanTypes";

import { GuideModal, HABIT_META } from "@/components/normalplan/GuideModal";
import { getZoneName, getZoneMotivation } from "@/lib/zoneUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalZonePDFs } from "@/lib/videoAssets";

// Components for other features
import { ZoneNavigator } from "@/components/normalplan/ZoneNavigator";
import { ZoneVideoPlayer } from "@/components/normalplan/ZoneVideoPlayer";
import { MetricsInputCard } from "@/components/normalplan/MetricsInputCard";
import { WeeklyLogForm } from "@/components/normalplan/WeeklyLogForm";
import { DailyCountdown } from "@/components/normalplan/DailyCountdown";

// ─── Main Page ────────────────────────────────────────────────────────────────

export const PatientTasksPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [programStatus, setProgramStatus] = useState<ProgramStatus>({
    currentZone: 1,
    currentDay: 1,
    totalDaysInZone: 21,
    started: false,
    programDayNumber: null,
    totalProgramDays: 105,
    todayDate: "",
    todayStatus: "unavailable",
    missedDays: [],
    missedDayCount: 0,
    scheduleComplete: false,
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
  const [selectedMissedDay, setSelectedMissedDay] = useState<ProgramStatus["missedDays"][number] | null>(null);
  const [activeTab, setActiveTab] = useState("habits");
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

  const formatProgramDate = (date: string) => {
    if (!date) return "";
    const [year, month, day] = date.split("-").map(Number);
    return `${day}/${month}/${year}`;
  };

  const getProgramDateForDay = (programDayNumber: number) => {
    if (!programStatus.startDate || programDayNumber < 1) return "";
    const [year, month, day] = programStatus.startDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + programDayNumber - 1))
      .toISOString()
      .slice(0, 10);
  };

  const displayedZone = selectedMissedDay?.zone || programStatus.currentZone;
  const displayedDay = selectedMissedDay?.dayInZone || programStatus.currentDay;
  const displayedProgramDay = selectedMissedDay?.programDayNumber || programStatus.programDayNumber;
  const displayedDate = selectedMissedDay?.date || (
    programStatus.scheduleComplete || programStatus.todayStatus === "upcoming"
      ? getProgramDateForDay(displayedProgramDay || 1)
      : programStatus.todayDate
  );
  const progressPercent = displayedProgramDay
    ? (displayedProgramDay / programStatus.totalProgramDays) * 100
    : (displayedDay / programStatus.totalDaysInZone) * 100;
  const canShowHabitTasks = Boolean(selectedMissedDay) ||
    (programStatus.started && !programStatus.scheduleComplete);

  const formatSessionLabel = (date: string, day: number, zone: number) =>
    `${formatProgramDate(date)} Day ${day} Zone ${zone}`;

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
      setSelectedMissedDay(null);
      setActiveTab("habits");
      setMood("good");
      setNotes("");
      setNpProgress(npRes.data);
      setCanEnterMetrics(npRes.data.canEnterMetrics);
      setDaysUntilNextMetrics(npRes.data.daysUntilNextMetrics);
      setSelectedViewerZone(statusRes.data.currentZone);

      const selections = Object.fromEntries(
        HABIT_CODES.map((code) => [code, false]),
      ) as Record<HabitCode, boolean>;
      const details = Object.fromEntries(
        HABIT_CODES.map((code) => [code, { completedTasks: [], mainTicked: false }]),
      ) as Record<HabitCode, { completedTasks: string[]; mainTicked: boolean }>;
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

  const handleSubmitDaily = async (
    missedDay: ProgramStatus["missedDays"][number] | null = null,
  ) => {
    // if (submittedToday) return;
    setSubmitting(true);
    try {
      const completedHabits = HABIT_CODES.filter(code => localSelections[code]);
      const detailsArray = HABIT_CODES.map(code => ({
        habitCode: code,
        completedTasks: habitDetails[code].completedTasks,
        mainTicked: habitDetails[code].mainTicked
      }));
      await patientApi.submitHabits(
        completedHabits,
        detailsArray,
        notes,
        mood,
        missedDay?.date,
      );
      toast({
        title: missedDay ? "Missed session completed" : "Awesome! Habits submitted.",
        description: missedDay
          ? `Your session for ${formatSessionLabel(missedDay.date, missedDay.dayInZone, missedDay.zone)} is now recorded.`
          : "Keep up the momentum!",
      });
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof AxiosError
        ? (error.response?.data as { message?: string } | undefined)?.message
        : error instanceof Error ? error.message : undefined;
      toast({ title: "Failed to submit", description: message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMissedDay = async (missedDay: ProgramStatus["missedDays"][number]) => {
    try {
      const response = await patientApi.getHabitsForDate(missedDay.date);
      const selections: Partial<Record<HabitCode, boolean>> = {};
      const details: Partial<Record<HabitCode, { completedTasks: string[]; mainTicked: boolean }>> = {};
      response.data.habits.forEach((habit) => {
        selections[habit.habitCode] = habit.completed || habit.mainTicked || habit.completedTasks.length > 0;
        details[habit.habitCode] = {
          completedTasks: habit.completedTasks || [],
          mainTicked: habit.mainTicked || false,
        };
      });
      setLocalSelections((previous) => ({ ...previous, ...selections }));
      setHabitDetails((previous) => ({ ...previous, ...details }));
      setSubmittedToday(response.data.submitted);
      setSelectedMissedDay(missedDay);
      setSelectedViewerZone(missedDay.zone);
      setActiveTab("missed");
      setMood("good");
      setNotes("");
    } catch (error: unknown) {
      const message = error instanceof AxiosError
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast({
        title: "Could not open missed session",
        description: message || "Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToToday = async (
    nextTab = "habits",
    nextZone = programStatus.currentZone,
  ) => {
    try {
      const response = await patientApi.getTodayHabits();
      const selections: Partial<Record<HabitCode, boolean>> = {};
      const details: Partial<Record<HabitCode, { completedTasks: string[]; mainTicked: boolean }>> = {};
      response.data.habits.forEach((habit) => {
        selections[habit.habitCode] = habit.completed || habit.mainTicked || habit.completedTasks.length > 0;
        details[habit.habitCode] = {
          completedTasks: habit.completedTasks || [],
          mainTicked: habit.mainTicked || false,
        };
      });
      setLocalSelections((previous) => ({ ...previous, ...selections }));
      setHabitDetails((previous) => ({ ...previous, ...details }));
      setSubmittedToday(response.data.submitted);
      setSelectedMissedDay(null);
      setSelectedViewerZone(nextZone);
      setActiveTab(nextTab);
      setMood("good");
      setNotes("");
    } catch {
      toast({ title: "Could not load today’s session", variant: "destructive" });
    }
  };

  const handleZoneSelect = async (zoneNumber: number) => {
    if (selectedMissedDay && selectedMissedDay.zone !== zoneNumber) {
      await handleReturnToToday("missed", zoneNumber);
      return;
    }
    setSelectedViewerZone(zoneNumber);
    if (activeTab === "habits" && zoneNumber !== programStatus.currentZone) {
      const zoneHasMissedDays = programStatus.missedDays.some((day) => day.zone === zoneNumber);
      setActiveTab(zoneHasMissedDays ? "missed" : "videos");
    }
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === "habits") {
      if (selectedMissedDay) {
        void handleReturnToToday("habits");
      } else {
        setSelectedViewerZone(programStatus.currentZone);
        setActiveTab("habits");
      }
      return;
    }
    if (nextTab === "weekly" && selectedMissedDay) {
      void handleReturnToToday("weekly");
      return;
    }
    setActiveTab(nextTab);
  };

  const handleOpenMissedWeeklyReports = async () => {
    const firstMissedWeek = npProgress?.missedWeeklyWeeks?.[0];
    if (selectedMissedDay) {
      await handleReturnToToday("weekly", firstMissedWeek?.zone || programStatus.currentZone);
      return;
    }
    if (firstMissedWeek) setSelectedViewerZone(firstMissedWeek.zone);
    setActiveTab("weekly");
  };

  const handleVideoComplete = async (videoId: string) => {
    try {
      // await normalPlanPatientApi.markVideoWatched(videoId);
      // loadData();
      // toast({ title: "Video marked as watched!" });
    } catch {
      // toast({ title: "Failed to update video status", variant: "destructive" });
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
    await normalPlanPatientApi.submitWeeklyLog(log);
    loadData();
  };
  const currentViewerZoneData = npProgress?.zones.find(z => z.zoneNumber === selectedViewerZone);
  const activeJourneyZone = activeTab === "habits"
    ? programStatus.currentZone
    : activeTab === "missed" && selectedMissedDay
      ? selectedMissedDay.zone
      : selectedViewerZone;
  const habitSessionZone = selectedMissedDay?.zone || programStatus.currentZone;
  const currentZonePDFs = useMemo(() => getLocalZonePDFs(selectedViewerZone), [selectedViewerZone]);

  const isProgramCompleted = useMemo(() => {
    return Boolean(npProgress?.programCompleted || programStatus.programCompleted);
  }, [npProgress, programStatus]);

  // const isWeeklyLogGateBlocked = useMemo(() => {
  //   if (!npProgress) return false;
  //   const currentZoneLogs = (npProgress.weeklyLogs || []).filter(l => l.zoneNumber === programStatus.currentZone);
  //   if (programStatus.currentDay >= 8 && programStatus.currentDay <= 14 && currentZoneLogs.length < 1) {
  //     return true;
  //   }
  //   if (programStatus.currentDay >= 15 && programStatus.currentDay <= 21 && currentZoneLogs.length < 2) {
  //     return true;
  //   }
  //   if (programStatus.currentZone > 1 && programStatus.currentDay === 1) {
  //     const prevZoneLogs = (npProgress.weeklyLogs || []).filter(l => l.zoneNumber === programStatus.currentZone - 1);
  //     if (prevZoneLogs.length < 3) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }, [npProgress, programStatus]);

  const isWeeklyLogGateBlocked = false;

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

      {/* Zone cards */}
      <ZoneNavigator
        zones={npProgress?.zones || []}
        activeZone={activeJourneyZone}
        currentZone={programStatus.currentZone}
        onZoneSelect={handleZoneSelect}
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/50 p-1 sm:grid-cols-4">
          <TabsTrigger value="habits" className="min-h-12 rounded-xl gap-2 text-xs font-bold data-[state=active]:shadow-lg sm:text-sm">
            <Target className="h-4 w-4" /> Habits
          </TabsTrigger>
          <TabsTrigger value="missed" className="min-h-12 rounded-xl gap-2 text-xs font-bold data-[state=active]:shadow-lg sm:text-sm">
            <AlertCircle className="h-4 w-4" />
            Missed Tasks
            {programStatus.missedDayCount > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-800">
                {programStatus.missedDayCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="videos" className="min-h-12 rounded-xl gap-2 text-xs font-bold data-[state=active]:shadow-lg sm:text-sm">
            <FolderOpen className="h-4 w-4" /> Resources
          </TabsTrigger>
          {/* <TabsTrigger value="metrics" className="rounded-xl gap-2 font-bold data-[state=active]:shadow-lg">
            <Activity className="h-4 w-4" /> Metrics
          </TabsTrigger> */}
          <TabsTrigger value="weekly" className="min-h-12 rounded-xl gap-2 text-xs font-bold data-[state=active]:shadow-lg sm:text-sm">
            <CalendarCheck className="h-4 w-4" />
            Weekly Log
            {npProgress?.missedWeeklyWeeks && npProgress.missedWeeklyWeeks.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                {npProgress.missedWeeklyWeeks.length}
              </span>
            )}
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
                    <p className="text-xs uppercase tracking-widest font-bold text-white/70">
                      {selectedMissedDay
                        ? "Selected missed session"
                        : programStatus.scheduleComplete
                          ? "Last scheduled day"
                          : programStatus.todayStatus === "upcoming"
                            ? "Program starts"
                            : "Current phase"}
                    </p>
                    <div className="flex flex-col">
                      <h2 className="text-4xl font-black drop-shadow-md">
                        Zone {displayedZone}: {getZoneName(displayedZone)}
                      </h2>
                      <p className="text-white/80 font-medium italic mt-1">
                      "{getZoneMotivation(displayedZone)}"
                      </p>
                      <span className="text-lg font-semibold text-white/95">
                      {displayedProgramDay
                        ? `Program Day ${displayedProgramDay} of ${programStatus.totalProgramDays}`
                        : `Zone day ${displayedDay} of 21`}
                      </span>
                    {displayedProgramDay && (
                        <span className="text-sm text-white/80">
                        {formatSessionLabel(displayedDate, displayedDay, displayedZone)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-white/80">
                    <span>PROGRAM SCHEDULE</span>
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
                      Today’s session submitted
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {programStatus.todayStatus === "unavailable" ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-start gap-3 p-4 text-amber-950">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Program dates unavailable</p>
                  <p className="mt-1 text-sm text-amber-900">
                    Your care team needs to confirm your program start date. Your current day cannot be calculated reliably yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canShowHabitTasks && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Today’s session
                  </h3>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatSessionLabel(programStatus.todayDate, programStatus.currentDay, programStatus.currentZone)}
                  </p>
                </div>
              </div>
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
                              // if (submittedToday) return;
                              setLocalSelections(prev => ({ ...prev, [code]: !!checked }));
                              setHabitDetails(prev => ({
                                ...prev,
                                [code]: { ...prev[code], mainTicked: !!checked }
                              }));
                            }}
                            // disabled={submittedToday}

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
          )}

          {isProgramCompleted ? (
            <Card className="rounded-3xl gradient-phoenix text-white p-10 text-center space-y-4 shadow-2xl border-none">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md mx-auto shadow-inner">
                <PartyPopper className="h-10 w-10 text-yellow-200 animate-bounce" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">🎉 Congratulations! Program Completed!</h3>
              <p className="text-lg text-white/90 max-w-xl mx-auto font-medium leading-relaxed">
                You have successfully completed all 15 weeks and 5 zones of the HorizonFit transformation journey. Your dedication to your health and habits has paid off!
              </p>
              <div className="pt-2">
                <div className="inline-block bg-white/15 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-full text-sm font-extrabold uppercase tracking-widest text-yellow-200">
                  ✨ 15 Weeks Completed • Official HorizonFit Graduate
                </div>
              </div>
            </Card>
          ) : isWeeklyLogGateBlocked ? (
            <Card className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-8 text-center space-y-4 shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 mx-auto shadow-inner">
                <Activity className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-amber-950">Weekly Log Submission Required</h3>
                <p className="text-base text-amber-900 font-medium max-w-md mx-auto leading-relaxed">
                  Please complete your weekly log to proceed with your next daily habit session.
                </p>
              </div>
            </Card>
          ) : programStatus.scheduleComplete || programStatus.todayStatus === "upcoming" ? (
            <Card className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-8 text-center">
              <CalendarCheck className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {programStatus.scheduleComplete ? "Program schedule complete" : "Your program hasn’t started yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                {programStatus.scheduleComplete
                  ? `Your 105-day schedule has ended${programStatus.missedDayCount ? ` with ${programStatus.missedDayCount} missed ${programStatus.missedDayCount === 1 ? "day" : "days"}` : ""}. Contact your doctor for next steps.`
                  : "Your daily tasks will become available when your program start date arrives."}
              </p>
            </Card>
          ) : !submittedToday ? (
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
              <p className="text-emerald-700 font-medium tracking-tight">
                Your session is recorded for today. Your program day will move forward tomorrow, whether or not you submit a session.
              </p>

              <div className="pt-4">
                <div className="bg-emerald-900/5 backdrop-blur-md rounded-3xl p-6 border border-emerald-900/10">
                  <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">Time Until Next Session</h4>
                  <div className="inline-block px-8 py-4 rounded-3xl bg-emerald-900 text-white shadow-2xl">
                    <DailyCountdown />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="missed" className="space-y-6 focus-visible:outline-none">
          <Card className="border-rose-200 bg-rose-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-950">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                Missed tasks
              </CardTitle>
              <p className="text-sm text-rose-900">
                {programStatus.missedDayCount > 0
                  ? `You have ${programStatus.missedDayCount} missed ${programStatus.missedDayCount === 1 ? "day" : "days"}. Choose a zone above, then select a missed date to complete its tasks.`
                  : "You have no missed daily tasks. Your current session is available in Habits."}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Zone {selectedViewerZone}: {getZoneName(selectedViewerZone)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {programStatus.missedDays.filter((day) => day.zone === selectedViewerZone).length} missed days in this zone
                </p>
                <div className="mt-3">
                  <Select
                    value={selectedMissedDay?.zone === selectedViewerZone ? selectedMissedDay.date : ""}
                    onValueChange={(date) => {
                      const missedDay = programStatus.missedDays.find(
                        (day) => day.zone === selectedViewerZone && day.date === date,
                      );
                      if (missedDay) void handleSelectMissedDay(missedDay);
                    }}
                    disabled={!programStatus.missedDays.some((day) => day.zone === selectedViewerZone)}
                  >
                    <SelectTrigger aria-label="Select missed task date">
                      <SelectValue placeholder="Choose a missed date" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...programStatus.missedDays]
                        .filter((day) => day.zone === selectedViewerZone)
                        .sort((a, b) => b.programDayNumber - a.programDayNumber)
                        .map((day) => (
                          <SelectItem key={day.date} value={day.date}>
                            {formatSessionLabel(day.date, day.dayInZone, day.zone)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(npProgress?.missedWeeklyWeeks?.length || 0) > 0 && (
                <Card className="border-amber-200 bg-amber-50/70">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-amber-950">
                        {npProgress?.missedWeeklyWeeks?.length} missed weekly {npProgress?.missedWeeklyWeeks?.length === 1 ? "report" : "reports"}
                      </p>
                      <p className="mt-1 text-sm text-amber-900">
                        Review the scheduled week and complete overdue reports in Weekly Log.
                      </p>
                    </div>
                    <Button variant="outline" className="border-amber-300 bg-white" onClick={() => void handleOpenMissedWeeklyReports()}>
                      Review weekly reports
                    </Button>
                  </CardContent>
                </Card>
              )}

              {programStatus.missedDayCount > 0 &&
                !programStatus.missedDays.some((day) => day.zone === selectedViewerZone) && (
                  <p className="rounded-xl border border-dashed border-rose-300 bg-white/70 p-4 text-sm text-muted-foreground">
                    There are no missed tasks in Zone {selectedViewerZone}. Choose another zone above to review its missed days.
                  </p>
                )}

              {selectedMissedDay && selectedMissedDay.zone === selectedViewerZone && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div>
                      <p className="font-semibold text-foreground">Selected missed session</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSessionLabel(selectedMissedDay.date, selectedMissedDay.dayInZone, selectedMissedDay.zone)}
                        {" · "}Program Day {selectedMissedDay.programDayNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saving this session will not change your current program day.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => void handleReturnToToday()}>
                      Return to today
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {HABIT_CODES.map((code) => {
                      const meta = HABIT_META[code];
                      const isSelected = localSelections[code];
                      return (
                        <Card key={code} className={`border-2 ${isSelected ? `${meta.border} ${meta.bgGradient}` : "border-transparent bg-white"}`}>
                          <CardContent className="flex items-center justify-between gap-4 p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`missed-habit-${code}`}
                                checked={isSelected}
                                disabled={submittedToday}
                                onCheckedChange={(checked) => {
                                  setLocalSelections((previous) => ({ ...previous, [code]: !!checked }));
                                  setHabitDetails((previous) => ({
                                    ...previous,
                                    [code]: { ...previous[code], mainTicked: !!checked },
                                  }));
                                }}
                              />
                              <div>
                                <label htmlFor={`missed-habit-${code}`} className="font-semibold text-foreground">
                                  {meta.emoji} {code}
                                </label>
                                <p className="text-xs text-muted-foreground">{meta.description}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setGuideHabit(code)}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              View guide
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">How were you feeling?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between gap-2">
                          {[
                            { val: "terrible", label: "😫" },
                            { val: "bad", label: "🙁" },
                            { val: "okay", label: "😐" },
                            { val: "good", label: "🙂" },
                            { val: "great", label: "😁" },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              disabled={submittedToday}
                              aria-label={item.val}
                              aria-pressed={mood === item.val}
                              onClick={() => setMood(item.val)}
                              className={`flex-1 rounded-xl py-3 text-xl ${mood === item.val ? "bg-secondary text-white" : "bg-muted/50"}`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Notes for this session</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <textarea
                          placeholder="Add a note about this make-up session..."
                          disabled={submittedToday}
                          className="h-24 w-full resize-none rounded-xl border bg-background p-3 text-sm"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    size="lg"
                    className="w-full rounded-2xl gradient-phoenix text-lg font-bold"
                    onClick={() => handleSubmitDaily(selectedMissedDay)}
                    disabled={submitting || submittedToday}
                  >
                    {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                    {submittedToday ? "SESSION ALREADY RECORDED" : "SAVE MISSED SESSION"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Videos Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="videos" className="focus-visible:outline-none">
          <ZoneVideoPlayer
            videos={currentViewerZoneData?.requiredVideos || []}
            pdfs={currentZonePDFs}
            zoneName={currentViewerZoneData?.zoneName || getZoneName(selectedViewerZone)}
            isZoneLocked={false}
            onVideoComplete={handleVideoComplete}
            patientCategory={user?.assignedCategory}
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
            currentWeek={selectedViewerZone === programStatus.currentZone
              ? Math.min(3, Math.max(1, Math.ceil(programStatus.currentDay / 7)))
              : Math.min(3, (npProgress?.weeklyLogs?.filter((l) => l.zoneNumber === selectedViewerZone)?.length || 0) + 1)}
            programStartDate={programStatus.startDate}
            missedWeeks={npProgress?.missedWeeklyWeeks?.filter((week) => week.zone === selectedViewerZone) || []}
            userCurrentDay={programStatus.currentDay}
            userCurrentZone={programStatus.currentZone}
            lastLog={npProgress?.weeklyLogs ? npProgress.weeklyLogs[npProgress.weeklyLogs.length - 1] : undefined}
            latestMetrics={npProgress?.latestMetrics || null}
            completedTasks={0} // This is the old task logic, can be 0 or calculated
            totalTasks={0}
            canSubmit={true}
            allLogs={npProgress?.weeklyLogs || []}
            onZoneChange={setSelectedViewerZone}
            onSubmit={handleWeeklyLogSubmit}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {guideHabit && (
        <GuideModal
          habitCode={guideHabit}
          zone={habitSessionZone}
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
