import { AnimatePresence, motion } from "framer-motion";
import {
  UtensilsCrossed,
  Droplets,
  Footprints,
  Moon,
  Wind,
  Egg,
  Heart,
  Brain,
  ChefHat,
  Dumbbell,
  BedDouble,
  BookHeart,
  Calculator,
  Sparkles,
  Flame,
  Clock,
  Eye,
  Leaf,
  Trophy,
  Star,
  Flower2,
  CheckCircle2,
  PartyPopper,
  Loader2,
  Calendar,
  CheckCircle,
  Target,
  ArrowRight,
  Lock,
  FileText,
  ThumbsUp,
  Smile,
  Meh,
  ThumbsDown,
  Frown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DIYTask } from "@/lib/normalPlanTypes";
import { Button } from "../ui/button";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { patientApi } from "@/lib/api";
import { AxiosError } from "axios";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Droplets,
  Footprints,
  Moon,
  Wind,
  Egg,
  Heart,
  Brain,
  ChefHat,
  Dumbbell,
  BedDouble,
  BookHeart,
  Calculator,
  Sparkles,
  Flame,
  Clock,
  Eye,
  Leaf,
  Trophy,
  Star,
  Flower2,
  MonitorOff: Clock, // Fallback
};
const moodOptions = [
  {
    value: "great",
    label: "Great",
    icon: ThumbsUp,
    color: "text-green-500 bg-green-500/10",
  },
  {
    value: "good",
    label: "Good",
    icon: Smile,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    value: "okay",
    label: "Okay",
    icon: Meh,
    color: "text-yellow-500 bg-yellow-500/10",
  },
  {
    value: "bad",
    label: "Bad",
    icon: Frown,
    color: "text-orange-500 bg-orange-500/10",
  },
  {
    value: "terrible",
    label: "Terrible",
    icon: ThumbsDown,
    color: "text-red-500 bg-red-500/10",
  },
] as const;
const categoryColors: Record<
  string,
  { bg: string; text: string; badge: string }
> = {
  nutrition: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
  exercise: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
  hydration: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  sleep: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
  },
  mindset: {
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
};

interface DIYTasksListProps {
  tasks: DIYTask[];
  onTaskToggle: (taskId: string) => void;
  zoneName: string;
}

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

export const DIYTasksList: React.FC<DIYTasksListProps> = ({
  tasks,
  onTaskToggle,
  zoneName,
}) => {
  console.log(tasks);
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const [zones, setZones] = useState<ZoneState[]>(
    [1, 2, 3, 4, 5].map((zone) => ({
      zone,
      title: zoneName[zone - 1],
      accessible: zone === 1,
      loading: false,
    })),
  );
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeZone, setActiveZone] = useState(1);
  const [nextRequiredZone, setNextRequiredZone] = useState<number | null>(null);
  const [programCompleted, setProgramCompleted] = useState(false);
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1); // default to week 1
  const [activeDay, setActiveDay] = useState<number>(0); // default to Monday (index 0)
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchZoneTasks = useCallback(async (zoneNumber: number) => {
    setZones((prev) =>
      prev.map((z) =>
        z.zone === zoneNumber ? { ...z, loading: true, error: undefined } : z,
      ),
    );
    try {
      const response = await patientApi.getZoneTasks(zoneNumber);
      console.log("Fetched zone tasks:", response.data);
      setZones((prev) =>
        prev.map((z) =>
          z.zone === zoneNumber
            ? { ...z, accessible: true, data: response.data, loading: false }
            : z,
        ),
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
              : z,
          ),
        );
      } else {
        setZones((prev) =>
          prev.map((z) =>
            z.zone === zoneNumber
              ? { ...z, loading: false, error: "Failed to load tasks" }
              : z,
          ),
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
        })),
      );
      setActiveZone(currentZone);
    } catch {
      // Silently fail - we'll rely on zone-specific fetches
    }
  }, []);

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
    setPendingSelections((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleSubmitDay = async () => {
    const tasksToSubmit = currentDayTasks
      .filter(
        (t) => t.status !== "Completed" && pendingSelections.includes(t._id),
      )
      .map((t) => t._id);

    if (tasksToSubmit.length === 0) {
      toast({ title: "Notice", description: "No new tasks to submit." });
      return;
    }

    setIsSubmitting(true);

    try {
      await patientApi.logTaskCompletion({
        taskIds: tasksToSubmit,
        completionDate: new Date().toISOString(),
      });

      // Update local task state
      currentDayTasks.forEach((task) => {
        if (tasksToSubmit.includes(task._id)) {
          task.status = "Completed";
        }
      });

      toast({ title: "Success", description: "All tasks for today logged." });
      setPendingSelections([]);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to log tasks.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentZone = zones.find((z) => z.zone === activeZone);
  // Extract the flat task array from your backend response
  const allTasks = currentZone?.data?.task || [];

  // Tasks for the selected week
  const currentWeekTasks = tasks.filter((t) => t.programWeek === activeWeek);

  // Tasks for the selected day
  const dayName = dayNames[activeDay]; // "Mon", "Tue", etc.
  const currentDayTasks = currentWeekTasks.filter((t) =>
    t.daysApplicable?.includes(dayName),
  );

  // Already completed tasks
  const isDayAlreadyLogged =
    currentDayTasks.length > 0 &&
    currentDayTasks.every((task) => task.status === "Completed");

  // Tasks ready for submission
  const isDayReadyForSubmit =
    currentDayTasks.length > 0 &&
    currentDayTasks.every(
      (task) =>
        task.status === "Completed" || pendingSelections.includes(task._id),
    );

  const getDayCompletionStatus = (
    zone: number,
    week: number,
    dayIndex: number,
  ) => {
    const zoneData = zones.find((z) => z.zone === zone);
    const tasks = zoneData?.data?.task || [];
    const dayName = dayNames[dayIndex];

    // Filter the flat list to find tasks for this specific week and day
    const dayTasks = tasks.filter(
      (t) => t.programWeek === week && t.daysApplicable?.includes(dayName),
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
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Daily DIY Tasks</CardTitle>
          <Badge variant="secondary" className="font-medium">
            {completedCount}/{tasks.length} Complete
          </Badge>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full gradient-phoenix"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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

{/* Week Navigation */}
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


{/* Day Navigation */}
<div className="space-y-2">
  <h3 className="text-sm font-medium text-muted-foreground">Select Day</h3>
  <ScrollArea className="w-full whitespace-nowrap">
    <div className="flex gap-2">
      {dayNames.map((day, index) => (
        <Button
          key={day}
          variant={activeDay === index ? "teal" : "outline"}
          onClick={() => setActiveDay(index)}
        >
          {day}
        </Button>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</div>

          {/* Mood Selection */}

          {/* Task List */}
          <AnimatePresence mode="wait">
            { tasks ? (
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
                    Focus:{" "}
                    {currentDayTasks[0]?.metricRequired || "General Health"}
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
                                        ZONE {task.zone} • WEEK{" "}
                                        {task.programWeek}
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
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        How are you feeling today?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {moodOptions.map((mood) => {
                          const Icon = mood.icon;
                          const isSelected = selectedMood === mood.value;
                          return (
                            <button
                              key={mood.value}
                              onClick={() => {
                                setSelectedMood(mood.value);
                                setHasChanges(true);
                              }}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                                isSelected
                                  ? `border-primary bg-primary/10 ${mood.color}`
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 ${
                                  isSelected ? "" : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`text-sm ${
                                  isSelected
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {mood.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Any thoughts, challenges, or wins today?"
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          setHasChanges(true);
                        }}
                        rows={2}
                        className="mt-2"
                      />
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
                                isDayReadyForSubmit
                                  ? "bg-white/20"
                                  : "bg-slate-200"
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
        {/* {tasks.map((task, index) => {
          const IconComponent = iconMap[task.icon] || CheckCircle2;
          const colors = categoryColors[task.category] || categoryColors.nutrition;
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${
                task.isCompleted 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-border hover:border-primary/30 hover:bg-muted/30'
              }`}
            >
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={() => onTaskToggle(task.id)}
                className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                <IconComponent className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                    {task.category}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.description}
                </p>
              </div>
              {task.isCompleted && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              )}
            </motion.div>
          );
        })} */}
      </CardContent>
    </Card>
  );
};
