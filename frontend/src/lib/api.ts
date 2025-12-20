// const API_BASE_URL = ;
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.get('/auth/refresh-token');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore logout errors
        }
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
  frequency: 'Daily'| 'SpecificDays'| 'Weekly'| 'OneTime';
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
  programType: ProgramTier;
  paymentToken: string;
  orderId: string;
  razorpaySignature: string;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ role: 'Patient' | 'Doctor'; user: { id: string; email: string; name: string } }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.get('/auth/refresh-token'),
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
  updateConsultationStatus: (bookingId: string, status: Consultation['status'], confirmedDateTime : Date,notes?: string) =>
    api.patch(`/doctor/update-consultation-status/${bookingId}`, { status, notes, confirmedDateTime }),
  getNewConsultancyRequest: () => api.get<Consultation[]>('/doctor/get-new-consultancy-request'),

  // Template endpoints
  getTemplates: () => api.get('/doctor/templates').then(res => res.data),
  getTemplates: () => api.get('/doctor/templates').then(res => res.data),
  getTemplate: (templateId: string) => api.get(`/doctor/templates/${templateId}`).then(res => res.data),
createTemplate: (data: { name: string; description?: string; category: string; tasks: any[] }) =>
    api.post('/doctor/templates', data).then(res => res.data),

updateTemplate: (templateId: string, data: { name: string; category: string; tasks: any[] }) =>
    api.put(`/doctor/templates/${templateId}`, data).then(res => res.data),
  deleteTemplate: (templateId: string) => api.delete(`/doctor/templates/${templateId}`),
  assignProgram: (patientId: string, templateId: string) =>
    api.post(`/doctor/assign-program/${patientId}`, { templateId }).then(res => res.data),
};

// Patient API
export const patientApi = {
  // Zone Tasks
  getZoneTasks: (zoneNumber: number) => api.get<ZoneTask>(`/patients/get-zone-task/${zoneNumber}`),
  logTaskCompletion: (taskId: string) => api.post(`/patients/logTaskCompletion/${taskId}`),
  
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
};
