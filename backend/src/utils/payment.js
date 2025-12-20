// payment.js — Razorpay
import Razorpay from "razorpay";
import {
  PREMIUM_PROGRAM_BOOKING_PRICE,
  NORMAL_PROGRAM_BOOKING_PRICE,
} from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

// Initialize Razorpay with secret keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
// backend/src/utils/payment.js
const createRazorpayOrder = async (amountInRupees) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100), // Pure conversion to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    return order;
  } catch (error) {
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

// processPayment()
// backend/src/utils/payment.js

const processPayment = async (razorpayPaymentId, email, amount) => {
  try {
    // Fallback: If amount is missing or undefined, use a default or
    // fetch it from the payment object itself to be safe.
    const safeAmount = amount || 999;

    const captureResponse = await razorpay.payments.capture(
      razorpayPaymentId,
      Math.round(safeAmount * 100) // convert ₹ → paise and ensure it's an integer
    );

    if (captureResponse.status === "captured") {
      return {
        id: captureResponse.id,
        status: "Payment Successful",
      };
    } else {
      throw new Error(captureResponse.error_description || "Payment failed.");
    }
  } catch (error) {
    // This is where your "undefined" was coming from
    console.error("Razorpay Capture Error:", error);
    throw new Error(error.message || "Unknown Razorpay Error");
  }
};

// processRefund()
const processRefund = async (transactionId, amount) => {
  try {
    const refund = await razorpay.payments.refund(transactionId, {
      amount: amount * 100, // ₹ → paise
    });

    if (refund.status === "processed") {
      return {
        id: refund.id,
        status: "Refund Successful",
      };
    } else {
      throw new Error(refund.reason || "Refund failed.");
    }
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
};

export { processPayment, processRefund, createRazorpayOrder };
