// import {app} from "./app.js";
// import { configDotenv } from "dotenv";
// import connectdb from "./db/db.js";

// configDotenv({path:"./.env"});

// await connectdb();

// app.listen(process.env.PORT || 8000, () => {
//     console.log("Server is running on port 3000");
// })
import { app } from "./app.js";
import "dotenv/config";
import connectdb from "./db/db.js";

configDotenv({path:"./.env"});

await connectdb();


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
