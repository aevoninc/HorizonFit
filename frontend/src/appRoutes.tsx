// Public Pages
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { BookConsultationPage } from "./pages/BookConsultationPage";
import { EnrollPage } from "./pages/EnrollPage";
import { BookingSuccessPage } from "./pages/BookingSuccessPage";

// Doctor Pages
import { DoctorPatientsPage } from "./pages/doctor/DoctorPatientsPage";
import { PatientDetailPage } from "./pages/doctor/PatientDetailPage";
import { DoctorConsultationsPage } from "./pages/doctor/DoctorConsultationsPage";
import { DoctorCompletedPatientsPage } from "./pages/doctor/DoctorCompletedPatientsPage";
import { DoctorDeactivatedPatientsPage } from "./pages/doctor/DoctorDeactivatedPatientsPage";
import { ProgramTemplatesPage } from "./pages/doctor/ProgramTemplatesPage";

// Patient Pages
import { PatientTasksPage } from "./pages/patient/PatientTasksPage";
import { PatientProgressPage } from "./pages/patient/PatientProgressPage";
import { PatientLogDataPage } from "./pages/patient/PatientLogDataPage";
import { PatientBookingsPage } from "./pages/patient/PatientBookingsPage";
import { PatientProfilePage } from "./pages/patient/PatientProfilePage";
import { PatientNewConsultationPage } from "./pages/patient/PatientNewConsultationPage";
import { NormalPlanDashboard } from "./pages/patient/NormalPlanDashboard";
import { HorizonGuidePage } from "./pages/patient/HorizonGuidePage";
import { NormalPlanVideosPage } from "./pages/doctor/NormalPlanVideosPage";
import { NormalPlanMonitorPage } from "./pages/doctor/NormalPlanMonitorPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";

export const AppRoutes = () => {
  const { planTier } = useAuth();
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/book-consultation" element={<BookConsultationPage />} />
      <Route path="/enroll" element={<EnrollPage />} />
      <Route path="/booking-success" element={<BookingSuccessPage />} />

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
        <Route
          path="completed-patients"
          element={<DoctorCompletedPatientsPage />}
        />
        <Route
          path="deactivated-patients"
          element={<DoctorDeactivatedPatientsPage />}
        />
        <Route path="templates" element={<ProgramTemplatesPage />} />

          <Route path="normal-plan-videos" element={<NormalPlanVideosPage />} />
          <Route
            path="normal-plan-monitor"
            element={<NormalPlanMonitorPage />}
          />
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

        <Route
          path="tasks"
          element={
            planTier === "normal" ? (
              <NormalPlanDashboard />
            ) : (
              <PatientTasksPage />
            )
          }
        />

        <Route path="progress" element={<PatientProgressPage />} />
        <Route path="log-data" element={<PatientLogDataPage />} />
        <Route path="bookings" element={<PatientBookingsPage />} />
        <Route
          path="new-consultation"
          element={<PatientNewConsultationPage />}
        />
        <Route path="profile" element={<PatientProfilePage />} />
        <Route path="horizon-guide" element={<HorizonGuidePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
