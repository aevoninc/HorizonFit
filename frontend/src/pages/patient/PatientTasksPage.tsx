import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Lock,
  Target,
  Flame,
  Loader2,
  PartyPopper,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { patientApi, ZoneTask, Task } from "@/lib/api";
import { AxiosError } from "axios";

interface ZoneState {
  zone: number;
  title: string;
  accessible: boolean;
  data?: ZoneTask;
  loading: boolean;
  error?: string;
}

const zoneNames = [
  "Foundation",
  "Progression",
  "Endurance",
  "Mastery",
  "Excellence",
];
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PatientTasksPage: React.FC = () => {
  const [zones, setZones] = useState<ZoneState[]>(
    [1, 2, 3, 4, 5].map((zone) => ({
      zone,
      title: zoneNames[zone - 1],
      accessible: zone === 1,
      loading: false,
    }))
  );
  const [activeZone, setActiveZone] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0);
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextRequiredZone, setNextRequiredZone] = useState<number | null>(null);
  const [programCompleted, setProgramCompleted] = useState(false);
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchZoneTasks = useCallback(async (zoneNumber: number) => {
    setZones((prev) =>
      prev.map((z) =>
        z.zone === zoneNumber ? { ...z, loading: true, error: undefined } : z
      )
    );
    try {
      const response = await patientApi.getZoneTasks(zoneNumber);
      console.log("Fetched zone tasks:", response.data);
      setZones((prev) =>
        prev.map((z) =>
          z.zone === zoneNumber
            ? { ...z, accessible: true, data: response.data, loading: false }
            : z
        )
      );
      setNextRequiredZone(null);
    } catch (error) {
      const axiosError = error as AxiosError<{
        nextRequiredZone?: number;
        message?: string;
      }>;

      if (axiosError.response?.status === 403) {
        const next =
          axiosError.response.data?.nextRequiredZone || zoneNumber - 1;
        setNextRequiredZone(next);
        setZones((prev) =>
          prev.map((z) =>
            z.zone === zoneNumber
              ? {
                  ...z,
                  accessible: false,
                  loading: false,
                  error: `Zone locked. Complete Zone ${next} first.`,
                }
              : z
          )
        );
      } else {
        setZones((prev) =>
          prev.map((z) =>
            z.zone === zoneNumber
              ? { ...z, loading: false, error: "Failed to load tasks" }
              : z
          )
        );
      }
    }
  }, []);

  const checkProgramCompletion = useCallback(async () => {
    try {
      const response = await patientApi.getProgress();
      if (response.data.allZonesComplete) {
        setProgramCompleted(true);
      }
      // Update zone accessibility based on current zone
      const currentZone = response.data.currentZone || 1;
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          accessible: z.zone <= currentZone,
        }))
      );
      setActiveZone(currentZone);
    } catch {
      // Silently fail - we'll rely on zone-specific fetches
    }
  }, []);

  useEffect(() => {
    checkProgramCompletion();
    fetchZoneTasks(1);
  }, [fetchZoneTasks, checkProgramCompletion]);

  const handleZoneClick = (zone: ZoneState) => {
    if (!zone.accessible) {
      toast({
        title: "Zone Locked",
        description: `Complete Zone ${zone.zone - 1} to unlock ${zone.title}.`,
        variant: "destructive",
      });
      return;
    }
    setActiveZone(zone.zone);
    setActiveWeek(1);
    setActiveDay(0);
    if (!zone.data) {
      fetchZoneTasks(zone.zone);
    }
  };

  const handleProceedToZone = () => {
    if (nextRequiredZone) {
      setActiveZone(nextRequiredZone);
      fetchZoneTasks(nextRequiredZone);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setPendingSelections(
      (prev) =>
        prev.includes(taskId)
          ? prev.filter((id) => id !== taskId) // Uncheck
          : [...prev, taskId] // Check
    );
  };
  const handleSubmitDay = async () => {
    // Check which tasks actually need submitting
    const tasksToSubmit = currentDayTasks
      .filter(
        (t) => t.status !== "Completed" && pendingSelections.includes(t._id)
      )
      .map((t) => t._id);

    if (tasksToSubmit.length === 0) {
      toast({ title: "Notice", description: "No new tasks to submit." });
      return;
    }

    setIsSubmitting(true);

    try {
      // ONE API call instead of many
      await patientApi.logTaskCompletion({
        taskIds: tasksToSubmit,
        completionDate: new Date().toISOString(),
      });
      console.log("Submitted tasks:", tasksToSubmit);
      // Update local state to reflect completion
      setZones((prev) =>
        prev.map((zone) => {
          if (zone.zone !== activeZone || !zone.data) return zone;
          return {
            ...zone,
            data: {
              ...zone.data,
              task: zone.data.task.map((t: any) =>
                tasksToSubmit.includes(t._id)
                  ? { ...t, status: "Completed" }
                  : t
              ),
            },
          };
        })
      );

      toast({ title: "Success!", description: "All tasks for today logged." });
      setPendingSelections([]);
      checkProgramCompletion();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "Failed to log tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const currentZone = zones.find((z) => z.zone === activeZone);
  // Extract the flat task array from your backend response
  const allTasks = currentZone?.data?.task || [];

  // Filter tasks for the selected week
  const currentWeekTasks = allTasks.filter((t) => t.programWeek === activeWeek);

  // Filter tasks for the selected day based on 'daysApplicable'
  const dayName = dayNames[activeDay]; // e.g., "Mon"
  const currentDayTasks = currentWeekTasks.filter((t) =>
    t.daysApplicable?.includes(dayName)
  );
  // 1. Checks if the DB already has them as completed
  const isDayAlreadyLogged =
    currentDayTasks.length > 0 &&
    currentDayTasks.every((task) => task.status === "Completed");

  // 2. Checks if the user has locally checked everything that ISN'T completed yet
  const isDayReadyForSubmit =
    currentDayTasks.length > 0 &&
    currentDayTasks.every(
      (task) =>
        task.status === "Completed" || pendingSelections.includes(task._id)
    );

  const getDayCompletionStatus = (
    zone: number,
    week: number,
    dayIndex: number
  ) => {
    const zoneData = zones.find((z) => z.zone === zone);
    const tasks = zoneData?.data?.task || [];
    const dayName = dayNames[dayIndex];

    // Filter the flat list to find tasks for this specific week and day
    const dayTasks = tasks.filter(
      (t) => t.programWeek === week && t.daysApplicable?.includes(dayName)
    );

    if (dayTasks.length === 0) return "empty";

    // Backend uses 'status', so we check for 'completed'
    const allCompleted = dayTasks.every((t) => t.status === "Completed");
    const someCompleted = dayTasks.some((t) => t.status === "Completed");

    if (allCompleted) return "Completed";
    if (someCompleted) return "partial";
    return "pending";
  };

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;

    zones.forEach((zone) => {
      // Look for the 'task' array directly in zone.data
      const tasks = zone.data?.task || [];
      total += tasks.length;
      completed += tasks.filter((t) => t.status === "Completed").length;
    });

    return { total, completed };
  };

  const { total: totalTasks, completed: completedTasks } = calculateProgress();

  // Program Completed Screen
  if (programCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="mb-6"
        >
          <PartyPopper className="h-24 w-24 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gradient-phoenix mb-4">
          Congratulations!
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          You've completed the entire 15-week program!
        </p>
        <p className="text-muted-foreground max-w-md">
          You've shown incredible dedication and commitment. Your transformation
          journey has been remarkable. Keep up the amazing work!
        </p>
        <div className="mt-8 flex gap-4">
          <Button variant="teal" onClick={() => setProgramCompleted(false)}>
            View Tasks
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          Complete your daily tasks to progress through zones
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-3xl font-bold text-foreground">
                {completedTasks} / {totalTasks || "..."} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">
                Zone {activeZone} • Week {activeWeek} • {dayNames[activeDay]}
              </span>
            </div>
          </div>
          <Progress
            value={totalTasks ? (completedTasks / totalTasks) * 100 : 0}
            className="mt-4 h-3"
          />
        </CardContent>
      </Card>

      {/* Zone Navigation */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Select Zone
        </h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {zones.map((zone) => (
              <button
                key={zone.zone}
                onClick={() => handleZoneClick(zone)}
                disabled={zone.loading}
                className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 min-w-[100px] ${
                  zone.accessible
                    ? activeZone === zone.zone
                      ? "border-secondary bg-secondary/10 shadow-teal"
                      : "border-border bg-card hover:border-secondary/50 hover:shadow-sm"
                    : "cursor-not-allowed border-border/50 bg-muted/50 opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    zone.accessible
                      ? activeZone === zone.zone
                        ? "gradient-phoenix"
                        : "bg-secondary/20"
                      : "bg-muted"
                  }`}
                >
                  {zone.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : !zone.accessible ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : activeZone === zone.zone ? (
                    <span className="font-bold text-primary-foreground">
                      {zone.zone}
                    </span>
                  ) : (
                    <span className="font-bold text-secondary">
                      {zone.zone}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {zone.title}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Week Navigation */}
      {currentZone?.accessible && currentZone.data && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Select Week
          </h3>
          <div className="flex gap-2">
            {[1, 2, 3].map((week) => (
              <Button
                key={week}
                variant={activeWeek === week ? "teal" : "outline"}
                onClick={() => {
                  setActiveWeek(week);
                  setActiveDay(0);
                }}
                className="flex-1"
              >
                Week {week}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Day Navigation */}
      {currentZone?.accessible && currentZone.data && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Select Day
          </h3>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {dayNames.map((day, index) => {
                const status = getDayCompletionStatus(
                  activeZone,
                  activeWeek,
                  index
                );
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(index)}
                    className={`relative flex flex-col items-center gap-1 rounded-lg border px-4 py-3 transition-all duration-200 min-w-[60px] ${
                      activeDay === index
                        ? "border-secondary bg-secondary/10 shadow-sm"
                        : "border-border bg-card hover:border-secondary/50"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">
                      {day}
                    </span>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        status === "Completed"
                          ? "bg-green-500"
                          : status === "partial"
                          ? "bg-yellow-500"
                          : status === "pending"
                          ? "bg-red-400"
                          : "bg-muted"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Task List */}
      <AnimatePresence mode="wait">
        {currentZone?.loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="h-12 w-12 animate-spin text-secondary" />
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
          </motion.div>
        ) : currentZone?.accessible && currentZone.data ? (
          <motion.div
            key={`${activeZone}-${activeWeek}-${activeDay}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {dayNames[activeDay]}'s Tasks
              </h2>
              <p className="text-xs text-secondary font-medium">
                Focus: {currentDayTasks[0]?.metricRequired || "General Health"}
              </p>
            </div>

            {currentDayTasks && currentDayTasks.length > 0 ? (
              <>
                {/* 1. The Scrollable List of Tasks */}
                <div className="space-y-3">
                  {currentDayTasks.map((task, index) => {
                    const isCompleted = task.status === "Completed";
                    const isLogging = loggingTaskId === task._id;
                    return (
                      <motion.div
                        key={task._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={`group relative overflow-hidden transition-all duration-300 border-l-4 ${
                            isCompleted
                              ? "bg-slate-50/80 border-l-green-500 opacity-75"
                              : task.timeOfDay === "Morning"
                              ? "border-l-amber-400 shadow-sm hover:shadow-md"
                              : "border-l-indigo-400 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-5">
                              {/* Checkbox Section */}
                              <div className="flex flex-col items-center gap-2">
                                {isLogging ? (
                                  <Loader2 className="mt-1 h-6 w-6 animate-spin text-secondary" />
                                ) : (
                                  <Checkbox
                                    id={task._id}
                                    className="h-6 w-6 rounded-full border-2 transition-transform group-hover:scale-110"
                                    checked={
                                      task.status === "Completed" ||
                                      pendingSelections.includes(task._id)
                                    }
                                    onCheckedChange={() =>
                                      handleTaskToggle(task._id)
                                    }
                                    disabled={
                                      task.status === "Completed" ||
                                      isSubmitting
                                    }
                                  />
                                )}
                              </div>

                              {/* Content Section */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {/* Time Badge */}
                                  <span
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      task.timeOfDay === "Morning"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-indigo-100 text-indigo-700"
                                    }`}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {task.timeOfDay}
                                  </span>

                                  {/* Zone/Week Badge */}
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                                    ZONE {task.zone} • WEEK {task.programWeek}
                                  </span>

                                  {isCompleted && (
                                    <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                      <CheckCircle className="h-3 w-3" />
                                      Done
                                    </span>
                                  )}
                                </div>

                                <label
                                  htmlFor={task._id}
                                  className={`text-lg font-bold leading-tight block transition-colors ${
                                    isCompleted
                                      ? "text-slate-400 line-through"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {task.description}
                                </label>

                                {/* Patient Insight Section */}
                                {!isCompleted && (
                                  <div className="mt-3 flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                                    <div className="text-[11px] text-blue-700 leading-relaxed">
                                      <strong>
                                        Goal: {task.metricRequired}
                                      </strong>{" "}
                                      — Completing this helps improve your
                                      metabolic rate. Aim for consistency to
                                      unlock Zone {task.zone + 1}.
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 2. The Submit Block (Placed inside the same branch) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-6 border-t border-slate-100"
                >
                  <Card
                    className={`overflow-hidden border-none shadow-lg transition-all duration-500 ${
                      isDayAlreadyLogged || isDayReadyForSubmit
                        ? "bg-gradient-to-r from-teal-500 to-emerald-600"
                        : "bg-slate-100"
                    }`}
                  >
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isDayReadyForSubmit ? "bg-white/20" : "bg-slate-200"
                          }`}
                        >
                          {isDayAlreadyLogged ? (
                            <CheckCircle className="text-white h-6" />
                          ) : isDayReadyForSubmit ? (
                            <Target className="text-white h-6 animate-bounce" /> // Replaces spinner when ready
                          ) : (
                            <Loader2 className="text-slate-400 animate-spin" /> // Only spins while tasks are missing
                          )}
                        </div>
                        <div className="text-left">
                          <h4
                            className={`font-bold ${
                              isDayReadyForSubmit
                                ? "text-white"
                                : "text-slate-600"
                            }`}
                          >
                            {isDayAlreadyLogged
                              ? "Day Logged"
                              : isDayReadyForSubmit
                              ? "Ready to Submit!"
                              : "Day in Progress"}
                          </h4>
                          <p
                            className={`text-xs ${
                              isDayReadyForSubmit
                                ? "text-white/80"
                                : "text-slate-400"
                            }`}
                          >
                            {isDayAlreadyLogged
                              ? "Routine complete."
                              : isDayReadyForSubmit
                              ? "Click the button to save."
                              : `${pendingSelections.length} of ${currentDayTasks.length} tasks checked`}
                          </p>
                        </div>
                      </div>
                      <Button
                        disabled={
                          isSubmitting ||
                          isDayAlreadyLogged ||
                          !isDayReadyForSubmit // Button unlocks as soon as local checks = total tasks
                        }
                        onClick={handleSubmitDay}
                        className={
                          isDayReadyForSubmit && !isDayAlreadyLogged
                            ? "bg-white text-emerald-600 hover:bg-white/90"
                            : "bg-slate-200 text-slate-400"
                        }
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 animate-spin" />
                        ) : isDayAlreadyLogged ? (
                          "Day Logged"
                        ) : (
                          "Submit All Tasks"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <Card className="card-elevated">
                <CardContent className="py-12 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">
                    No tasks for this day
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Enjoy your rest day!
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Zone Locked
            </h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              {currentZone?.error ||
                `Complete all tasks in Zone ${activeZone - 1} to unlock ${
                  currentZone?.title || "this zone"
                }.`}
            </p>
            {nextRequiredZone && (
              <Button
                variant="phoenix"
                className="mt-4"
                onClick={handleProceedToZone}
              >
                Proceed to Zone {nextRequiredZone}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
