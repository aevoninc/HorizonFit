import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data
const mockPatient = {
  id: '1',
  name: 'John Smith',
  email: 'john@example.com',
  zone: 3,
  progress: 67,
  enrolledDate: '2024-01-15',
};

const mockTasks = [
  { id: '1', name: 'Morning Cardio', zone: 1, frequency: 'daily', programWeek: 2, status: 'completed', daysApplicable: ['Mon', 'Wed', 'Fri'] },
  { id: '2', name: 'Strength Training', zone: 2, frequency: 'weekly', programWeek: 3, status: 'pending', daysApplicable: ['Tue', 'Thu'] },
  { id: '3', name: 'Core Workout', zone: 3, frequency: 'daily', programWeek: 4, status: 'in-progress', daysApplicable: ['Mon', 'Wed', 'Fri', 'Sat'] },
];

const progressData = [
  { week: 'Week 1', completion: 45 },
  { week: 'Week 2', completion: 52 },
  { week: 'Week 3', completion: 61 },
  { week: 'Week 4', completion: 58 },
  { week: 'Week 5', completion: 72 },
  { week: 'Week 6', completion: 67 },
];

const zoneData = [
  { zone: 'Zone 1', tasks: 8, completed: 8 },
  { zone: 'Zone 2', tasks: 10, completed: 9 },
  { zone: 'Zone 3', tasks: 12, completed: 5 },
  { zone: 'Zone 4', tasks: 0, completed: 0 },
  { zone: 'Zone 5', tasks: 0, completed: 0 },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    zone: '',
    frequency: '',
    programWeek: '',
    daysApplicable: [] as string[],
  });

  const handleAddTask = () => {
    if (!newTask.name || !newTask.zone || !newTask.frequency) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Task Added',
      description: `Task "${newTask.name}" has been allocated.`,
    });
    setIsAddTaskOpen(false);
    setNewTask({ name: '', zone: '', frequency: '', programWeek: '', daysApplicable: [] });
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    toast({
      title: 'Task Deleted',
      description: `"${taskName}" has been removed.`,
    });
  };

  const toggleDay = (day: string) => {
    setNewTask((prev) => ({
      ...prev,
      daysApplicable: prev.daysApplicable.includes(day)
        ? prev.daysApplicable.filter((d) => d !== day)
        : [...prev.daysApplicable, day],
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/doctor/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{mockPatient.name}</h1>
          <p className="text-muted-foreground">{mockPatient.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full gradient-phoenix px-4 py-1 text-sm font-semibold text-primary-foreground">
            Zone {mockPatient.zone}
          </span>
          <span className="text-2xl font-bold text-foreground">{mockPatient.progress}%</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Zone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="zone" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--muted))" name="Total Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Management */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Task Allocation</CardTitle>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="teal">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Allocate New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Task Name</Label>
                  <Input
                    placeholder="Enter task name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Select
                      value={newTask.zone}
                      onValueChange={(value) => setNewTask({ ...newTask, zone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((zone) => (
                          <SelectItem key={zone} value={zone.toString()}>
                            Zone {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Program Week</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      placeholder="1-15"
                      value={newTask.programWeek}
                      onChange={(e) => setNewTask({ ...newTask, programWeek: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newTask.frequency}
                    onValueChange={(value) => setNewTask({ ...newTask, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Days Applicable</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <label
                        key={day}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                          newTask.daysApplicable.includes(day)
                            ? 'border-secondary bg-secondary text-secondary-foreground'
                            : 'border-border bg-background hover:border-secondary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={newTask.daysApplicable.includes(day)}
                          onChange={() => toggleDay(day)}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <Button variant="teal" className="w-full" onClick={handleAddTask}>
                  Allocate Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>Zone {task.zone}</TableCell>
                  <TableCell>Week {task.programWeek}</TableCell>
                  <TableCell className="capitalize">{task.frequency}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {task.daysApplicable.map((day) => (
                        <span key={day} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {day}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Target className="h-3 w-3" />
                      )}
                      {task.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteTask(task.id, task.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};
