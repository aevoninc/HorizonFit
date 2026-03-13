import { app } from "./app.js";
import { configDotenv } from "dotenv";
import connectdb from "./db/db.js";
import { seedWeightLossTemplate } from "./controllers/doctor.controller.js";
import { createDoctor } from "./controllers/doctor.controller.js";

configDotenv({ path: "./.env" });

await connectdb();

// createDoctor("aevoninc@gmail.com","aevoninc@gmail.com","Horizon$2024$","8610622587");

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

