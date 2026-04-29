// const API_BASE_URL = ;
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If the response is wrapped in our ApiResponse pattern, extract the data payload
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Prevent loop: don't retry if it's already a retry or an auth-related critical endpoint
    const url = originalRequest.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.get('/auth/refresh-token', {
          headers: {
            'Cookie': `refreshToken=${refreshToken}` // Note: This only works if backend STILL checks cookies, or we change backend to accept refreshToken in header/body
          }
        });

        const { accessToken } = response.data;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface Patient {
  id: string;
  name: string;
  email: string;
  zone: number;
  progress: number;
  status: 'active' | 'completed' | 'deactivated';
  enrolledDate?: string;
  completedDate?: string;
  deactivatedDate?: string;
  deactivationReason?: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  zoneId: number;
  weekNumber: number;
  dayOfWeek: string[];
  frequency: 'Daily' | 'SpecificDays' | 'Weekly' | 'OneTime';
  status: 'Pending' | 'In-Progress' | 'Completed';
  isCompleted?: boolean;
}

export interface ZoneTask {
  zoneId: number;
  weeks: {
    weekNumber: number;
    days: {
      day: string;
      dayIndex: number;
      tasks: Task[];
    }[];
  }[];
}

export interface Consultation {
  id: string;
  patientId?: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  type: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface PatientBooking {
  _id?: string; // Add this
  id: string;
  type: string;
  requestedDateTime: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Refunded';
  doctorName?: string;
  refundId?: string;
  patientQuery?: string;
}

export interface PatientProgress {
  patient: Patient;
  tasks: Task[];
  masterTasks: { total: number; completed: number };
  trackingData: TrackingEntry[];
  weeklyProgress: { week: string; completion: number }[];
  zoneProgress: { zone: string; tasks: number; completed: number }[];
  currentZone: number;
  allZonesComplete: boolean;
}

export interface TrackingEntry {
  id?: string;
  date: string;
  metricType: string;
  value: number;
  unit: string;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  enrolledDate: string;
  currentZone: number;
  totalTasks: number;
  completedTasks: number;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
}

export type ProgramTier = 'normal' | 'premium';

export interface ProgramBookingData {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  assignedCategory: "Weight Loss" | "Weight Gain";
  planTier: ProgramTier;
  programStartDate?: string;
  paymentToken: string;
  orderId: string;
  razorpaySignature: string;
}

export type HabitCode = 'Hydration' | 'Nutrition' | 'Exercise' | 'Sleep' | 'Mindset';
export const HABIT_CODES: HabitCode[] = ['Hydration', 'Nutrition', 'Exercise', 'Sleep', 'Mindset'];

export interface TimeSlot {
  _id: string;
  time: string;
  period: 'morning' | 'evening';
  isActive: boolean;
  sortOrder: number;
}

export interface HabitStatus {
  habitCode: HabitCode;
  completed: boolean;
}

export interface HabitGuide {
  _id: string;
  habitCode: HabitCode;
  zone: number;
  content: string;
  patientId?: string | null;
  updatedAt?: string;
}

export interface ProgramStatus {
  currentZone: number;
  currentDay: number;
  totalDaysInZone: number;
  started: boolean;
}

export interface HabitLog {
  _id: string;
  patientId: string;
  zone: number;
  day: number;
  date: string;
  completedHabits: HabitCode[];
}

export interface HabitSubmissionResponse {
  log: HabitLog;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      role: 'Patient' | 'Doctor';
      planTier: 'normal' | 'premium';
      user: { _id: string; email: string; name: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.get('/auth/refresh-token'),
  getMe: () => api.get('/auth/me'),
};

// Public API
export const publicApi = {
  createOrderId: (type: 'consultation' | 'program', programType?: ProgramTier) =>
    api.post<RazorpayOrder>('/public/create-order-id', { type, programType }),
  bookConsultation: (data: {
    name: string;
    email: string;
    mobileNumber: string;
    requestedDateTime: string;
    patientQuery?: string;
    paymentToken: string;
    orderId: string;
    razorpaySignature: string;
  }) => api.post('/public/new-request-consultation', data),
  bookProgram: (data: ProgramBookingData) => api.post('/public/program-booking', data),
  verifyPayment: (data: { orderId: string; paymentToken: string; razorpaySignature: string }) =>
    api.post('/public/verify-payment', data),
  verifyBooking: (data: { consultationId: string }) =>
    api.post('/public/verify-consultation-id', data),
  getTimeSlots: () => api.get<{ slots: TimeSlot[] }>('/public/time-slots'),
};

// Doctor API
export const doctorApi = {
  getPatients: () => api.get<Patient[]>('/doctor/patients'),
  createPatient: (data: { email: string; name: string; assignFixedMatrix: boolean }) =>
    api.post<Patient>('/doctor/create-patient', data),
  getPatientProgress: (patientId: string) => api.get<PatientProgress>(`/doctor/patient-progress/${patientId}`),
  deactivatePatient: (patientId: string, reason?: string) =>
    api.patch(`/doctor/deactivate-patient/${patientId}`, { reason }),
  deletePatient: (patientId: string) => api.delete(`/doctor/delete-patient/${patientId}`),
  getCompletedPatients: () => api.get<Patient[]>('/doctor/completed-patients'),
  getDeactivatedPatients: () => api.get<Patient[]>('/doctor/deactivated-patients'),
  allocateTasks: (patientId: string, tasks: Omit<Task, 'id' | 'status'>[]) =>
    api.post(`/doctor/allocate-tasks/${patientId}`, { tasks }),
  updateTask: (taskId: string, data: Partial<Task>) =>
    api.patch(`/doctor/update-task/${taskId}`, data),
  deleteTask: (taskId: string) => api.delete(`/doctor/delete-task/${taskId}`),
  getConsultations: () => api.get<Consultation[]>('/doctor/consultation-requests'),
  getNewConsultancyRequests: () => api.get<Consultation[]>('/doctor/get-new-consultancy-request'),
  updateConsultationStatus: (bookingId: string, status: Consultation['status'], confirmedDateTime: Date, notes?: string) =>
    api.patch(`/doctor/update-consultation-status/${bookingId}`, { status, notes, confirmedDateTime }),

  // Template endpoints
  getTemplates: () => api.get('/doctor/templates').then(res => res.data),
  getTemplate: (templateId: string) => api.get(`/doctor/templates/${templateId}`).then(res => res.data),
  createTemplate: (data: { name: string; description?: string; category: string; tasks: any[] }) =>
    api.post('/doctor/templates', data).then(res => res.data),

  updateTemplate: (templateId: string, data: { name: string; category: string; tasks: any[] }) =>
    api.put(`/doctor/templates/${templateId}`, data).then(res => res.data),
  deleteTemplate: (templateId: string) => api.delete(`/doctor/templates/${templateId}`),
  assignProgram: (patientId: string, templateId: string) =>
    api.post(`/doctor/assign-program/${patientId}`, { templateId }).then(res => res.data),

  // Time Slot management
  getTimeSlots: () => api.get<{ slots: TimeSlot[] }>('/doctor/time-slots'),
  toggleTimeSlot: (id: string, isActive: boolean) =>
    api.patch<{ slot: TimeSlot }>(`/doctor/time-slots/${id}`, { isActive }),
  addTimeSlot: (data: { time: string; period: 'morning' | 'evening' }) =>
    api.post<{ slot: TimeSlot }>('/doctor/time-slots', data),
  deleteTimeSlot: (id: string) => api.delete(`/doctor/time-slots/${id}`),

  // Habit Guide
  assignHabitGuide: (data: { habitCode: HabitCode; zone: number; content: string; patientId?: string }) =>
    api.post<{ guide: HabitGuide }>('/doctor/habit-guide', data),
  getHabitGuides: (params?: { zone?: number; habitCode?: HabitCode }) =>
    api.get<{ guides: HabitGuide[] }>('/doctor/habit-guide', { params }),
  updateHabitGuide: (id: string, content: string) =>
    api.patch<{ guide: HabitGuide }>(`/doctor/habit-guide/${id}`, { content }),
  deleteHabitGuide: (id: string) => api.delete(`/doctor/habit-guide/${id}`),
};

// Patient API
export const patientApi = {
  // Zone Tasks
  getZoneTasks: (zoneNumber: number) => api.get<ZoneTask>(`/patients/get-zone-task/${zoneNumber}`),
  logTaskCompletion: (data: { taskIds: string[], completionDate: string }) => api.post(`/patients/logTaskCompletion`, data),
  allocateTasks: (tasks: Omit<Task, 'id' | 'status'>[]) => api.post(`/patients/allocate-tasks`, { tasks }),
  deleteTask: (taskId: string) => api.delete(`/patients/tasks/${taskId}`),

  // Progress
  getProgress: () => api.get<PatientProgress>('/patients/getPatientProgress'),

  // Health Tracking
  logTrackingData: (data: { metricType: string; value: number; unit: string; notes?: string }) =>
    api.post('/patients/log-tracking-data', data),

  // Bookings/Consultations
  createOrder: () => api.post<RazorpayOrder>('/patients/create-order'),
  requestConsultation: (data: {
    requestedDateTime: string;
    patientQuery?: string;
    paymentToken: string;
    orderId: string;
    razorpaySignature: string;
  }) => api.post('/patients/consultation-request', data),
  getBookings: () => api.get<PatientBooking[]>('/patients/getPatientBookings'),
  cancelBooking: (id: string) => api.post<{ refundId?: string }>(`/patients/cancelBooking/${id}`),

  // Profile
  getProfile: () => api.get<PatientProfile>('/patients/getPatientProfile'),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/patients/update-password', data),

  // Habit Tracker
  getProgramStatus: () => api.get<ProgramStatus>('/patients/program-status'),
  getTodayHabits: () => api.get<{ habits: HabitStatus[]; submitted: boolean }>('/patients/habits/today'),
  submitHabits: (completedHabits: HabitCode[], notes?: string, mood?: string) =>
    api.post<HabitSubmissionResponse>('/patients/habits/submit', { completedHabits, notes, mood }),
  getHabitHistory: () => api.get<{ logs: HabitLog[] }>('/patients/habits/history'),
  getHabitGuide: (habitCode: HabitCode, zone?: number) =>
    api.get<{ guide: HabitGuide | null; zone: number }>(`/patients/habits/${habitCode}/guide`, { params: { zone } }),
};
