import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { BookConsultationPage } from "./pages/BookConsultationPage";
import { EnrollPage } from "./pages/EnrollPage";

// Doctor Pages
import { DoctorPatientsPage } from "./pages/doctor/DoctorPatientsPage";
import { PatientDetailPage } from "./pages/doctor/PatientDetailPage";
import { DoctorConsultationsPage } from "./pages/doctor/DoctorConsultationsPage";
import { DoctorCompletedPatientsPage } from "./pages/doctor/DoctorCompletedPatientsPage";
import { DoctorDeactivatedPatientsPage } from "./pages/doctor/DoctorDeactivatedPatientsPage";

// Patient Pages
import { PatientTasksPage } from "./pages/patient/PatientTasksPage";
import { PatientProgressPage } from "./pages/patient/PatientProgressPage";
import { PatientLogDataPage } from "./pages/patient/PatientLogDataPage";
import { PatientBookingsPage } from "./pages/patient/PatientBookingsPage";
import { PatientProfilePage } from "./pages/patient/PatientProfilePage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/book-consultation" element={<BookConsultationPage />} />
            <Route path="/enroll" element={<EnrollPage />} />

            {/* Doctor Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute requiredRole="Doctor">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/doctor/patients" replace />} />
              <Route path="patients" element={<DoctorPatientsPage />} />
              <Route path="patients/:id" element={<PatientDetailPage />} />
              <Route path="consultations" element={<DoctorConsultationsPage />} />
              <Route path="completed-patients" element={<DoctorCompletedPatientsPage />} />
              <Route path="deactivated-patients" element={<DoctorDeactivatedPatientsPage />} />
              <Route path="new-requests" element={<DoctorConsultationsPage />} />
            </Route>

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute requiredRole="Patient">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/patient/tasks" replace />} />
              <Route path="tasks" element={<PatientTasksPage />} />
              <Route path="progress" element={<PatientProgressPage />} />
              <Route path="log-data" element={<PatientLogDataPage />} />
              <Route path="bookings" element={<PatientBookingsPage />} />
              <Route path="profile" element={<PatientProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;