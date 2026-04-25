import { app } from "./app.js";
import { configDotenv } from "dotenv";
import connectdb from "./db/db.js";
import { seedWeightLossTemplate } from "./controllers/doctor.controller.js";
import { createDoctor } from "./controllers/doctor.controller.js";
import TimeSlot from "./model/timeSlot.model.js";

configDotenv({ path: "./.env" });

await connectdb();

// createDoctor("aevoninc@gmail.com","aevoninc@gmail.com","Horizon$2024$","8610622587");

// Seed default time slots if none exist
const slotCount = await TimeSlot.countDocuments();
if (slotCount === 0) {
  await TimeSlot.insertMany([
    { time: "9:30 AM",  period: "morning", isActive: true, sortOrder: 1 },
    { time: "10:30 AM", period: "morning", isActive: true, sortOrder: 2 },
    { time: "11:30 AM", period: "morning", isActive: true, sortOrder: 3 },
    { time: "6:00 PM",  period: "evening", isActive: true, sortOrder: 4 },
    { time: "7:00 PM",  period: "evening", isActive: true, sortOrder: 5 },
    { time: "8:00 PM",  period: "evening", isActive: true, sortOrder: 6 },
  ]);
  console.log("✅ Default time slots seeded.");
}

const requiredEnvVars = [
    "MONGODB_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET"
];

requiredEnvVars.forEach((v) => {
    if (!process.env[v]) {
        console.error(`FATAL ERROR: Environment variable ${v} is not defined.`);
        process.exit(1);
    }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

