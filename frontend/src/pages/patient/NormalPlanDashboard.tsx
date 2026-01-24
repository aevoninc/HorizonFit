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
  const [currentZone, setCurrentZone] = useState<number>(1);





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

const fetchProgress = useCallback(async () => {
  try {
    setLoading(true);
    const response = await normalPlanPatientApi.getProgress();
    const progressData = response.data;

    const zoneToFetch = progressData.currentZone; // ✅ source of truth

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
    setCurrentZone(zoneToFetch); // update UI AFTER
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
}, [toast]);


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
            if (zone.zoneNumber !== currentZone) return zone;

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
      if (zone.zoneNumber !== currentZone) return zone;
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
        zoneNumber: currentZone,
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

  if (!progress) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          Unable to load your progress
        </p>
        <Button onClick={fetchProgress} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }
  const zones = progress?.zones ?? [];

  const currentZoneData = progress.zones.find(
    (z) => z.zoneNumber === currentZone,
  );

  const completedTasks =
    currentZoneData?.diyTasks?.filter((t) => t.isCompleted).length ?? 0;

  const totalTasks = currentZoneData?.diyTasks.length || 0;
  const canSubmitLog =
    currentZoneData?.videosCompleted && progress.latestMetrics;

    console.log(progress);
  // Program Completed Screen
  if (progress.programCompleted) {
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
          You've completed all 5 zones of the Normal Plan!
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
  const isCurrent = zone.zoneNumber === currentZone;

  return (
    <button
      key={zone.zoneNumber}
      disabled={!isCurrent}
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 min-w-[100px]
        ${
          isCurrent
            ? "border-secondary bg-secondary/10 shadow-teal"
            : "cursor-not-allowed border-border/50 bg-muted/50 opacity-50"
        }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full
          ${isCurrent ? "gradient-phoenix" : "bg-muted"}`}
      >
        {isCurrent ? (
          <span className="font-bold text-primary-foreground">
            {zone.zoneNumber}
          </span>
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <span className="text-sm font-medium text-foreground">
        {zone.zoneName}
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
            currentZone={currentZone}
            onSubmit={handleMetricsSubmit}
            latestMetrics={progress.latestMetrics}
            videosCompleted={currentZoneData?.videosCompleted}
            canEnterMetrics={canEnterMetrics}
            daysUntilNextEntry={daysUntilNextMetrics}
            onWatchVideos={() => setActiveTab("videos")}
          />

          {/* Recommendations */}
          {progress.recommendations ? (
            <RecommendationsCard recommendations={progress.recommendations} />
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
          {currentZoneData?.isUnlocked && currentZoneData?.diyTasks?.length ? (
            <DIYTasksList
              tasks={currentZoneData.diyTasks}
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
              zoneName={currentZoneData.zoneName}
            />
          ) : (
            <Card className="card-elevated">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium text-muted-foreground">
                  Complete previous zones to unlock tasks
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Daily Log Tab */}
        {/* <TabsContent value="daily">
          {currentZoneData?.isUnlocked ? (
            <DailyLogCard
              tasks={currentZoneData.diyTasks}
              currentZone={currentZone}
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
            currentZone={currentZone}
            currentWeek={progress.totalWeeksCompleted + 1}
            lastLog={progress.weeklyLogs[progress.weeklyLogs.length - 1]}
            latestMetrics={progress.latestMetrics}
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
