import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Lock, Target, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

interface DayData {
  day: string;
  dayIndex: number;
  tasks: Task[];
}

interface WeekData {
  week: number;
  days: DayData[];
}

interface ZoneData {
  zone: number;
  title: string;
  accessible: boolean;
  weeks: WeekData[];
}

// Generate mock data with Zone → Week → Day → Task structure
const generateMockData = (): ZoneData[] => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const taskTemplates = [
    { name: 'Morning Stretching', description: '10 minutes of dynamic stretching' },
    { name: 'Cardio Session', description: '20 minutes walk or light jog' },
    { name: 'Core Workout', description: 'Plank holds and basic core work' },
    { name: 'Strength Training', description: 'Bodyweight exercises' },
    { name: 'Flexibility Work', description: 'Yoga flow - 20 minutes' },
    { name: 'HIIT Session', description: 'High intensity interval training' },
    { name: 'Recovery Walk', description: 'Light 15 minute walk' },
    { name: 'Balance Exercises', description: 'Single leg stands and balance work' },
  ];

  let taskId = 1;

  return [1, 2, 3, 4, 5].map((zoneNum) => ({
    zone: zoneNum,
    title: ['Foundation', 'Progression', 'Endurance', 'Mastery', 'Excellence'][zoneNum - 1],
    accessible: zoneNum <= 3,
    weeks: [1, 2, 3].map((weekNum) => ({
      week: weekNum,
      days: dayNames.map((day, dayIndex) => ({
        day,
        dayIndex,
        tasks: zoneNum <= 3
          ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
              const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
              return {
                id: `task-${taskId++}`,
                name: template.name,
                description: template.description,
                completed: zoneNum === 1 ? Math.random() > 0.2 : zoneNum === 2 ? Math.random() > 0.5 : Math.random() > 0.7,
              };
            })
          : [],
      })),
    })),
  }));
};

const mockZoneData = generateMockData();

export const PatientTasksPage: React.FC = () => {
  const [activeZone, setActiveZone] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0); // 0 = Mon
  const [tasks, setTasks] = useState(mockZoneData);
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
    setActiveZone(zone.zone);
    setActiveWeek(1);
    setActiveDay(0);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks((prev) =>
      prev.map((zone) => ({
        ...zone,
        weeks: zone.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            tasks: day.tasks.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          })),
        })),
      }))
    );

    toast({
      title: 'Task Updated!',
      description: 'Your progress has been saved.',
    });
  };

  const currentZone = tasks.find((z) => z.zone === activeZone);
  const currentWeek = currentZone?.weeks.find((w) => w.week === activeWeek);
  const currentDay = currentWeek?.days.find((d) => d.dayIndex === activeDay);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate completion stats
  const getDayCompletionStatus = (zone: number, week: number, dayIndex: number) => {
    const zoneData = tasks.find((z) => z.zone === zone);
    const weekData = zoneData?.weeks.find((w) => w.week === week);
    const dayData = weekData?.days.find((d) => d.dayIndex === dayIndex);
    if (!dayData || dayData.tasks.length === 0) return 'empty';
    const allCompleted = dayData.tasks.every((t) => t.completed);
    const someCompleted = dayData.tasks.some((t) => t.completed);
    if (allCompleted) return 'completed';
    if (someCompleted) return 'partial';
    return 'pending';
  };

  const totalTasks = tasks.reduce(
    (acc, zone) =>
      acc +
      zone.weeks.reduce(
        (wAcc, week) =>
          wAcc + week.days.reduce((dAcc, day) => dAcc + day.tasks.length, 0),
        0
      ),
    0
  );

  const completedTasks = tasks.reduce(
    (acc, zone) =>
      acc +
      zone.weeks.reduce(
        (wAcc, week) =>
          wAcc +
          week.days.reduce(
            (dAcc, day) => dAcc + day.tasks.filter((t) => t.completed).length,
            0
          ),
        0
      ),
    0
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
                {completedTasks} / {totalTasks} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">
                Zone {activeZone} • Week {activeWeek} • {dayNames[activeDay]}
              </span>
            </div>
          </div>
          <Progress value={(completedTasks / totalTasks) * 100} className="mt-4 h-3" />
        </CardContent>
      </Card>

      {/* Zone Navigation (Top) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Select Zone</h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {tasks.map((zone) => (
              <button
                key={zone.zone}
                onClick={() => handleZoneClick(zone)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 min-w-[100px] ${
                  zone.accessible
                    ? activeZone === zone.zone
                      ? 'border-secondary bg-secondary/10 shadow-teal'
                      : 'border-border bg-card hover:border-secondary/50 hover:shadow-sm'
                    : 'cursor-not-allowed border-border/50 bg-muted/50 opacity-60'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    zone.accessible
                      ? activeZone === zone.zone
                        ? 'gradient-phoenix'
                        : 'bg-secondary/20'
                      : 'bg-muted'
                  }`}
                >
                  {!zone.accessible ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : activeZone === zone.zone ? (
                    <span className="font-bold text-primary-foreground">{zone.zone}</span>
                  ) : (
                    <span className="font-bold text-secondary">{zone.zone}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{zone.title}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Week Navigation (Middle) */}
      {currentZone?.accessible && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Select Week</h3>
          <div className="flex gap-2">
            {[1, 2, 3].map((week) => (
              <Button
                key={week}
                variant={activeWeek === week ? 'teal' : 'outline'}
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

      {/* Day Navigation (Third Level) */}
      {currentZone?.accessible && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Select Day</h3>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {dayNames.map((day, index) => {
                const status = getDayCompletionStatus(activeZone, activeWeek, index);
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(index)}
                    className={`relative flex flex-col items-center gap-1 rounded-lg border px-4 py-3 transition-all duration-200 min-w-[60px] ${
                      activeDay === index
                        ? 'border-secondary bg-secondary/10 shadow-sm'
                        : 'border-border bg-card hover:border-secondary/50'
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{day}</span>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        status === 'completed'
                          ? 'bg-green-500'
                          : status === 'partial'
                          ? 'bg-yellow-500'
                          : status === 'pending'
                          ? 'bg-red-400'
                          : 'bg-muted'
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

      {/* Task List (Bottom) */}
      <AnimatePresence mode="wait">
        {currentZone?.accessible ? (
          <motion.div
            key={`${activeZone}-${activeWeek}-${activeDay}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {dayNames[activeDay]}'s Tasks
              </h2>
              <span className="text-sm text-muted-foreground">
                {currentDay?.tasks.filter((t) => t.completed).length || 0} /{' '}
                {currentDay?.tasks.length || 0} completed
              </span>
            </div>

            {currentDay?.tasks && currentDay.tasks.length > 0 ? (
              <div className="space-y-3">
                {currentDay.tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`card-elevated transition-all duration-200 ${
                        task.completed ? 'bg-green-50/50 border-green-200' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            id={task.id}
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                            className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={task.id}
                              className={`font-semibold cursor-pointer ${
                                task.completed ? 'text-green-700 line-through' : 'text-foreground'
                              }`}
                            >
                              {task.name}
                            </label>
                            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                          </div>
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              task.completed ? 'bg-green-100' : 'bg-secondary/10'
                            }`}
                          >
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Target className="h-5 w-5 text-secondary" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="card-elevated">
                <CardContent className="py-12 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">No tasks for this day</p>
                  <p className="text-sm text-muted-foreground">Enjoy your rest day!</p>
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
            <h3 className="text-xl font-semibold text-foreground">Zone Locked</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Complete all tasks in Zone {activeZone - 1} to unlock{' '}
              {currentZone?.title || 'this zone'}. Keep pushing forward!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
