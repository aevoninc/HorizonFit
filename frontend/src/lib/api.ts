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
        // Logout and redirect
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
  zoneId: number;
  weekNumber: number;
  dayOfWeek: string[];
  frequency: 'daily' | 'weekly' | 'biweekly';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Consultation {
  id: string;
  patientId?: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface PatientProgress {
  patient: Patient;
  tasks: Task[];
  weeklyProgress: { week: string; completion: number }[];
  zoneProgress: { zone: string; tasks: number; completed: number }[];
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
  createOrderId: (type: 'consultation' | 'program', data: Record<string, unknown>) =>
    api.post<{ orderId: string }>('/public/create-order-id', { type, ...data }),
  bookConsultation: (data: Record<string, unknown>) =>
    api.post('/public/new-request-consultation', data),
  bookProgram: (data: Record<string, unknown>) =>
    api.post('/public/program-booking', data),
};

// Doctor API
export const doctorApi = {
  // Patient Management
  getPatients: () => api.get<Patient[]>('/doctor/patients'),
  createPatient: (data: { email: string; name: string; assignFixedMatrix: boolean }) =>
    api.post<Patient>('/doctor/create-patient', data),
  getPatientProgress: (patientId: string) => api.get<PatientProgress>(`/doctor/patient-progress/${patientId}`),
  deactivatePatient: (patientId: string, reason?: string) =>
    api.patch(`/doctor/deactivate-patient/${patientId}`, { reason }),
  deletePatient: (patientId: string) => api.delete(`/doctor/delete-patient/${patientId}`),
  getCompletedPatients: () => api.get<Patient[]>('/doctor/completed-patients'),
  getDeactivatedPatients: () => api.get<Patient[]>('/doctor/deactivated-patients'),

  // Task Management
  allocateTasks: (patientId: string, tasks: Omit<Task, 'id' | 'status'>[]) =>
    api.post(`/doctor/allocate-tasks/${patientId}`, { tasks }),
  updateTask: (taskId: string, data: Partial<Task>) =>
    api.patch(`/doctor/update-task/${taskId}`, data),
  deleteTask: (taskId: string) => api.delete(`/doctor/delete-task/${taskId}`),

  // Consultation Management
  getConsultations: () => api.get<Consultation[]>('/doctor/consultation-requests'),
  updateConsultationStatus: (bookingId: string, status: Consultation['status'], notes?: string) =>
    api.patch(`/doctor/update-consultation-status/${bookingId}`, { status, notes }),
  getNewConsultancyRequest: () => api.get<Consultation[]>('/doctor/get-new-consultancy-request'),
};

// Patient API
export const patientApi = {
  getZoneTasks: (zoneNumber: number) => api.get(`/patient/get-zone-task/${zoneNumber}`),
  getProgress: () => api.get('/patient/getPatientProgress'),
  logTrackingData: (data: Record<string, unknown>) =>
    api.post('/patient/log-tracking-data', data),
  getBookings: () => api.get('/patient/getPatientBookings'),
  cancelBooking: (id: string) => api.post(`/patient/cancelBooking/${id}`),
  getProfile: () => api.get('/patient/getPatientProfile'),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/patient/update-password', data),
};
