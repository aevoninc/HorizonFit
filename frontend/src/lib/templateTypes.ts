export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type Frequency = 'Daily' | 'SpecificDays' | 'Weekly' | 'OneTime';

export interface TemplateTask {
  id: string;
  description: string;
  frequency: Frequency;
  daysApplicable: string[];
  timeOfDay: TimeOfDay;
}

export interface TemplateCell {
  programWeek: number;
  zone: number;
  tasks: TemplateTask[];
}

// New grid-based task for weekly allocation
export interface GridTask {
  id: string;
  taskName: string;
  day: string;
  timeSlot: TimeOfDay;
  zone: number;
  week: number;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  matrix: TemplateCell[];
  // New grid-based tasks
  gridTasks?: GridTask[];
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
}

export const WEEKS = Array.from({ length: 4 }, (_, i) => i + 1); // 1-4 weeks for grid view
export const ZONES = [1, 2, 3, 4, 5];
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Afternoon', label: 'Afternoon' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
];

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'Daily', label: 'Daily' },
  { value: 'SpecificDays', label: 'Specific Days' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'OneTime', label: 'One Time' },
];
