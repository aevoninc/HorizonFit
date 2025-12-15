// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Loader2, CheckCircle2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import api from "@/api/axios";

// type TaskItem = {
//   completed: unknown;
//   description: string;
//   programWeek: number;
//   zone: number;
//   frequency: string;
//   daysApplicable: string[];
//   timeOfDay: string;
//   metricRequired?: string;
// };

// const ZONE_NAMES = [
//   "Foundation Zone",
//   "Momentum Zone",
//   "Transformation Zone",
//   "Mastery Zone",
//   "Freedom Zone",
// ];

// export default function Dashboard(): JSX.Element {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [userEmail, setUserEmail] = useState<string>("");
//   const [currentZone, setCurrentZone] = useState<number>(1);
//   const [selectedWeek, setSelectedWeek] = useState<number>(1);
//   const [tasksByZone, setTasksByZone] = useState<Record<number, TaskItem[]>>(
//     {}
//   );
//   const [loadingZone, setLoadingZone] = useState<number | null>(null);
//   const [errorZone, setErrorZone] = useState<string | null>(null);

//   // Load session and initial zone
//   useEffect(() => {
//     const session = localStorage.getItem("userSession");
//     if (!session) return navigate("/login");

//     try {
//       const parsed = JSON.parse(session);
//       if (parsed.type !== "patient") return navigate("/login");
//       setUserEmail(parsed.email || "");

//       // Use currentZone from session if available
//       const startingZone = parsed.currentZone || 1;
//       setCurrentZone(startingZone);
//       fetchZoneTasks(startingZone);
//     } catch {
//       return navigate("/login");
//     }
//   }, []);

//   // Fetch tasks for a given zone
//   const fetchZoneTasks = async (zone: number) => {
//     setLoadingZone(zone);
//     setErrorZone(null);

//     try {
//       const res = await api.get(`/patients/get-zone-task/${zone}`);

//       console.log("Zone API Response:", res.data);

//       const tasks = res.data?.task || [];
//       const backendZone = res.data?.currentZone || zone;

//       // Group tasks by zone
//       const groupedByZone: Record<number, TaskItem[]> = {};
//       groupedByZone[backendZone] = tasks;

//       // Update state
//       setCurrentZone(backendZone);
//       setTasksByZone((prev) => ({
//         ...prev,
//         ...groupedByZone,
//       }));

//       // Auto-select week 1 or the first available week
//       if (tasks.length > 0) {
//         const firstWeek = tasks[0].programWeek;
//         setSelectedWeek(firstWeek);
//       } else {
//         setSelectedWeek(1);
//       }
//     } catch (err: any) {
//       console.error("Fetch zone error:", err.response?.data || err.message);

//       if (err.response?.status === 403 && err.response.data?.nextRequiredZone) {
//         const nextZone = err.response.data.nextRequiredZone;
//         toast({ title: err.response.data.message });

//         setCurrentZone(nextZone);
//         setSelectedWeek(1);
//         fetchZoneTasks(nextZone);
//       } else {
//         setErrorZone(err.response?.data?.message || "Failed to load tasks");
//       }
//     } finally {
//       setLoadingZone(null);
//     }
//   };

//   // Group tasks by week
//   const groupedTasks = useMemo(() => {
//     const zoneTasks = tasksByZone[currentZone] ?? [];

//     const weekMap: Record<number, TaskItem[]> = {};

//     zoneTasks.forEach((task) => {
//       const week = Number(task.programWeek);
//       if (!weekMap[week]) weekMap[week] = [];
//       weekMap[week].push(task);
//     });

//     return weekMap;
//   }, [tasksByZone, currentZone]);

//   const handleLogout = () => {
//     localStorage.removeItem("userSession");
//     toast({ title: "Logged out" });
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b border-border bg-card">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <img src="/logo.png" className="h-14" />
//             <div>
//               <div className="text-lg font-semibold">Horizon Fit</div>
//               <div className="text-sm text-muted-foreground">
//                 15-Week Program — 5 Zones
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="text-sm text-muted-foreground">{userEmail}</div>
//             <Button variant="ghost" size="sm" onClick={handleLogout}>
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         {/* Zones Overview */}
//         <section className="mb-8">
//           <h2 className="text-2xl font-bold mb-3">Program Zones</h2>
//           <div className="flex gap-4">
//             {ZONE_NAMES.map((name, i) => {
//               const z = i + 1;
//               const unlocked = z <= currentZone;
//               return (
//                 <div
//                   key={z}
//                   className={`flex-1 p-4 rounded-lg border ${
//                     unlocked
//                       ? "bg-white border-green-400"
//                       : "bg-gray-100 border-gray-300"
//                   }`}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="text-sm font-medium">{name}</div>
//                     {z < currentZone && (
//                       <CheckCircle2 className="text-green-500" />
//                     )}
//                   </div>
//                   <div className="text-xs text-muted-foreground mt-1">
//                     Zone {z} • 3 weeks
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </section>

//         <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Zone Selector */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Zones</CardTitle>
//               <CardDescription>Click to open your current zone</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {ZONE_NAMES.map((name, i) => {
//                   const z = i + 1;
//                   const unlocked = z <= currentZone;
//                   return (
//                     <div
//                       key={z}
//                       className={`p-3 rounded-md border flex items-center justify-between ${
//                         unlocked
//                           ? "bg-white border-green-400"
//                           : "bg-gray-100 border-gray-300"
//                       }`}
//                     >
//                       <div>
//                         <div className="font-medium">{name}</div>
//                         <div className="text-xs text-muted-foreground">
//                           Zone {z} • 3 weeks
//                         </div>
//                       </div>
//                       <Button
//                         size="sm"
//                         onClick={() => unlocked && setCurrentZone(z)}
//                         disabled={!unlocked}
//                       >
//                         Open
//                       </Button>
//                     </div>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Task View */}
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle>{ZONE_NAMES[currentZone - 1]}</CardTitle>
//               <CardDescription>Diet plan for this zone</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="mb-4 flex gap-2">
//                 {[1, 2, 3].map((w) => (
//                   <Button
//                     key={w}
//                     size="sm"
//                     variant={selectedWeek === w ? "default" : "outline"}
//                     onClick={() => setSelectedWeek(w)}
//                   >
//                     Week {w}
//                   </Button>
//                 ))}
//               </div>

//               {loadingZone === currentZone ? (
//                 <div className="py-8 text-center">
//                   <Loader2 className="mx-auto animate-spin" />
//                   <div className="text-sm text-muted-foreground mt-2">
//                     Loading tasks…
//                   </div>
//                 </div>
//               ) : errorZone ? (
//                 <div className="text-red-600">{errorZone}</div>
//               ) : (
//                 <div className="space-y-4">
//                   {(groupedTasks[selectedWeek] ?? []).length === 0 ? (
//                     <div className="text-sm text-muted-foreground">
//                       No tasks for this week.
//                     </div>
//                   ) : (
//                     groupedTasks[selectedWeek].map((task, idx) => (
//                       <div key={idx} className="border rounded-lg p-4 bg-white">
//                         <div className="font-semibold">{task.description}</div>

//                         <div className="text-sm text-muted-foreground mt-1">
//                           {task.frequency} • {task.timeOfDay}
//                         </div>

//                         <div className="text-sm text-muted-foreground mt-1">
//                           Days: {task.daysApplicable?.join(", ")}
//                         </div>

//                         {/* 🔥 Mark Task Complete Button */}
//                         <Button
//                           className="mt-3"
//                           size="sm"
//                           onClick={async () => {
//                             try {
//                               await api.post(
//                                 `/patients/logTaskCompletion/${task.zone}`,
//                               );

//                               toast({ title: "Task marked as completed!" });

//                               fetchZoneTasks(currentZone);
//                             } catch (err: any) {
//                               toast({
//                                 title: "Completion failed",
//                                 description:
//                                   err.response?.data?.message || err.message,
//                                 variant: "destructive",
//                               });
//                             }
//                           }}
//                         >
//                           Mark Complete
//                         </Button>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </section>
//       </main>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  _id: string;
  description: string;
  programWeek: number;
  zone: number;
  frequency: string;
  daysApplicable: string[];
  timeOfDay: string;
  completed?: boolean;
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

  const [userEmail, setUserEmail] = useState("");
  const [currentZone, setCurrentZone] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [tasksByZone, setTasksByZone] = useState<Record<number, TaskItem[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate progress based on completed tasks
  const progress = useMemo(() => {
    const zoneTasks = tasksByZone[currentZone] ?? [];
    const total = zoneTasks.length;
    const completed = zoneTasks.filter((t: any) => t.completed === true).length;

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [tasksByZone, currentZone]);

  // ----------------------------------------
  // Load Session
  // ----------------------------------------
  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return navigate("/login");

    try {
      const parsed = JSON.parse(session);
      if (parsed.type !== "patient") return navigate("/login");

      setUserEmail(parsed.email);
      setCurrentZone(parsed.currentZone || 1);

      fetchZone(parsed.currentZone || 1);
    } catch {
      navigate("/login");
    }
  }, []);

  // ----------------------------------------
  // Fetch Zone Tasks
  // ----------------------------------------
  const fetchZone = useCallback(async (zone: number) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.get(`/patients/get-zone-task/${zone}`);

      const zoneFromBackend = res.data?.currentZone || zone;
      const tasks = res.data?.task || [];

      setCurrentZone(zoneFromBackend);

      setTasksByZone((prev) => ({
        ...prev,
        [zoneFromBackend]: tasks,
      }));

      const firstWeek = tasks[0]?.programWeek ?? 1;
      setSelectedWeek(firstWeek);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load";
      setErrorMsg(msg);

      // Handle forced zone redirect
      if (err.response?.status === 403 && err.response.data?.nextRequiredZone) {
        const next = err.response.data.nextRequiredZone;
        toast({ title: err.response.data.message });
        fetchZone(next);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------------------
  // Group Tasks by Week
  // ----------------------------------------
  const tasksThisWeek = useMemo(() => {
    const zoneTasks = tasksByZone[currentZone] || [];
    return zoneTasks.filter((t) => t.programWeek === selectedWeek);
  }, [currentZone, selectedWeek, tasksByZone]);

  // ----------------------------------------
  // Logout
  // ----------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    toast({ title: "Logged out" });
    navigate("/login");
  };

  // ----------------------------------------
  // Mark task complete
  // ----------------------------------------
  const markComplete = async (task: TaskItem) => {
    try {
      await api.post(`/patients/logTaskCompletion/${task._id}`);

      toast({ title: "Task completed!" });

      fetchZone(currentZone); // refresh
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  // ----------------------------------------
  // UI Rendering
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between">
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
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Your Progress</h2>

          <div className="p-5 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-medium">
                {ZONE_NAMES[currentZone - 1]} Progress
              </div>
              <div className="text-sm font-semibold text-primary">
                {progress}%
              </div>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Completing all tasks will unlock the next zone.
            </div>
          </div>
        </section>

        {/* ZONE OVERVIEW */}
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
                    unlocked ? "bg-white border-green-400" : "bg-gray-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{name}</span>
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
          {/* ZONE SELECTOR */}
          <Card>
            <CardHeader>
              <CardTitle>Zones</CardTitle>
              <CardDescription>Select a zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ZONE_NAMES.map((name, i) => {
                  const z = i + 1;
                  const unlocked = z <= currentZone;

                  return (
                    <div
                      key={z}
                      className={`p-3 border rounded-md flex justify-between ${
                        unlocked ? "bg-white border-green-400" : "bg-gray-200"
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
                        disabled={!unlocked}
                        onClick={() => fetchZone(z)}
                      >
                        Open
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* TASK VIEW */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{ZONE_NAMES[currentZone - 1]}</CardTitle>
              <CardDescription>Tasks for this zone</CardDescription>
            </CardHeader>

            <CardContent>
              {/* Week Selector */}
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

              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading tasks…
                  </p>
                </div>
              ) : errorMsg ? (
                <p className="text-red-600">{errorMsg}</p>
              ) : tasksThisWeek.length === 0 ? (
                <p className="text-muted-foreground">No tasks for this week</p>
              ) : (
                <div className="space-y-4">
                  {tasksThisWeek.map((task) => (
                    <div
                      key={task._id}
                      className="border p-4 rounded-lg bg-white"
                    >
                      <div className="font-semibold">{task.description}</div>

                      <div className="text-sm text-muted-foreground mt-1">
                        {task.frequency} • {task.timeOfDay}
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        Days: {task.daysApplicable.join(", ")}
                      </div>

                      <Button
                        className="mt-3"
                        size="sm"
                        onClick={async () => {
                          try {
                            await api.post(
                              `/patients/logTaskCompletion/${task._id}`
                            );

                            toast({ title: "Task marked as completed!" });

                            // refresh progress + tasks
                            fetchZone(currentZone);
                          } catch (err: any) {
                            toast({
                              title: "Completion failed",
                              description:
                                err.response?.data?.message || err.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        {task.completed ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
