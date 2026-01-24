// Normal Plan Types - Zone-based self-guided wellness program

export interface BodyMetrics {
  id?: string;
  weight: number; // kg
  bodyFatPercentage: number; // %
  visceralFat: number; // 1-59 scale
  loggedAt: string;
  zoneNumber: number;
}

export interface HealthRecommendations {
  dailyCalories: number;
  waterIntake: number; // liters
  sleepDuration: number; // hours
  sleepSchedule: { bedTime: string; wakeTime: string };
  exerciseMinutes: number;
  exerciseType: string;
  meditationMinutes: number;
  mindsetTip: string;
}

export interface DIYTask {
  id: string;
  category: 'nutrition' | 'exercise' | 'hydration' | 'sleep' | 'mindset';
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
}

export interface ZoneData {
  zoneNumber: number;
  zoneName: string;
  zoneDescription: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  videosCompleted: boolean;
  requiredVideos: ZoneVideo[];
  diyTasks: DIYTask[];
  weeksInZone: number; // Track weeks spent in zone
  minWeeksRequired: number; // Minimum weeks before unlocking next zone
}

export interface ZoneVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string; // e.g., "12:30"
  isWatched: boolean;
  isRequired: boolean;
  zoneNumber: number;
  order: number;
}

export interface HorizonGuideVideo {
  id: string;
  category: 'calories' | 'workouts' | 'hydration' | 'sleep' | 'mindset';
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string;
  order: number;
}

export interface WeeklyLog {
  id?: string;
  weekNumber: number;
  zoneNumber: number;
  metrics: BodyMetrics;
  compliance: 'excellent' | 'good' | 'fair' | 'poor';
  completedTasks: number;
  totalTasks: number;
  notes?: string;
  submittedAt: string;
}

export interface NormalPlanProgress {
  patientId: string;
  currentZone: number;
  zones: ZoneData[];
  latestMetrics?: BodyMetrics;
  recommendations?: HealthRecommendations;
  weeklyLogs: WeeklyLog[];
  totalWeeksCompleted: number;
  programCompleted: boolean;
}

// Zone definitions with names and descriptions
export const ZONE_DEFINITIONS = [
  {
    zoneNumber: 1,
    zoneName: 'Foundation',
    zoneDescription: 'Build healthy habits and establish your baseline metrics',
    minWeeksRequired: 2,
  },
  {
    zoneNumber: 2,
    zoneName: 'Adaptation',
    zoneDescription: 'Adapt your lifestyle to new routines and patterns',
    minWeeksRequired: 2,
  },
  {
    zoneNumber: 3,
    zoneName: 'Momentum',
    zoneDescription: 'Build momentum with consistent progress',
    minWeeksRequired: 2,
  },
  {
    zoneNumber: 4,
    zoneName: 'Transformation',
    zoneDescription: 'Experience visible transformation in your health',
    minWeeksRequired: 2,
  },
  {
    zoneNumber: 5,
    zoneName: 'Mastery',
    zoneDescription: 'Master your health and sustain lasting results',
    minWeeksRequired: 3,
  },
];

// DIY Tasks per zone (system-generated, constant per zone)
export const ZONE_DIY_TASKS: Record<number, Omit<DIYTask, 'id' | 'isCompleted'>[]> = {
  1: [
    { category: 'nutrition', title: 'Track all meals', description: 'Log everything you eat today', icon: 'UtensilsCrossed' },
    { category: 'hydration', title: 'Drink 2L water', description: 'Stay hydrated throughout the day', icon: 'Droplets' },
    { category: 'exercise', title: '15 min walk', description: 'Take a gentle 15-minute walk', icon: 'Footprints' },
    { category: 'sleep', title: 'Sleep by 11 PM', description: 'Get to bed on time', icon: 'Moon' },
    { category: 'mindset', title: '5 min breathing', description: 'Practice deep breathing exercises', icon: 'Wind' },
  ],
  2: [
    { category: 'nutrition', title: 'Balanced breakfast', description: 'Start with a protein-rich breakfast', icon: 'Egg' },
    { category: 'hydration', title: 'Drink 2.5L water', description: 'Increase water intake', icon: 'Droplets' },
    { category: 'exercise', title: '20 min cardio', description: 'Light cardio activity', icon: 'Heart' },
    { category: 'sleep', title: 'No screens 1hr before bed', description: 'Digital detox before sleep', icon: 'MonitorOff' },
    { category: 'mindset', title: '10 min meditation', description: 'Guided meditation session', icon: 'Brain' },
  ],
  3: [
    { category: 'nutrition', title: 'Meal prep', description: 'Prepare healthy meals for the week', icon: 'ChefHat' },
    { category: 'hydration', title: 'Drink 3L water', description: 'Optimal hydration level', icon: 'Droplets' },
    { category: 'exercise', title: '30 min workout', description: 'Structured workout session', icon: 'Dumbbell' },
    { category: 'sleep', title: '7+ hours sleep', description: 'Prioritize quality sleep', icon: 'BedDouble' },
    { category: 'mindset', title: 'Gratitude journal', description: 'Write 3 things you\'re grateful for', icon: 'BookHeart' },
  ],
  4: [
    { category: 'nutrition', title: 'Macro tracking', description: 'Track protein, carbs, and fats', icon: 'Calculator' },
    { category: 'hydration', title: 'Electrolyte balance', description: 'Add electrolytes to water', icon: 'Sparkles' },
    { category: 'exercise', title: '45 min training', description: 'Intensive training session', icon: 'Flame' },
    { category: 'sleep', title: 'Sleep routine', description: 'Follow your sleep schedule precisely', icon: 'Clock' },
    { category: 'mindset', title: 'Visualization', description: 'Visualize your health goals', icon: 'Eye' },
  ],
  5: [
    { category: 'nutrition', title: 'Intuitive eating', description: 'Eat mindfully and intuitively', icon: 'Leaf' },
    { category: 'hydration', title: 'Optimal hydration', description: 'Personalized water intake', icon: 'Droplets' },
    { category: 'exercise', title: '60 min activity', description: 'Full fitness routine', icon: 'Trophy' },
    { category: 'sleep', title: 'Sleep mastery', description: 'Optimize sleep quality', icon: 'Star' },
    { category: 'mindset', title: 'Mindfulness practice', description: 'Daily mindfulness exercises', icon: 'Flower2' },
  ],
};

// Compliance options for weekly logs
export const COMPLIANCE_OPTIONS = [
  { value: 'excellent', label: 'Excellent (90-100%)', color: 'bg-green-500' },
  { value: 'good', label: 'Good (70-89%)', color: 'bg-blue-500' },
  { value: 'fair', label: 'Fair (50-69%)', color: 'bg-yellow-500' },
  { value: 'poor', label: 'Needs Improvement (<50%)', color: 'bg-red-500' },
];

// Horizon Guide categories
export const HORIZON_GUIDE_CATEGORIES = [
  { value: 'calories', label: 'How to Calculate Calories', icon: 'Calculator' },
  { value: 'workouts', label: 'How to Structure Workouts', icon: 'Dumbbell' },
  { value: 'hydration', label: 'Hydration Planning', icon: 'Droplets' },
  { value: 'sleep', label: 'Sleep Optimization', icon: 'Moon' },
  { value: 'mindset', label: 'Mindset & Habit Building', icon: 'Brain' },
];
