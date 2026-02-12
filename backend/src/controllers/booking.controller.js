import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import ConsultationBooking from "../model/consultationBooking.model.js";
import programBookingModel from "../model/programBooking.model.js";
import {
  createRazorpayOrder,
  verifyAndCapturePayment,
  verifyRazorpaySignature,
} from "../utils/payment.js";
import {
  sendConsultationUpdateEmail,
  sendPatientWelcomeEmail,
  sendProgramBookingEmail,
} from "../utils/mailer.js";
import {
  DOCTOR_EMAIL,
  DOCTOR_NAME,
  ADMIN_MAIL,
  CONSULTANCY_BOOKING_PRICE,
  PREMIUM_PROGRAM_BOOKING_PRICE,
  NORMAL_PROGRAM_BOOKING_PRICE,
} from "../constants.js";

const newRequestConsultation = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobileNumber,
    requestedDateTime,
    paymentToken,
    orderId,
    razorpaySignature,
    patientQuery,
  } = req.body;

  if (!requestedDateTime || !paymentToken || !orderId || !razorpaySignature) {
    return res.status(400).json({
      message: "Missing required payment details or appointment date.",
    });
  }

  if (
    !verifyRazorpaySignature({
      orderId,
      paymentId: paymentToken,
      signature: razorpaySignature,
    })
  ) {
    return res.status(400).json({
      message: "Security Check Failed: Invalid Signature",
    });
  }

  await verifyAndCapturePayment({
    paymentId: paymentToken,
    orderId,
    expectedAmountInRupees: CONSULTANCY_BOOKING_PRICE,
  });

  const booking = await ConsultationBooking.create({
    patientName: name,
    patientEmail: email,
    mobileNumber,
    requestedDateTime,
    patientQuery: patientQuery || "No query provided",
    status: "Confirmed",
    transactionId: paymentToken,
    orderId,
    paymentSignature: razorpaySignature,
  });

  Promise.allSettled([
    sendConsultationUpdateEmail({
      recipient: DOCTOR_EMAIL,
      personName: `Dr. ${DOCTOR_NAME}`,
      doctor: name,
      status: "Confirmed",
      dateTime: requestedDateTime,
      bookingId: booking._id,
    }),
    sendConsultationUpdateEmail({
      recipient: ADMIN_MAIL,
      personName: "Admin",
      doctor: name,
      status: "Confirmed",
      dateTime: requestedDateTime,
      bookingId: booking._id,
    }),
    sendConsultationUpdateEmail({
      recipient: email,
      personName: name,
      doctor: DOCTOR_NAME,
      status: "Confirmed",
      dateTime: requestedDateTime,
      bookingId: booking._id,
    }),
  ]).catch((error) => {
    console.error("Error sending consultation booking emails:", error);
  });

  return res.status(201).json({
    message: "Consultation booked successfully!",
    bookingId: booking._id,
    transactionId: paymentToken,
  });
});

const programBooking = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobileNumber,
    password,
    planTier,
    assignedCategory,
    programStartDate,
    paymentToken,
    orderId,
    razorpaySignature,
  } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !assignedCategory ||
    !paymentToken ||
    !orderId ||
    !razorpaySignature
  ) {
    return res.status(400).json({
      message: "All fields and payment details are required.",
    });
  }

  const actualPlanTier = planTier?.toLowerCase() === "premium" ? "premium" : "normal";
  const actualPrice =
    actualPlanTier === "premium"
      ? PREMIUM_PROGRAM_BOOKING_PRICE
      : NORMAL_PROGRAM_BOOKING_PRICE;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      message: `User already exists with email: ${email}.`,
    });
  }

  if (
    !verifyRazorpaySignature({
      orderId,
      paymentId: paymentToken,
      signature: razorpaySignature,
    })
  ) {
    return res.status(400).json({
      message: "Invalid payment signature. Transaction rejected.",
    });
  }

  await verifyAndCapturePayment({
    paymentId: paymentToken,
    orderId,
    expectedAmountInRupees: actualPrice,
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [booking] = await programBookingModel.create(
      [
        {
          status: "Payment Successful",
          email,
          mobileNumber,
          externalTransactionId: paymentToken,
          orderId,
          paymentSignature: razorpaySignature,
          programCategory: assignedCategory,
          programPrice: actualPrice,
        },
      ],
      { session }
    );

    const [patient] = await User.create(
      [
        {
          name,
          email,
          password,
          mobileNumber,
          role: "Patient",
          assignedCategory,
          planTier: actualPlanTier,
          programStartDate: programStartDate || new Date(),
          programBookingId: booking._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const startDate = programStartDate || new Date();
    Promise.allSettled([
      sendProgramBookingEmail(
        email,
        name,
        DOCTOR_NAME,
        startDate,
        paymentToken,
        actualPrice,
        actualPlanTier
      ),
      sendProgramBookingEmail(
        DOCTOR_EMAIL,
        DOCTOR_NAME,
        name,
        startDate,
        paymentToken,
        actualPrice,
        actualPlanTier
      ),
      sendPatientWelcomeEmail(email, name, DOCTOR_NAME, password),
    ]).catch((error) => {
      console.error("Notification Error:", error);
    });

    return res.status(201).json({
      success: true,
      message: "Enrollment successful!",
      patient: { id: patient._id, email: patient.email },
      bookingId: booking._id,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message:
        "Payment verified but account creation failed. Please contact support immediately.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

const newCreateOrderId = asyncHandler(async (req, res) => {
  const { purpose, planTier } = req.body;
  const normalizedPurpose = String(purpose || "").toLowerCase();

  const amountByPurpose = {
    consultation: CONSULTANCY_BOOKING_PRICE,
    program:
      String(planTier || "").toLowerCase() === "premium"
        ? PREMIUM_PROGRAM_BOOKING_PRICE
        : NORMAL_PROGRAM_BOOKING_PRICE,
  };

  const amount = amountByPurpose[normalizedPurpose];
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment purpose. Use consultation or program.",
    });
  }

  const order = await createRazorpayOrder(amount, normalizedPurpose);

  return res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    purpose: normalizedPurpose,
  });
});

const verifyCosultationId = asyncHandler(async (req, res) => {
  const { consultationId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(consultationId)) {
    return res.status(400).json({ message: "Invalid Consultation ID format." });
  }

  const booking = await ConsultationBooking.findById(consultationId);
  if (!booking) {
    return res.status(404).json({ message: "Consultation not found." });
  }

  return res.status(200).json({ message: "Consultation found.", booking });
});

export { newRequestConsultation, programBooking, newCreateOrderId, verifyCosultationId };
