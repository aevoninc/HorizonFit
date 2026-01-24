import {app} from "./app.js";
import { configDotenv } from "dotenv";
import connectdb from "./db/db.js";
import { seedWeightLossTemplate } from "./controllers/doctor.controller.js";

configDotenv({path:"./.env"});

await connectdb();

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is running on port 3000");
})

