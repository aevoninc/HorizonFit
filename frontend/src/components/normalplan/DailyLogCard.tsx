import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Save,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  ThumbsDown,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DIYTask } from '@/lib/normalPlanTypes';
import { normalPlanPatientApi, DailyLog } from '@/lib/normalPlanApi';

interface DailyLogCardProps {
  tasks: DIYTask[];
  currentZone: number;
  onTasksUpdate: (tasks: DIYTask[]) => void;
}

const moodOptions = [
  { value: 'great', label: 'Great', icon: ThumbsUp, color: 'text-green-500 bg-green-500/10' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'okay', label: 'Okay', icon: Meh, color: 'text-yellow-500 bg-yellow-500/10' },
  { value: 'bad', label: 'Bad', icon: Frown, color: 'text-orange-500 bg-orange-500/10' },
  { value: 'terrible', label: 'Terrible', icon: ThumbsDown, color: 'text-red-500 bg-red-500/10' },
] as const;

export const DailyLogCard: React.FC<DailyLogCardProps> = ({
  tasks,
  currentZone,
  onTasksUpdate,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  useEffect(() => {
    fetchTodayLog();
  }, []);

  const fetchTodayLog = async () => {
    try {
      setIsLoading(true);
      const response = await normalPlanPatientApi.getTodayLog();
      console.log(response)
      if (response.data) {
        setTodayLog(response.data);
        setSelectedMood(response.data.mood || '');
        setNotes(response.data.notes || '');
        // Update tasks based on today's log
        if (response.data.completedTasks) {
          const completedIds = response.data.completedTasks.map(t => t._id);
          const updatedTasks = tasks.map(task => ({
            ...task,
            isCompleted: completedIds.includes(task._id),
          }));
          onTasksUpdate(updatedTasks);
        }
      }
    } catch (error) {
      console.error('Failed to fetch today log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task._id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    onTasksUpdate(updatedTasks);
    setHasChanges(true);
  };

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    setIsSaving(true);
    
    try {
      const completedTaskIds = tasks.filter(t => t.isCompleted).map(t => t._id);
      const response = await normalPlanPatientApi.submitDailyLog({
        completedTaskIds,
        notes: notes || undefined,
        mood: selectedMood || undefined,
      });
      
      if (response.data.success) {
        setTodayLog(response.data.log);
        setHasChanges(false);
        toast({
          title: response.data.updated ? 'Daily Log Updated!' : 'Daily Log Saved!',
          description: 'Your progress has been recorded for today.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save daily log.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-secondary" />
              Daily Activity Log
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {today}
            </Badge>
          </div>
          {todayLog && (
            <p className="text-xs text-muted-foreground">
              Last saved: {new Date(todayLog.createdAt).toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Today's Progress</span>
              <Badge variant="secondary">
                {completedCount}/{tasks.length} Tasks
              </Badge>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full gradient-phoenix"
              />
            </div>
          </div>

          {/* Task Checklist */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Today's Tasks</p>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    task.isCompleted 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => handleTaskToggle(task._id)}
                    className="h-5 w-5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.description}
                    </p>
                  </div>
                  {task.isCompleted && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>



          {/* Save Button */}
          <Button
            onClick={handleSaveClick}
            disabled={isSaving || !hasChanges}
            className="w-full gradient-phoenix text-primary-foreground"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {todayLog ? 'Update Daily Log' : 'Save Daily Log'}
              </>
            )}
          </Button>

          {hasChanges && (
            <p className="text-xs text-center text-amber-600">
              You have unsaved changes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Daily Log
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="block font-medium text-foreground mb-2">
                Your daily log will be saved with the following:
              </span>
              <span className="text-muted-foreground">
                • {completedCount} of {tasks.length} tasks completed
                {selectedMood && (
                  <>
                    <br />• Mood: {moodOptions.find(m => m.value === selectedMood)?.label}
                  </>
                )}
                {notes && (
                  <>
                    <br />• Notes included
                  </>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} className="gradient-phoenix text-primary-foreground">
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
