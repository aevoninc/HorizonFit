import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Lock, Target, Flame, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  dueDate: string;
}

interface ZoneData {
  zone: number;
  title: string;
  accessible: boolean;
  progress: number;
  tasks: Task[];
}

const mockZoneData: ZoneData[] = [
  {
    zone: 1,
    title: 'Foundation',
    accessible: true,
    progress: 100,
    tasks: [
      { id: '1', name: 'Morning Stretching', description: '10 minutes of dynamic stretching', completed: true, dueDate: '2024-12-14' },
      { id: '2', name: 'Basic Cardio', description: '20 minutes walk or light jog', completed: true, dueDate: '2024-12-14' },
      { id: '3', name: 'Core Activation', description: 'Plank holds and basic core work', completed: true, dueDate: '2024-12-15' },
    ],
  },
  {
    zone: 2,
    title: 'Progression',
    accessible: true,
    progress: 75,
    tasks: [
      { id: '4', name: 'Interval Training', description: 'HIIT session - 15 minutes', completed: true, dueDate: '2024-12-14' },
      { id: '5', name: 'Strength Basics', description: 'Bodyweight exercises', completed: true, dueDate: '2024-12-15' },
      { id: '6', name: 'Flexibility Work', description: 'Yoga flow - 20 minutes', completed: false, dueDate: '2024-12-16' },
      { id: '7', name: 'Endurance Build', description: 'Sustained cardio - 30 minutes', completed: false, dueDate: '2024-12-16' },
    ],
  },
  {
    zone: 3,
    title: 'Endurance',
    accessible: true,
    progress: 33,
    tasks: [
      { id: '8', name: 'Long Distance Run', description: '5K at moderate pace', completed: true, dueDate: '2024-12-15' },
      { id: '9', name: 'Circuit Training', description: 'Full body circuit - 3 rounds', completed: false, dueDate: '2024-12-16' },
      { id: '10', name: 'Recovery Session', description: 'Foam rolling and stretching', completed: false, dueDate: '2024-12-17' },
    ],
  },
  {
    zone: 4,
    title: 'Mastery',
    accessible: false,
    progress: 0,
    tasks: [],
  },
  {
    zone: 5,
    title: 'Excellence',
    accessible: false,
    progress: 0,
    tasks: [],
  },
];

export const PatientTasksPage: React.FC = () => {
  const [activeZone, setActiveZone] = useState('1');
  const { toast } = useToast();

  const handleZoneClick = (zone: ZoneData) => {
    if (!zone.accessible) {
      toast({
        title: 'Zone Locked',
        description: `Complete Zone ${zone.zone - 1} to unlock ${zone.title}.`,
        variant: 'destructive',
      });
      return;
    }
    setActiveZone(zone.zone.toString());
  };

  const handleCompleteTask = (taskId: string, taskName: string) => {
    toast({
      title: 'Task Completed!',
      description: `Great job completing "${taskName}"!`,
    });
  };

  const currentZone = mockZoneData.find((z) => z.zone.toString() === activeZone);
  const totalCompleted = mockZoneData.reduce(
    (acc, zone) => acc + zone.tasks.filter((t) => t.completed).length,
    0
  );
  const totalTasks = mockZoneData.reduce((acc, zone) => acc + zone.tasks.length, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="mt-1 text-muted-foreground">Complete your daily tasks to progress through zones</p>
      </div>

      {/* Overall Progress */}
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-3xl font-bold text-foreground">
                {totalCompleted} / {totalTasks} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">Zone {activeZone}</span>
            </div>
          </div>
          <Progress value={(totalCompleted / totalTasks) * 100} className="mt-4 h-3" />
        </CardContent>
      </Card>

      {/* Zone Tabs */}
      <Tabs value={activeZone} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 gap-2 bg-transparent p-0 h-auto">
          {mockZoneData.map((zone) => (
            <button
              key={zone.zone}
              onClick={() => handleZoneClick(zone)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
                zone.accessible
                  ? activeZone === zone.zone.toString()
                    ? 'border-secondary bg-secondary/10 shadow-teal'
                    : 'border-border bg-card hover:border-secondary/50 hover:shadow-sm'
                  : 'cursor-not-allowed border-border/50 bg-muted/50 opacity-60'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  zone.accessible
                    ? zone.progress === 100
                      ? 'gradient-phoenix'
                      : 'bg-secondary/20'
                    : 'bg-muted'
                }`}
              >
                {!zone.accessible ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : zone.progress === 100 ? (
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <span className="font-bold text-secondary">{zone.zone}</span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground">{zone.title}</span>
              {zone.accessible && (
                <span className="text-xs text-muted-foreground">{zone.progress}%</span>
              )}
            </button>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {mockZoneData.map((zone) => (
            <TabsContent key={zone.zone} value={zone.zone.toString()} className="mt-6">
              {zone.accessible ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Zone {zone.zone}: {zone.title}</h2>
                    <span className="text-sm text-muted-foreground">
                      {zone.tasks.filter((t) => t.completed).length} / {zone.tasks.length} completed
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {zone.tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`card-elevated transition-all duration-200 ${
                            task.completed ? 'bg-green-50/50 border-green-200' : ''
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                  task.completed ? 'bg-green-100' : 'bg-secondary/10'
                                }`}
                              >
                                {task.completed ? (
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                  <Target className="h-6 w-6 text-secondary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3
                                  className={`font-semibold ${
                                    task.completed ? 'text-green-700 line-through' : 'text-foreground'
                                  }`}
                                >
                                  {task.name}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                                <p className="mt-2 text-xs text-muted-foreground">Due: {task.dueDate}</p>
                              </div>
                            </div>
                            {!task.completed && (
                              <Button
                                variant="phoenix"
                                size="sm"
                                className="mt-4 w-full"
                                onClick={() => handleCompleteTask(task.id, task.name)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Log Completion
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
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
                  <h3 className="text-xl font-semibold text-foreground">Zone Locked</h3>
                  <p className="mt-2 max-w-md text-muted-foreground">
                    Complete all tasks in Zone {zone.zone - 1} to unlock {zone.title}. Keep pushing forward!
                  </p>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};
