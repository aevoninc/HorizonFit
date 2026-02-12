import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/lib/api';

interface TaskMatrixCellProps {
  programWeek: number;
  zone: number;
  tasks: Task[];
  onAddTask: (programWeek: number, zone: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, description: string) => void;
}

export const TaskMatrixCell: React.FC<TaskMatrixCellProps> = ({
  programWeek,
  zone,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const cellTasks = tasks.filter(
    (t) => t.programWeek === programWeek && t.zone === zone
  );

  return (
    <div className="min-h-[80px] border border-border rounded-md p-2 bg-card hover:bg-muted/30 transition-colors">
      {cellTasks.length === 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-full min-h-[60px] border-2 border-dashed border-muted-foreground/30 hover:border-secondary hover:bg-secondary/10"
          onClick={() => onAddTask(programWeek, zone)}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
      ) : (
        <div className="space-y-2">
          {cellTasks.map((task) => (
            <div
              key={task.id}
              className="group relative rounded bg-secondary/10 p-2 text-xs border border-secondary/20"
            >
              <div className="pr-12">
                <p className="font-medium text-foreground truncate">{task.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {task.frequency}
                  </span>
                  <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {task.timeOfDay}
                  </span>
                </div>
                {task.daysApplicable && task.daysApplicable.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {task.daysApplicable.map((day) => (
                      <span key={day} className="text-[9px] text-muted-foreground">
                        {day}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEditTask(task)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteTask(task.id, task.description)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-xs text-muted-foreground hover:text-secondary"
            onClick={() => onAddTask(programWeek, zone)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};
