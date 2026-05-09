// models/ConsultationBooking.js (UPDATED RECOMMENDED SCHEMA)
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    patientName: {
      type: String,
      default: null,
      trim: true,
    },

    patientEmail: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Store the requested date and time for the consultation
    requestedDateTime: { type: Date, required: true },

    // **ADD THIS:** Store the final confirmed/rescheduled time
    confirmedDateTime: { type: Date, default: null },

    patientQuery: { type: String, default: "General Consultation" },

    // Store reason for cancellation if applicable
    cancellationReason: { type: String, default: null },

    // Use a single status field to track the progress
    status: {
      type: String,
      enum: [
        "Awaiting Payment",
        "Payment Successful",
        "Confirmed",
        "Rescheduled",
        "Cancelled",
        "Completed",
      ],
      default: "Awaiting Payment",
    },

    // Reference to the payment transaction
    transactionId: {
      type: String,
      default: null,
    },

    // Reference to the Razorpay order ID
    orderId: {
      type: String,
      default: null,
    },

    // Amount paid in INR (stored for refund calculations)
    amountPaid: {
      type: Number,
      default: null,
    },

    // Reference to the Razorpay Refund ID
    refundId: {
      type: String,
      default: null,
    },

    paymentSignature: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("ConsultationBooking", BookingSchema);
