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
  getPatients: () => api.get('/doctor/patients'),
  createPatient: (data: { email: string; name: string; assignFixedMatrix: boolean }) =>
    api.post('/doctor/create-patient', data),
  getPatientProgress: (id: string) => api.get(`/doctor/patient-progress/${id}`),
  updateTask: (id: string, data: Record<string, unknown>) =>
    api.patch(`/doctor/update-task/${id}`, data),
  deleteTask: (id: string) => api.delete(`/doctor/delete-task/${id}`),
  getConsultations: () => api.get('/doctor/consultation-requests'),
  updateConsultationStatus: (id: string, status: string) =>
    api.patch(`/doctor/update-consultation-status/${id}`, { status }),
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
