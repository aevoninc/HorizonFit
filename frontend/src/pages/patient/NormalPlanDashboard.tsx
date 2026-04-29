import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Loader2,
  PartyPopper,
  Lock,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  RefreshCw,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Components
import { ZoneNavigator } from "@/components/normalplan/ZoneNavigator";
import { MetricsInputCard } from "@/components/normalplan/MetricsInputCard";
import { RecommendationsCard } from "@/components/normalplan/RecommendationsCard";
import { DIYTasksList } from "@/components/normalplan/DIYTasksList";
import { ZoneVideoPlayer } from "@/components/normalplan/ZoneVideoPlayer";
import { WeeklyLogForm } from "@/components/normalplan/WeeklyLogForm";
import { DailyLogCard } from "@/components/normalplan/DailyLogCard";

// Types and helpers
import {
  NormalPlanProgress,
  ZoneData,
  BodyMetrics,
  WeeklyLog,
  ZONE_DEFINITIONS,
  DIYTask,
} from "@/lib/normalPlanTypes";
import { normalPlanPatientApi } from "@/lib/normalPlanApi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { patientApi } from "@/lib/api";
import { AxiosError } from "axios";
import { getZoneName } from "@/lib/zoneUtils";

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
  "Momentum",
  "Transformation",
  "Mastery",
  "Freedom",
];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const NormalPlanDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<NormalPlanProgress | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [canEnterMetrics, setCanEnterMetrics] = useState(true);
  const [daysUntilNextMetrics, setDaysUntilNextMetrics] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0);
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextRequiredZone, setNextRequiredZone] = useState<number | null>(null);
  const [programCompleted, setProgramCompleted] = useState(false);
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<number>(1);





  const handleZoneClick = (zone: ZoneState) => {
    if (zone.zone !== currentZone) {
      toast({
        title: "Zone Locked",
        description: "You can only access your current zone.",
        variant: "destructive",
      });
      return;
    }
  };

  const fetchProgress = useCallback(async (zoneId?: number) => {
    try {
      setLoading(true);
      const response = await normalPlanPatientApi.getProgress();
      const progressData = response.data;

      // Use the provided zoneId, or the state selectedZone, or fallback to backend currentZone
      const zoneToFetch = zoneId || selectedZone || progressData.currentZone;

      const tasksResponse = await patientApi.getZoneTasks(zoneToFetch);
      console.log(tasksResponse);
      const updatedZones = progressData.zones.map((zone) =>
        zone.zoneNumber === zoneToFetch
          ? {
            ...zone,
            diyTasks: tasksResponse.data.task.map((task: any) => ({
              ...task,
              isCompleted: task.status === "Completed",
            })),
          }
          : zone,
      );

      setProgress({ ...progressData, zones: updatedZones });
      if (zoneToFetch !== selectedZone) {
        setSelectedZone(zoneToFetch);
      }
      setCanEnterMetrics(progressData.canEnterMetrics);
      setDaysUntilNextMetrics(progressData.daysUntilNextMetrics);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load your progress.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedZone, toast]);


  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProgress();
    setRefreshing(false);
  };

  const handleMetricsSubmit = async (
    metrics: Omit<BodyMetrics, "id" | "loggedAt">,
  ) => {
    try {
      const response = await normalPlanPatientApi.submitMetrics(metrics);
      console.log("Metrics:", response);
      if (response.data.success) {
        setProgress((prev) =>
          prev
            ? {
              ...prev,
              latestMetrics: response.data.metrics,
              recommendations: response.data.recommendations,
            }
            : null,
        );

        setCanEnterMetrics(false);
        setDaysUntilNextMetrics(7);

        toast({
          title: "Metrics Saved!",
          description: "Your personalized recommendations have been updated.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save metrics.",
        variant: "destructive",
      });
    }
  };

  const handleVideoComplete = async (videoId: string) => {
    try {
      console.log("Marking video as watched:", videoId);
      const response = await normalPlanPatientApi.markVideoWatched(videoId);

      if (response.data.success) {
        // Update local state
        if (progress) {
          const updatedZones = progress.zones.map((zone) => {
            if (zone.zoneNumber !== selectedZone) return zone;

            const updatedVideos = zone.requiredVideos.map((v) =>
              v._id === videoId ? { ...v, isWatched: true } : v,
            );

            return {
              ...zone,
              requiredVideos: updatedVideos,
              videosCompleted: response.data.videosCompleted,
            };
          });

          setProgress({ ...progress, zones: updatedZones });
        }

        toast({
          title: "Video Completed!",
          description: response.data.videosCompleted
            ? "All required videos complete! You can now enter your metrics."
            : `${response.data.watchedCount}/${response.data.totalRequired} videos watched.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to mark video as watched.",
        variant: "destructive",
      });
    }
  };

  const handleTasksUpdate = (updatedTasks: DIYTask[]) => {
    if (!progress) return;

    const updatedZones = progress.zones.map((zone) => {
      if (zone.zoneNumber !== selectedZone) return zone;
      return { ...zone, diyTasks: updatedTasks };
    });

    setProgress({ ...progress, zones: updatedZones });
  };

  const handleWeeklyLogSubmit = async (
    log: Omit<WeeklyLog, "id" | "submittedAt">,
  ) => {
    try {
      // Include patientId (from progress or context)
      const patientId = progress?.patientId; // Make sure you have this

      if (!patientId) {
        toast({
          title: "Error",
          description: "Patient ID missing. Cannot submit log.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        patientId,
        zoneNumber: selectedZone,
        logData: log, // wrap the log inside logData
      };

      const response = await normalPlanPatientApi.submitWeeklyLog(payload);

      if (response.data.success) {
        await fetchProgress();

        if (response.data.zoneCompleted && response.data.newZone) {
          toast({
            title: "🎉 Zone Complete!",
            description: `You've unlocked Zone ${response.data.newZone}!`,
          });
        } else {
          toast({
            title: "Weekly Log Submitted!",
            description: "Your progress has been recorded.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to submit weekly log.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const safeProgress = progress ?? {
    zones: [],
    currentZone: 1,
    programCompleted: false,
    latestMetrics: null,
    recommendations: null,
    weeklyLogs: [],
    totalWeeksCompleted: 0,
    canEnterMetrics: false,
    daysUntilNextMetrics: 0,
    patientId: null,
  };

  const zones = safeProgress.zones;

  const currentZoneData = safeProgress.zones.find(
    (z) => z.zoneNumber === selectedZone,
  );

  const completedTasks =
    currentZoneData?.diyTasks?.filter((t) => t.isCompleted).length ?? 0;

  const totalTasks = currentZoneData?.diyTasks?.length || 0;
  const canSubmitLog =
    currentZoneData?.videosCompleted && safeProgress.latestMetrics;

  console.log(safeProgress);
  // Program Completed Screen
  if (safeProgress.programCompleted) {
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
          You've completed all 5 zones of the Healthy Habits Program!
        </p>
        <p className="text-muted-foreground max-w-md">
          You've built strong foundations for lifelong health. Keep applying
          what you've learned!
        </p>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Normal Plan</h1>
          <p className="mt-1 text-muted-foreground">
            Self-guided wellness program with doctor-curated guidance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Link to="/patient/horizon-guide">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Horizon Guide
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Zone Navigation */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Select Zone
        </h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {zones.map((zone) => {
              const isSelected = zone.zoneNumber === selectedZone;
              const isActualCurrentZone = zone.zoneNumber === safeProgress.currentZone;

              return (
                <button
                  key={zone.zoneNumber}
                  onClick={() => fetchProgress(zone.zoneNumber)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 min-w-[100px] transition-all
        ${isSelected
                      ? "border-secondary bg-secondary/10 shadow-teal"
                      : "border-border/50 bg-card hover:bg-secondary/5"
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full
          ${isSelected ? "gradient-phoenix" : "bg-muted"}`}
                  >
                    <span className={`font-bold ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {zone.zoneNumber}
                    </span>
                    {isActualCurrentZone && !isSelected && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-secondary shadow-sm" title="Current Progress" />
                    )}
                  </div>

                  <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {getZoneName(zone.zoneNumber)}
                  </span>
                </button>
              );
            })}

          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Zone Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Video Lock Warning */}
          {currentZoneData &&
            !currentZoneData.videosCompleted &&
            currentZoneData.isUnlocked && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Videos Required
                    </p>
                    <p className="text-sm text-yellow-700">
                      Watch all required zone videos to unlock full zone
                      features and metrics entry.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                    onClick={() => setActiveTab("videos")}
                  >
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Metrics Input */}
          <MetricsInputCard
            currentZone={selectedZone}
            onSubmit={handleMetricsSubmit}
            latestMetrics={safeProgress.latestMetrics}
            videosCompleted={currentZoneData?.videosCompleted}
            canEnterMetrics={canEnterMetrics}
            daysUntilNextEntry={daysUntilNextMetrics}
            onWatchVideos={() => setActiveTab("videos")}
          />

          {/* Recommendations */}
          {safeProgress.recommendations ? (
            <RecommendationsCard recommendations={safeProgress.recommendations} />
          ) : (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium text-muted-foreground">
                  Enter your body metrics to receive personalized
                  recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <ZoneVideoPlayer
            videos={currentZoneData?.requiredVideos || []}
            zoneName={currentZoneData?.zoneName || ""}
            isZoneLocked={!currentZoneData?.isUnlocked}
            onVideoComplete={handleVideoComplete}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          {/* {currentZoneData?.isUnlocked && currentZoneData?.diyTasks?.length ? ( */}
          <DIYTasksList
            tasks={currentZoneData?.diyTasks?.length ? currentZoneData.diyTasks : []}
            onTaskToggle={(taskId) => {
              const updatedTasks = currentZoneData.diyTasks.map((task) =>
                task._id === taskId
                  ? {
                    ...task,
                    isCompleted: !task.isCompleted,
                    status: !task.isCompleted ? "Completed" : "Pending",
                  }
                  : task,
              );
              handleTasksUpdate(updatedTasks);
            }}
            zoneName={currentZoneData?.zoneName || ""}
            onTaskAdded={fetchProgress}
          />
          {/* // ) : ( */}
          {/* <DIYTasksList
              tasks={[]}
              onTaskToggle={(taskId) => {
                const updatedTasks = currentZoneData.diyTasks.map((task) =>
                  task._id === taskId
                    ? {
                      ...task,
                      isCompleted: !task.isCompleted,
                      status: !task.isCompleted ? "Completed" : "Pending",
                    }
                    : task,
                );
                handleTasksUpdate(updatedTasks);
              }}
              zoneName={currentZoneData?.zoneName || ""}
              onTaskAdded={fetchProgress}
            /> */}
          {/* )} */}
        </TabsContent>

        {/* Daily Log Tab */}
        {/* <TabsContent value="daily">
          {currentZoneData?.isUnlocked ? (
            <DailyLogCard
              tasks={currentZoneData.diyTasks}
              currentZone={selectedZone}
              onTasksUpdate={handleTasksUpdate}
            />
          ) : (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium text-muted-foreground">
                  Complete previous zones to access daily logging
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent> */}

        {/* Weekly Log Tab */}
        <TabsContent value="weekly">
          <WeeklyLogForm
            currentZone={selectedZone}
            currentWeek={safeProgress.totalWeeksCompleted + 1}
            lastLog={safeProgress.weeklyLogs[safeProgress.weeklyLogs.length - 1]}
            latestMetrics={safeProgress.latestMetrics}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            onSubmit={handleWeeklyLogSubmit}
            canSubmit={!!canSubmitLog}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
