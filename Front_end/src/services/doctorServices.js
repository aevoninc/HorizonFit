// src/api/doctorService.js
import api from "../api/axios";

// Doctor creates a new patient
export const createPatient = async (patientData) => {
  const res = await api.post("/doctor/create-patient", patientData);
  return res.data;
};
