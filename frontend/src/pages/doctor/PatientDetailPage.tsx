import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Target,
  CheckCircle,
  UserX,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { doctorApi, Task, PatientProgress } from "@/lib/api";
import { AssignProgramModal } from "@/pages/doctor/AssignProgramModal";


const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const zones = [1, 2, 3, 4, 5];
const weeks = [1, 2, 3];

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientProgress | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Add Task Dialog
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeSlots = ["Morning", "Afternoon", "Evening", "Night"];
  const metricSlots = ["Weight Loss", "Weight Gain"];
  const [newTask, setNewTask] = useState({
    name: "",
    zoneId: "",
    weekNumber: "",
    frequency: "",
    dayOfWeek: [] as string[],
    timeSlot: "",
  });

  // Edit Task Dialog
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Deactivate Dialog
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Assign Program Modal
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  // Fetch patient data
  useEffect(() => {
    if (id) {
      fetchPatientProgress();
    }
  }, [id]);

  const fetchPatientProgress = async () => {
    try {
      setIsLoading(true);
      const response = await doctorApi.getPatientProgress(id!);
      setPatientData(response.data);
      console.log("Fetched patient progress:", response.data);
      setTasks(response.data.programTasks || []);
    } catch (error) {
      console.error("Failed to fetch patient progress:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (
      !newTask.name ||
      !newTask.zoneId ||
      !newTask.weekNumber ||
      !newTask.frequency ||
      newTask.dayOfWeek.length === 0
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields including at least one day.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const taskData = {
        description: newTask.name.trim(),
        zone: parseInt(newTask.zoneId),
        programWeek: parseInt(newTask.weekNumber),
        daysApplicable: newTask.dayOfWeek,
        frequency: newTask.frequency as
          | "Daily"
          | "Weekly"
          | "SpecificDays"
          | "OneTime",
        timeOfDay: newTask.timeOfDay,
        metricRequired: newTask.metricRequired || null,
      };

      await doctorApi.allocateTasks(id!, [taskData]);

      toast({
        title: "Task Added",
        description: `Task "${newTask.name}" has been allocated to Zone ${newTask.zoneId}, Week ${newTask.weekNumber}.`,
      });

      setIsAddTaskOpen(false);
      setNewTask({
        name: "",
        zoneId: "",
        weekNumber: "",
        frequency: "",
        dayOfWeek: [],
      });
      fetchPatientProgress();
    } catch (error: any) {
      console.error("Failed to add task:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to add task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      setIsSubmitting(true);
      await doctorApi.updateTask(editingTask.id, {
        // Send the value of editingTask.name (which holds the description)
        // to the API field that it actually expects for the task name/description.
        // Assuming your update API is smart, or you need to map it here:
        // OPTION 1: If your API requires 'description' for the task name
        // description: editingTask.name,

        // OPTION 2: If your API requires 'name' for the task name (despite the fetch data showing 'description')
        description: editingTask.name, // Stick to this unless API explicitly rejects it

        zone: editingTask.zoneId,
        programWeek: editingTask.weekNumber,
        daysApplicable: editingTask.dayOfWeek,
        frequency: editingTask.frequency,
        timeOfDay: editingTask.timeOfDay,
        metricRequired: editingTask.metricRequired,
      });

      toast({
        title: "Task Updated",
        description: `Task "${editingTask.name}" has been updated.`,
      });

      setIsEditTaskOpen(false);
      setEditingTask(null);
      fetchPatientProgress();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    try {
      await doctorApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast({
        title: "Task Deleted",
        description: `"${taskName}" has been removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivatePatient = async () => {
    try {
      setIsSubmitting(true);
      await doctorApi.deactivatePatient(
        id!,
        deactivationReason.trim() || undefined
      );

      toast({
        title: "Patient Deactivated",
        description: "The patient has been deactivated from the program.",
      });

      navigate("/doctor/patients");
    } catch (error: any) {
      console.error("Failed to deactivate patient:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to deactivate patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeactivateOpen(false);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await doctorApi.deletePatient(id!);

      toast({
        title: "Patient Deleted",
        description: "All patient records have been removed.",
      });

      navigate("/doctor/patients");
    } catch (error: any) {
      console.error("Failed to delete patient:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleDay = (day: string, isEdit = false) => {
    if (isEdit && editingTask) {
      setEditingTask((prev) =>
        prev
          ? {
              ...prev,
              dayOfWeek: prev.dayOfWeek.includes(day)
                ? prev.dayOfWeek.filter((d) => d !== day)
                : [...prev.dayOfWeek, day],
            }
          : null
      );
    } else {
      setNewTask((prev) => ({
        ...prev,
        dayOfWeek: prev.dayOfWeek.includes(day)
          ? prev.dayOfWeek.filter((d) => d !== day)
          : [...prev.dayOfWeek, day],
      }));
    }
  };

  const openEditDialog = (task) => {
    // Mapping the API response to the local state structure
    const taskForEdit = {
      // Map _id from API to id expected in component logic
      id: task._id,
      // CRITICAL: Map 'description' from API to 'name' expected by the form
      name: task.description,
      // Map 'zone' from API to 'zoneId' expected by the form
      zoneId: task.zone,
      // Map 'programWeek' from API to 'weekNumber' expected by the form
      weekNumber: task.programWeek,
      // Map 'daysApplicable' from API to 'dayOfWeek' expected by the form
      dayOfWeek: task.daysApplicable,
      frequency: task.frequency,
      metricRequired: task.metricRequired,
      // Include other necessary fields if needed
      // description: task.description, // Keep the original description
    };

    setEditingTask(taskForEdit);
    setIsEditTaskOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const patient = patientData?.patient;
  const progressData = patientData?.weeklyProgress || [];
  const zoneData = patientData?.zoneProgress || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/doctor/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {patient?.name || "Patient"}
          </h1>
          <p className="text-muted-foreground">{patient?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full gradient-phoenix px-4 py-1 text-sm font-semibold text-primary-foreground">
            Zone {patient?.zone || 1}
          </span>
          <span className="text-2xl font-bold text-foreground">
            {patient?.progress || 0}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this patient? They will be
                moved to the deactivated list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Enter reason for deactivation..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDeactivateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="phoenix"
                  className="flex-1"
                  onClick={handleDeactivatePatient}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Deactivate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Patient
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all
                records associated with this patient including tasks, progress
                data, and bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePatient}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="teal" onClick={() => setIsAssignProgramOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Program
        </Button>
      </div>
      {/* Assign Program Modal */}
      <AssignProgramModal
        patientId={id || ""}
        patientName={patientData?.patient?.name || "Patient"}
        isOpen={isAssignProgramOpen}
        onClose={() => setIsAssignProgramOpen(false)}
        onSuccess={fetchPatientProgress}
      />
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="week"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="zone"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="tasks"
                    fill="hsl(var(--muted))"
                    name="Total Tasks"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--secondary))"
                    name="Completed"
                    radius={[4, 4, 0, 0]}
                  />
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
                  <Label>
                    Task Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Enter task name"
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Select Zone <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newTask.zoneId}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, zoneId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone} value={zone.toString()}>
                            Zone {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Select Week <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newTask.weekNumber}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, weekNumber: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select week" />
                      </SelectTrigger>
                      <SelectContent>
                        {weeks.map((week) => (
                          <SelectItem key={week} value={week.toString()}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Frequency <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newTask.frequency}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="SpecificDays">SpecificDays</SelectItem>
                      <SelectItem value="OneTime">OneTime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Time of Day <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newTask.timeOfDay}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, timeOfDay: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* select metric required */}
                <div className="space-y-2">
                  <Label>
                    Select Metric<span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newTask.metricRequired}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, metricRequired: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {metricSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Select Day(s) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select one or more days (multi-select)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <label
                        key={day}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                          newTask.dayOfWeek.includes(day)
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border bg-background hover:border-secondary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={newTask.dayOfWeek.includes(day)}
                          onChange={() => toggleDay(day)}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  variant="teal"
                  className="w-full"
                  onClick={handleAddTask}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
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
                <TableHead>Time Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No tasks allocated yet. Click "Add Task" to allocate tasks.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">
                      {task.description}
                    </TableCell>
                    <TableCell>Zone {task.zone}</TableCell>
                    <TableCell>Week {task.programWeek}</TableCell>
                    <TableCell className="capitalize">
                      {task.frequency}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {task.daysApplicable.map((day) => (
                          <span
                            key={day}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {task.timeOfDay || "Not set"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Target className="h-3 w-3" />
                        )}
                        {task.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {task.description}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteTask(task._id, task.description)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>
                  Task Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Enter task name"
                  value={editingTask.name}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, name: e.target.value })
                  }
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Select Zone <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editingTask.zoneId.toString()}
                    onValueChange={(value) =>
                      setEditingTask({
                        ...editingTask,
                        zoneId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone.toString()}>
                          Zone {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Select Week <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editingTask.weekNumber.toString()}
                    onValueChange={(value) =>
                      setEditingTask({
                        ...editingTask,
                        weekNumber: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {weeks.map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Frequency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingTask.frequency}
                  onValueChange={(value) =>
                    setEditingTask({
                      ...editingTask,
                      frequency: value as Task["frequency"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="SpecificDays">SpecificDays</SelectItem>
                    <SelectItem value="OneTime">OneTime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Time of Day <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingTask.timeOfDay}
                  onValueChange={(value) =>
                    setEditingTask({ ...editingTask, timeOfDay: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Select Day(s) <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <label
                      key={day}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                        editingTask.dayOfWeek.includes(day)
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-background hover:border-secondary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={editingTask.dayOfWeek.includes(day)}
                        onChange={() => toggleDay(day, true)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditTaskOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="teal"
                  className="flex-1"
                  onClick={handleEditTask}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
