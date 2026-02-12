import "dotenv/config";
import { createdoctor } from "./controllers/doctor.controller.js";

import { app } from "./app.js";
import connectdb from "./db/db.js";

await connectdb();
//createdoctor("anas","anas2005@gmail.com","lokesh06")//
app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running on port", process.env.PORT || 8000);
});

