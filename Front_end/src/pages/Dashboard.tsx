import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/axios";

type TaskItem = {
  completed: unknown;
  description: string;
  programWeek: number;
  zone: number;
  frequency: string;
  daysApplicable: string[];
  timeOfDay: string;
  metricRequired?: string;
};

const ZONE_NAMES = [
  "Foundation Zone",
  "Momentum Zone",
  "Transformation Zone",
  "Mastery Zone",
  "Freedom Zone",
];

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userEmail, setUserEmail] = useState<string>("");
  const [currentZone, setCurrentZone] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [tasksByZone, setTasksByZone] = useState<Record<number, TaskItem[]>>(
    {}
  );
  const [loadingZone, setLoadingZone] = useState<number | null>(null);
  const [errorZone, setErrorZone] = useState<string | null>(null);

  // Load session and initial zone
  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return navigate("/login");

    try {
      const parsed = JSON.parse(session);
      if (parsed.type !== "patient") return navigate("/login");
      setUserEmail(parsed.email || "");

      // Use currentZone from session if available
      const startingZone = parsed.currentZone || 1;
      setCurrentZone(startingZone);
      fetchZoneTasks(startingZone);
    } catch {
      return navigate("/login");
    }
  }, []);

  // Fetch tasks for a given zone
  const fetchZoneTasks = async (zone: number) => {
    setLoadingZone(zone);
    setErrorZone(null);

    try {
      const res = await api.get(`/patients/get-zone-task/${zone}`);
      const tasks = res.data?.task || [];

      const groupedByZone: Record<number, TaskItem[]> = {};
      tasks.forEach((task: TaskItem) => {
        const z = Number(task.zone);
        if (!groupedByZone[z]) groupedByZone[z] = [];
        groupedByZone[z].push(task);
      });

      setTasksByZone(prev => ({ ...prev, ...groupedByZone }));
    } catch (err: any) {
      if (err.response?.status === 403 && err.response.data?.nextRequiredZone) {
        const nextZone = err.response.data.nextRequiredZone;
        toast({ title: err.response.data.message });
        setCurrentZone(nextZone);
        setSelectedWeek(1);
        fetchZoneTasks(nextZone);
      } else {
        setErrorZone(err.response?.data?.message || "Failed to fetch tasks");
        console.error("AxiosError:", err.response?.data || err.message);
      }
    } finally {
      setLoadingZone(null);
    }
  };

  // Group tasks by week
  const groupedTasks = useMemo(() => {
    const arr = tasksByZone[currentZone] ?? [];
    const map: Record<number, TaskItem[]> = {};
    arr.forEach((task) => {
      const wk = Number(task.programWeek);
      if (!map[wk]) map[wk] = [];
      map[wk].push(task);
    });
    return map;
  }, [tasksByZone, currentZone]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    toast({ title: "Logged out" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" className="h-14" />
            <div>
              <div className="text-lg font-semibold">Horizon Fit</div>
              <div className="text-sm text-muted-foreground">
                15-Week Program — 5 Zones
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{userEmail}</div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Zones Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Program Zones</h2>
          <div className="flex gap-4">
            {ZONE_NAMES.map((name, i) => {
              const z = i + 1;
              const unlocked = z <= currentZone;
              return (
                <div
                  key={z}
                  className={`flex-1 p-4 rounded-lg border ${
                    unlocked
                      ? "bg-white border-green-400"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{name}</div>
                    {z < currentZone && (
                      <CheckCircle2 className="text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Zone {z} • 3 weeks
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Zones</CardTitle>
              <CardDescription>Click to open your current zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ZONE_NAMES.map((name, i) => {
                  const z = i + 1;
                  const unlocked = z <= currentZone;
                  return (
                    <div
                      key={z}
                      className={`p-3 rounded-md border flex items-center justify-between ${
                        unlocked
                          ? "bg-white border-green-400"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          Zone {z} • 3 weeks
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => unlocked && setCurrentZone(z)}
                        disabled={!unlocked}
                      >
                        Open
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Task View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{ZONE_NAMES[currentZone - 1]}</CardTitle>
              <CardDescription>Diet plan for this zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                {[1, 2, 3].map((w) => (
                  <Button
                    key={w}
                    size="sm"
                    variant={selectedWeek === w ? "default" : "outline"}
                    onClick={() => setSelectedWeek(w)}
                  >
                    Week {w}
                  </Button>
                ))}
              </div>

              {loadingZone === currentZone ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                  <div className="text-sm text-muted-foreground mt-2">
                    Loading tasks…
                  </div>
                </div>
              ) : errorZone ? (
                <div className="text-red-600">{errorZone}</div>
              ) : (
                <div className="space-y-4">
                  {(groupedTasks[selectedWeek] ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No tasks for this week.
                    </div>
                  ) : (
                    groupedTasks[selectedWeek].map((task, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-white">
                        <div className="font-semibold">{task.description}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.frequency} • {task.timeOfDay}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Days: {task.daysApplicable?.join(", ")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Complete Zone Button */}
              {(groupedTasks[selectedWeek] ?? []).length > 0 &&
                currentZone < 5 && (
                  <div className="mt-4">
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          setLoadingZone(currentZone);

                          // Complete current zone
                          await api.post(
                            `/patients/complete-zone/${currentZone}`
                          );
                          toast({
                            title: `Zone ${currentZone} completed!`,
                          });

                          // Fetch next zone
                          const res = await api.get(
                            `/patients/get-zone-task/${currentZone + 1}`
                          );
                          const nextZone = res.data.currentZone;

                          setCurrentZone(nextZone);
                          setSelectedWeek(1);

                          // Update tasks
                          const tasks = res.data?.task || [];
                          const groupedByZone: Record<number, TaskItem[]> = {};
                          tasks.forEach((task: TaskItem) => {
                            const z = Number(task.zone);
                            if (!groupedByZone[z]) groupedByZone[z] = [];
                            groupedByZone[z].push(task);
                          });
                          setTasksByZone(prev => ({
                            ...prev,
                            ...groupedByZone,
                          }));
                        } catch (err: any) {
                          if (
                            err.response?.status === 403 &&
                            err.response.data?.nextRequiredZone
                          ) {
                            const nextZone = err.response.data.nextRequiredZone;
                            toast({ title: err.response.data.message });
                            setCurrentZone(nextZone);
                            setSelectedWeek(1);
                            fetchZoneTasks(nextZone);
                          } else {
                            toast({
                              title: "Failed to complete zone",
                              description:
                                err.response?.data?.message || err.message,
                            });
                          }
                        } finally {
                          setLoadingZone(null);
                        }
                      }}
                    >
                      Complete Zone & Next
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
