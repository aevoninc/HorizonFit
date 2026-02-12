import express from "express";
import {
  newRequestConsultation,
  programBooking,
  newCreateOrderId,
  verifyCosultationId,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/new-request-consultation", newRequestConsultation);
router.post("/program-booking", programBooking);
router.post("/create-order-id", newCreateOrderId);
router.post("/verify-consultation-id", verifyCosultationId);

export default router;
