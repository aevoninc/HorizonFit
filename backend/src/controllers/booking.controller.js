import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import ConsultationBooking from "../model/consultationBooking.model.js";
import programBookingModel from "../model/programBooking.model.js";
import {
  processPayment,
  processRefund,
  createRazorpayOrder,
} from "../utils/payment.js";
import {
  sendConsultationUpdateEmail,
  sendPasswordResetEmail,
  sendPatientWelcomeEmail,
  sendTaskAssignmentEmail,
  sendProgramBookingEmail,
} from "../utils/mailer.js";
import crypto from "crypto";
import {
  DOCTOR_EMAIL,
  DOCTOR_NAME,
  ADMIN_MAIL,
  CONSULTANCY_BOOKING_PRICE,
  PREMIUM_PROGRAM_BOOKING_PRICE,
  NORMAL_PROGRAM_BOOKING_PRICE,
} from "../constants.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const newRequestConsultation = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobileNumber,
    requestedDateTime,
    paymentToken, // This is razorpay_payment_id
    orderId, // This is razorpay_order_id
    razorpaySignature, // This is signature
    patientQuery,
  } = req.body;

  // 1. Initial Validation
  if (!requestedDateTime || !paymentToken || !orderId || !razorpaySignature) {
    return res.status(400).json({
      message: "Missing required payment details or appointment date.",
    });
  }

  console
  // 2. Security Check (Signature Verification)
  // This proves the payment was successful without needing to call 'capture' again
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + "|" + paymentToken)
    .digest("hex");

  if (generated_signature !== razorpaySignature) {
    console.error("Signature Mismatch!");
    return res
      .status(400)
      .json({ message: "Security Check Failed: Invalid Signature" });
  }

  // 3. Save to Database
  // Note: We use paymentToken as the transactionId because it is the unique payment reference
  const booking = await ConsultationBooking.create({
    patientName: name, // Added name to DB record
    patientEmail: email,
    mobileNumber,
    requestedDateTime,
    patientQuery: patientQuery || "No query provided",
    status: "Confirmed",
    transactionId: paymentToken,
    orderId,
    paymentSignature: razorpaySignature,
    amountPaid: CONSULTANCY_BOOKING_PRICE,
  });

  // Fire and forget emails so the user doesn't wait
  // ✅ Corrected Controller Call
try {
    await Promise.allSettled([
      // 1. Email to Doctor
      sendConsultationUpdateEmail({
        recipient: DOCTOR_EMAIL,
        personName: `Dr. ${DOCTOR_NAME}`, // Use the doctor's name
        doctor: name, // The Patient's name (from req.body)
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),
  
      // 2. Email to Admin
       sendConsultationUpdateEmail({
        recipient: ADMIN_MAIL,
        personName: "Admin",
        doctor: name, // Patient's name for admin reference
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),
  
      // 3. Email to Patient
       sendConsultationUpdateEmail({
        recipient: email, // The user's email from req.body
        personName: name, // The user's name from req.body
        doctor: DOCTOR_NAME,
        status: "Confirmed",
        dateTime: requestedDateTime,
        bookingId: booking._id,
      }),
    ])
} catch (error) {
    console.error("Error sending consultation booking emails:", error);
}

  // 5. Final Success Response
  res.status(201).json({
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
    paymentToken, // razorpay_payment_id
    orderId, // razorpay_order_id
    razorpaySignature,
  } = req.body;

  // 1. Initial Validation
  if (
    !name ||
    !email ||
    !password ||
    !assignedCategory ||
    !paymentToken ||
    !orderId ||
    !razorpaySignature
  ) {
    return res
      .status(400)
      .json({ message: "All fields and payment details are required." });
  }
  const startDate = programStartDate || new Date();
  // 2. Pricing Logic (Source of Truth)
  const PRICES = {
    normal: NORMAL_PROGRAM_BOOKING_PRICE,
    premium:PREMIUM_PROGRAM_BOOKING_PRICE 
  };

  const categoryKey = assignedCategory.toLowerCase();
  const actualPlanTier = planTier ? planTier.toLowerCase() : "normal";
  const actualPrice = PRICES[actualPlanTier];

  // 3. Check if user already exists before processing transaction
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res
      .status(400)
      .json({ message: `User already exists with email: ${email}.` });
  }
  // 4. Verify Razorpay Signature Security
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentToken}`)
    .digest("hex");

  if (generated_signature !== razorpaySignature) {
    console.error(`Security Alert: Signature mismatch for order ${orderId}`);
    return res
      .status(400)
      .json({ message: "Invalid payment signature. Transaction rejected." });
  }

  // 5. Atomic Database Transaction
  // We use a session to ensure Booking and User creation both succeed or both fail.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 6. Create Program Booking Record
    const [booking] = await programBookingModel.create(
      [
        {
          status: "Payment Successful",
          email,
          mobileNumber,
          externalTransactionId: paymentToken, // This is the Razorpay Payment ID
          orderId,
          paymentSignature: razorpaySignature,
          programCategory: assignedCategory,
          programPrice: actualPrice,
        },
      ],
      { session }
    );

    // 7. Create the Patient User Account
    const [patient] = await User.create(
      [
        {
          name,
          email,
          password,
          mobileNumber,
          role: "Patient",
          assignedCategory, // e.g., "Weight Loss"
          planTier: actualPlanTier, // e.g., "normal" or "premium"
          programStartDate: programStartDate || new Date(),
          programBookingId: booking._id,
        },
      ],
      { session }
    );

    // If everything is successful, commit the changes to the database
    await session.commitTransaction();

    // 8. Success Response
    res.status(201).json({
      success: true,
      message: "Enrollment successful!",
      patient: { id: patient._id, email: patient.email },
      bookingId: booking._id,
    });

    // 9. Send Notifications (Non-blocking / Background)
    // We do this AFTER committing the transaction

    Promise.allSettled([
      // To Patient: (recipient, personName, otherPartyName, startDate, paymentId, price, planTier)
      sendProgramBookingEmail(
        email,
        name,
        DOCTOR_NAME,
        startDate,
        paymentToken,
        actualPrice,
        actualPlanTier
      ),

      // To Doctor: (recipient, personName, otherPartyName, startDate, paymentId, price, planTier)
      sendProgramBookingEmail(
        DOCTOR_EMAIL,
        DOCTOR_NAME,
        name,
        startDate,
        paymentToken,
        actualPrice,
        actualPlanTier
      ),

      // Welcome Email: (recipient, patientName, assignedDoctorName, password)
      sendPatientWelcomeEmail(email, name, DOCTOR_NAME, password),
    ]).catch((err) => console.error("Notification Error:", err));
  } catch (error) {
    // If any step fails, undo all database changes made during this session
    await session.abortTransaction();

    console.error("CRITICAL ERROR during program booking session:", error);
    res.status(500).json({
      message:
        "Payment verified but account creation failed. Please contact support immediately.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

const newCreateOrderId = asyncHandler(async (req, res) => {
  const { type, programType } = req.body;
  // 1. Define pricing (Source of Truth)
  const PRICES = {
    normal: NORMAL_PROGRAM_BOOKING_PRICE, // or NORMAL_PROGRAM_BOOKING_PRICE
    premium: PREMIUM_PROGRAM_BOOKING_PRICE, // or PREMIUM_PROGRAM_BOOKING_PRICE
    consultation:CONSULTANCY_BOOKING_PRICE , // or CONSULTANCY_BOOKING_PRICE
  };

  // 2. Determine price
  let finalAmount = PRICES.consultation;

  if (type === "program") {
    finalAmount = programType === "premium" ? PRICES.premium : PRICES.normal;
  }

  try {
    // 3. Pass the actual NUMBER to the utility
    const order = await createRazorpayOrder(finalAmount);

    // 4. Response
    res.status(201).json({
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount, // This is in paise
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
  res.status(200).json({ message: "Consultation found.", booking });
});

export { newRequestConsultation, programBooking, newCreateOrderId ,verifyCosultationId};
