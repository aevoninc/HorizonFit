import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Frequency, TimeOfDay } from '@/lib/api';
import { DAYS_OF_WEEK, FREQUENCY_OPTIONS, TIME_OF_DAY_OPTIONS, WEEKS, ZONES } from '@/lib/templateTypes';

export interface TaskFormData {
  description: string;
  programWeek: number;
  zone: number;
  frequency: Frequency;
  daysApplicable: string[];
  timeOfDay: TimeOfDay;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  mode: 'add' | 'edit';
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formData,
  setFormData,
  mode,
}) => {
  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      daysApplicable: prev.daysApplicable.includes(day)
        ? prev.daysApplicable.filter((d) => d !== day)
        : [...prev.daysApplicable, day],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Week <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.programWeek.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, programWeek: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Zone <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.zone.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, zone: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((zone) => (
                    <SelectItem key={zone} value={zone.toString()}>
                      Zone {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Frequency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value as Frequency })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Time of Day <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.timeOfDay}
                onValueChange={(value) =>
                  setFormData({ ...formData, timeOfDay: value as TimeOfDay })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OF_DAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Days Applicable{' '}
              {formData.frequency === 'SpecificDays' && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select one or more days
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                    formData.daysApplicable.includes(day)
                      ? 'border-secondary bg-secondary text-secondary-foreground'
                      : 'border-border bg-background hover:border-secondary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.daysApplicable.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="teal"
              className="flex-1"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === 'add' ? 'Add Task' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
