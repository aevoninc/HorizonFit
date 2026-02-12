import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { doctorApi } from '@/lib/api'; // Assuming doctorApi is imported correctly
import { useAuth } from '@/contexts/AuthContext';

// --- Context Type ---

interface DoctorContextType {
    patientList: any[];
    consultations: any[];
    isLoadingData: boolean;
    activePatientId: string | null;
    setActivePatientId: (id: string | null) => void;
    fetchPatientList: () => Promise<void>;
    fetchConsultations: () => Promise<void>;
    // Updated signature to match the provided doctorApi.updateConsultationStatus
    updateConsultationStatus: (bookingId: string, newStatus: string) => Promise<boolean>; 
    // Note: DeactivatePatient logic is not in the provided doctorApi, but kept for completeness
    deactivatePatient: (patientId: string) => Promise<boolean>; 
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// --- Provider Component ---

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { role, isAuthenticated } = useAuth();
    const [patientList, setPatientList] = useState<any[]>([]);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [activePatientId, setActivePatientId] = useState<string | null>(null);

    const isDoctor = role === 'Doctor';

    // 1. Fetch Patient List
    const fetchPatientList = useCallback(async () => {
        if (!isDoctor) return;
        setIsLoadingData(true);
        try {
            // Updated to use doctorApi.getPatients()
            const response = await doctorApi.getPatients(); 
            setPatientList(response.data.patients);
        } catch (error) {
            console.error("Failed to fetch patient list:", error);
            setPatientList([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [isDoctor]);

    // 2. Fetch Consultation Requests
    const fetchConsultations = useCallback(async () => {
        if (!isDoctor) return;
        setIsLoadingData(true);
        try {
            // Updated to use doctorApi.getConsultations()
            const response = await doctorApi.getConsultations(); 
            setConsultations(response.data.consultations);
        } catch (error) {
            console.error("Failed to fetch consultations:", error);
            setConsultations([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [isDoctor]);

    // 3. Update Consultation Status
    // REMOVED 'confirmedDateTime' from signature to align with provided doctorApi
    const updateConsultationStatus = useCallback(async (bookingId: string, status: string) => { 
        if (!isDoctor) return false;
        try {
            // Using the exact doctorApi method signature
            await doctorApi.updateConsultationStatus(bookingId, status); 
            // Refresh consultations list after successful update
            fetchConsultations(); 
            return true;
        } catch (error) {
            console.error(`Failed to update consultation ${bookingId} status:`, error);
            return false;
        }
    }, [isDoctor, fetchConsultations]);

    // 4. Deactivate Patient
    // NOTE: This feature is not in the provided doctorApi object, but the function signature remains 
    // in the context for future implementation (e.g., doctorApi.deactivatePatient).
    const deactivatePatient = useCallback(async (patientId: string) => {
        if (!isDoctor) return false;
        try {
            // Assuming this function exists in the full doctorApi:
            // await doctorApi.deactivatePatient(patientId); 
            
            // Placeholder: simulate success
            console.log(`Deactivating patient ${patientId} (API call pending implementation in doctorApi)`);
            
            fetchPatientList(); 
            return true;
        } catch (error) {
            console.error(`Failed to deactivate patient ${patientId}:`, error);
            return false;
        }
    }, [isDoctor, fetchPatientList]);


    // Fetch initial data when the doctor logs in
    useEffect(() => {
        if (isAuthenticated && isDoctor) {
            fetchPatientList();
            fetchConsultations();
        }
    }, [isAuthenticated, isDoctor, fetchPatientList, fetchConsultations]);

    return (
        <DoctorContext.Provider
            value={{
                patientList,
                consultations,
                isLoadingData,
                activePatientId,
                setActivePatientId,
                fetchPatientList,
                fetchConsultations,
                updateConsultationStatus,
                deactivatePatient,
            }}
        >
            {children}
        </DoctorContext.Provider>
    );
};

// --- Custom Hook ---

export const useDoctor = () => {
    const context = useContext(DoctorContext);
    if (context === undefined) {
        throw new Error('useDoctor must be used within a DoctorProvider');
    }
    return context;
};