import crypto from "crypto";
import Razorpay from "razorpay";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const toPaise = (amountInRupees) => Math.round(Number(amountInRupees) * 100);

const createRazorpayOrder = async (amountInRupees, receiptPrefix = "rcpt") => {
  const amountInPaise = toPaise(amountInRupees);

  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    throw new Error("Invalid order amount.");
  }

  try {
    return await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `${receiptPrefix}_${Date.now()}`,
    });
  } catch (error) {
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};

const verifyAndCapturePayment = async ({
  paymentId,
  orderId,
  expectedAmountInRupees,
  currency = "INR",
}) => {
  const expectedAmountInPaise = toPaise(expectedAmountInRupees);

  if (!Number.isFinite(expectedAmountInPaise) || expectedAmountInPaise <= 0) {
    throw new Error("Invalid expected payment amount.");
  }

  const payment = await razorpay.payments.fetch(paymentId);

  if (!payment || payment.order_id !== orderId) {
    throw new Error("Payment does not belong to the provided order.");
  }

  if (payment.currency !== currency) {
    throw new Error("Payment currency mismatch.");
  }

  if (Number(payment.amount) !== expectedAmountInPaise) {
    throw new Error("Payment amount mismatch.");
  }

  if (payment.status === "authorized") {
    return razorpay.payments.capture(paymentId, expectedAmountInPaise, currency);
  }

  if (payment.status === "captured") {
    return payment;
  }

  throw new Error(`Payment is not successful. Current status: ${payment.status}`);
};

const processRefund = async (transactionId, amountInRupees) => {
  try {
    const refund = await razorpay.payments.refund(transactionId, {
      amount: toPaise(amountInRupees),
    });

    if (refund.status === "processed") {
      return {
        id: refund.id,
        status: "Refund Successful",
      };
    }

    throw new Error(refund.reason || "Refund failed.");
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
};

export { createRazorpayOrder, processRefund, verifyRazorpaySignature, verifyAndCapturePayment };
