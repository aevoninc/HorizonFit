import express from "express"

const router = express.Router();

import {
    newRequestConsultation,
    programBooking
} from "../controllers/booking.controller.js"
import { createOrderId } from "../controllers/patient.controller.js";

// Public Route - No authentication required
router.post("/new-request-consultation", newRequestConsultation);
router.post("/program-booking", programBooking);
router.post("/create-order-id", createOrderId);

export default router;
