// Normal Plan API - Frontend API calls for Normal Plan feature
import { api } from './api';
import { 
  BodyMetrics, 
  HealthRecommendations, 
  WeeklyLog, 
  ZoneVideo,
  HorizonGuideVideo,
  DIYTask,
  NormalPlanProgress
} from './normalPlanTypes';

// ==================== PATIENT API ====================

export interface CanEnterMetricsResponse {
  canEnter: boolean;
  reason: 'videos_incomplete' | 'weekly_limit' | null;
  message: string;
  lastEntryDate?: string;
  daysRemaining?: number;
}

export interface SubmitMetricsResponse {
  success: boolean;
  metrics: BodyMetrics;
  recommendations: HealthRecommendations;
  nextEntryDate: string;
}

export interface DailyLog {
  id: string;
  patientId: string;
  zoneNumber: number;
  date: string;
  completedTasks: DIYTask[];
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  createdAt: string;
}

export const normalPlanPatientApi = {
  // Get full progress
  getProgress: () => 
    api.get<NormalPlanProgress & { 
      canEnterMetrics: boolean; 
      daysSinceLastMetrics: number;
      daysUntilNextMetrics: number;
    }>('/patient/normal-plan/progress'),

  // Check video completion
  checkVideoCompletion: () =>
    api.get<{ currentZone: number; videosCompleted: boolean; canEnterMetrics: boolean }>(
      '/patient/normal-plan/check-videos'
    ),

  // Check if can enter metrics
  canEnterMetrics: () =>
    api.get<CanEnterMetricsResponse>('/patient/normal-plan/can-enter-metrics'),

  // Submit body metrics
  submitMetrics: (metrics: Omit<BodyMetrics, 'id' | 'loggedAt'>) =>
    api.post<SubmitMetricsResponse>('/patient/normal-plan/metrics', metrics),

  // Mark video as watched
  markVideoWatched: (videoId: string) =>
    api.post<{ success: boolean; videosCompleted: boolean; watchedCount: number; totalRequired: number }>(
      `/patient/normal-plan/videos/${videoId}/watched`
    ),

  // Get Horizon Guide videos
  getHorizonGuideVideos: (category?: string) =>
    api.get<HorizonGuideVideo[]>('/patient/normal-plan/horizon-guide', { params: { category } }),

  // Submit daily log
  submitDailyLog: (data: { completedTaskIds: string[]; notes?: string; mood?: string }) =>
    api.post<{ success: boolean; log: DailyLog; updated: boolean }>('/patient/normal-plan/daily-log', data),

  // Get today's log
  getTodayLog: () =>
    api.get<DailyLog | null>('/patient/normal-plan/daily-log/today'),

  // Get daily logs history
  getDailyLogsHistory: (days?: number) =>
    api.get<DailyLog[]>('/patient/normal-plan/daily-logs', { params: { days } }),

  // Submit weekly log
  submitWeeklyLog: (log: Omit<WeeklyLog, 'id' | 'submittedAt'>) =>
    api.post<{ success: boolean; weeklyLog: WeeklyLog; zoneCompleted: boolean; newZone?: number }>(
      '/patient/normal-plan/weekly-log',
      log
    ),

  // Get DIY tasks
  getDIYTasks: () =>
    api.get<{ currentZone: number; tasks: DIYTask[] }>('/patient/normal-plan/diy-tasks'),
};

// ==================== DOCTOR API ====================

export interface NormalPlanPatientSummary {
  id: string;
  patientId: string;
  name: string;
  email: string;
  currentZone: number;
  totalWeeksCompleted: number;
  lastLogDate: string | null;
  lastDailyLogDate: string | null;
  daysSinceLastDailyLog: number;
  complianceRate: number;
  status: 'active' | 'at-risk' | 'paused' | 'completed';
  programStartDate: string;
  latestMetrics: {
    weight: number;
    bodyFatPercentage: number;
    visceralFat: number;
    loggedAt: string;
  } | null;
  activeDaysThisWeek: number;
  weeklyLogs: WeeklyLog[];
}

export interface NormalPlanPatientDetail {
  patient: {
    id: string;
    name: string;
    email: string;
    currentZone: number;
    status: string;
    programStartDate: string;
    programCompleted: boolean;
    totalWeeksCompleted: number;
    doctorNotes: { note: string; createdAt: string }[];
  };
  zoneProgress: any[];
  metricsHistory: BodyMetrics[];
  weeklyLogs: WeeklyLog[];
  dailyLogs: DailyLog[];
  recommendations: HealthRecommendations | null;
  customTasks: any[];
}

export interface DailyActivityReport {
  date: string;
  totalPatients: number;
  activeToday: number;
  atRisk: number;
  patients: {
    patientId: string;
    name: string;
    email: string;
    currentZone: number;
    hasLoggedToday: boolean;
    todayCompletedTasks: number;
    daysSinceLastLog: number | null;
    isAtRisk: boolean;
  }[];
}

export interface DIYTaskTemplate {
  id: string;
  zoneNumber: number;
  category: 'nutrition' | 'exercise' | 'hydration' | 'sleep' | 'mindset';
  title: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export const normalPlanDoctorApi = {
  // Patient Management
  getPatients: () =>
    api.get<NormalPlanPatientSummary[]>('/doctor/normal-plan/patients'),

  getPatientDetail: (patientId: string) =>
    api.get<NormalPlanPatientDetail>(`/doctor/normal-plan/patients/${patientId}`),

  updatePatientStatus: (patientId: string, status: string, note?: string) =>
    api.patch(`/doctor/normal-plan/patients/${patientId}/status`, { status, note }),

  addDoctorNote: (patientId: string, note: string) =>
    api.post(`/doctor/normal-plan/patients/${patientId}/notes`, { note }),

  overridePatientZone: (patientId: string, zoneNumber: number, reason: string) =>
    api.post(`/doctor/normal-plan/patients/${patientId}/override-zone`, { zoneNumber, reason }),

  overrideRecommendations: (patientId: string, overrides: Partial<HealthRecommendations>) =>
    api.post(`/doctor/normal-plan/patients/${patientId}/override-recommendations`, { overrides }),

  addPatientCustomTask: (patientId: string, taskTemplateId: string, customDescription?: string) =>
    api.post(`/doctor/normal-plan/patients/${patientId}/custom-task`, { taskTemplateId, customDescription }),

  // DIY Task Templates
  getDIYTaskTemplates: (zoneNumber?: number) =>
    api.get<DIYTaskTemplate[]>('/doctor/normal-plan/diy-tasks', { params: { zoneNumber } }),

  createDIYTaskTemplate: (data: Omit<DIYTaskTemplate, 'id' | 'isActive'>) =>
    api.post<DIYTaskTemplate>('/doctor/normal-plan/diy-tasks', data),

  updateDIYTaskTemplate: (taskId: string, data: Partial<DIYTaskTemplate>) =>
    api.patch<DIYTaskTemplate>(`/doctor/normal-plan/diy-tasks/${taskId}`, data),

  deleteDIYTaskTemplate: (taskId: string) =>
    api.delete(`/doctor/normal-plan/diy-tasks/${taskId}`),

  // Zone Videos
  getZoneVideos: (zoneNumber?: number) =>
    api.get<ZoneVideo[]>('/doctor/normal-plan/zone-videos', { params: { zoneNumber } }),

  createZoneVideo: (data: Omit<ZoneVideo, 'id' | 'isWatched'>) =>
    api.post<ZoneVideo>('/doctor/normal-plan/zone-videos', data),

  updateZoneVideo: (videoId: string, data: Partial<ZoneVideo>) =>
    api.patch<ZoneVideo>(`/doctor/normal-plan/zone-videos/${videoId}`, data),

  deleteZoneVideo: (videoId: string) =>
    api.delete(`/doctor/normal-plan/zone-videos/${videoId}`),

  // Horizon Guide Videos
  getHorizonGuideVideos: (category?: string) =>
    api.get<HorizonGuideVideo[]>('/doctor/normal-plan/horizon-videos', { params: { category } }),

  createHorizonGuideVideo: (data: Omit<HorizonGuideVideo, 'id'>) =>
    api.post<HorizonGuideVideo>('/doctor/normal-plan/horizon-videos', data),

  updateHorizonGuideVideo: (videoId: string, data: Partial<HorizonGuideVideo>) =>
    api.patch<HorizonGuideVideo>(`/doctor/normal-plan/horizon-videos/${videoId}`, data),

  deleteHorizonGuideVideo: (videoId: string) =>
    api.delete(`/doctor/normal-plan/horizon-videos/${videoId}`),

  // Analytics
  getDailyActivityReport: () =>
    api.get<DailyActivityReport>('/doctor/normal-plan/daily-report'),

  getPatientTrends: (patientId: string, days?: number) =>
    api.get(`/doctor/normal-plan/patients/${patientId}/trends`, { params: { days } }),
};
