import express from "express"

const router = express.Router();

import {
    newRequestConsultation,
    programBooking,
    newCreateOrderId,
    verifyCosultationId,
    getPublicTimeSlots,
    getBookedSlots,
} from "../controllers/booking.controller.js"

// Public Route - No authentication required
router.post("/new-request-consultation", newRequestConsultation);
router.post("/program-booking", programBooking);
router.post("/create-order-id", newCreateOrderId);
router.post("/verify-consultation-id", verifyCosultationId);
router.get("/time-slots", getPublicTimeSlots);
router.get("/booked-slots", getBookedSlots);

export default router;
