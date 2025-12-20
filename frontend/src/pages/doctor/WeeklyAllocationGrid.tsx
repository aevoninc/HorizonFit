import { useState } from 'react';
import { Plus, X, Sun, Sunset, Moon, CloudMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeOfDay } from '@/lib/templateTypes';

export interface GridTask {
  id: string;
  taskName: string;
  day: string;
  timeSlot: TimeOfDay;
  zone: number;
  week: number;
}

interface WeeklyAllocationGridProps {
  tasks: GridTask[];
  week: number;
  zone: number;
  onAddTask: (task: Omit<GridTask, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
}

const TIME_SLOTS: { value: TimeOfDay; label: string; icon: React.ReactNode }[] = [
  { value: 'Morning', label: 'Morning', icon: <Sun className="h-4 w-4 text-amber-500" /> },
  { value: 'Afternoon', label: 'Afternoon', icon: <Sunset className="h-4 w-4 text-orange-500" /> },
  { value: 'Evening', label: 'Evening', icon: <Moon className="h-4 w-4 text-indigo-500" /> },
  { value: 'Night', label: 'Night', icon: <CloudMoon className="h-4 w-4 text-slate-400" /> },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyAllocationGrid: React.FC<WeeklyAllocationGridProps> = ({
  tasks,
  week,
  zone,
  onAddTask,
  onDeleteTask,
}) => {
  const [openCell, setOpenCell] = useState<{ day: string; timeSlot: TimeOfDay } | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  console.log(tasks)
  const getCellTasks = (day: string, timeSlot: TimeOfDay) => {
    return tasks.filter(
      (t) => t.day === day && t.timeSlot === timeSlot && t.week === week && t.zone === zone
    );
  };

  const handleAddTask = (day: string, timeSlot: TimeOfDay) => {
    if (!newTaskName.trim()) return;
    
    onAddTask({
      taskName: newTaskName.trim(),
      day,
      timeSlot,
      zone,
      week,
    });
    
    setNewTaskName('');
    setOpenCell(null);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted border-b border-r border-border p-3 text-left text-sm font-semibold text-foreground min-w-[120px]">
              Time / Day
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="border-b border-r border-border p-3 text-center text-sm font-semibold text-foreground min-w-[120px]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIndex) => (
            <tr key={slot.value} className={slotIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
              <td className="sticky left-0 z-10 border-b border-r border-border p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  {slot.icon}
                  <span className="text-sm font-medium text-foreground">{slot.label}</span>
                </div>
              </td>
              {DAYS.map((day) => {
                const cellTasks = getCellTasks(day, slot.value);
                const isOpen = openCell?.day === day && openCell?.timeSlot === slot.value;

                return (
                  <td
                    key={day}
                    className="border-b border-r border-border p-2 align-top min-h-[100px] transition-colors hover:bg-secondary/5"
                  >
                    <div className="min-h-[80px] flex flex-col gap-1.5">
                      {/* Task Pills */}
                      <ScrollArea className="flex-1 max-h-[120px]">
                        <div className="flex flex-col gap-1.5 pr-2">
                          {cellTasks.map((task) => (
                            <div
                              key={task.id}
                              className="group relative flex items-center justify-between gap-1 rounded-md bg-secondary/15 border border-secondary/30 px-2 py-1.5 text-xs transition-all hover:bg-secondary/25"
                            >
                              <span className="text-foreground font-medium truncate flex-1">
                                {task.taskName}
                              </span>
                              <button
                                onClick={() => onDeleteTask(task._id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full p-0.5 hover:bg-destructive/20"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Add Task Button */}
                      <Popover open={isOpen} onOpenChange={(open) => {
                        if (open) {
                          setOpenCell({ day, timeSlot: slot.value });
                          setNewTaskName('');
                        } else {
                          setOpenCell(null);
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-secondary hover:text-secondary hover:bg-secondary/10"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-popover border-border" align="start">
                          <div className="space-y-3">
                            <div className="text-xs text-muted-foreground">
                              {slot.label} - {day}
                            </div>
                            <Input
                              placeholder="Enter task name..."
                              value={newTaskName}
                              onChange={(e) => setNewTaskName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTask(day, slot.value);
                                }
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setOpenCell(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="teal"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleAddTask(day, slot.value)}
                                disabled={!newTaskName.trim()}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
