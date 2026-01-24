import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


app.use(
  cors({
    origin: "http://localhost:8080", // your frontend URL
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", 'PATCH' ,"DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Import Routes
import authRoutes from "./routes/auth.route.js";
import doctorRoutes from "./routes/doctor.route.js";
import patientRoutes from "./routes/patient.route.js";
import bookingRoutes from "./routes/booking.route.js";  
import normalPlanPatientRoutes from './routes/normalPlanPatient.route.js';
import normalPlanDoctorRoutes from './routes/normalPlanDoctor.route.js';
// Define Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/public", bookingRoutes);
app.use('/api/v1/doctor/normal-plan', normalPlanDoctorRoutes);
app.use('/api/v1/patient/normal-plan', normalPlanPatientRoutes);

app.get("/test", (req, res) => {
  res.send("API Working!");
});

export { app };
