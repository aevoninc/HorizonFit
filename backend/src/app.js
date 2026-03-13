import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting (General for Auth)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  message: { message: "Too many requests, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:3000",
    ].filter(Boolean),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.options("/{*path}", cors()); // Handle preflight

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Import Routes
import authRoutes from "./routes/auth.route.js";
import doctorRoutes from "./routes/doctor.route.js";
import patientRoutes from "./routes/patient.route.js";
import bookingRoutes from "./routes/booking.route.js";
import normalPlanPatientRoutes from "./routes/normalPlanPatient.route.js";
import normalPlanDoctorRoutes from "./routes/normalPlanDoctor.route.js";

// Define Routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/public", bookingRoutes);
app.use("/api/v1/doctor/normal-plan", normalPlanDoctorRoutes);
app.use("/api/v1/patient/normal-plan", normalPlanPatientRoutes);

app.get("/test", (req, res) => {
  res.send("API Working!");
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || err.status || 500).json({
    message: err.message || "Internal server error",
    errors: err.errors || [],
  });
});

export { app };
