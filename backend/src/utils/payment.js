// payment.js — Razorpay 
import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

// Initialize Razorpay with secret keys
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Create Razorpay Order
const createRazorpayOrder = async () => {
    const amount = 100; //100 ₹ - Rupees
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100,   // ₹ - paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        });

        return order; 
    } catch (error) {
        throw new Error(`Order creation failed: ${error.message}`);
    }
};

const simulatePayment = async (orderId, amount) => {
    const payment = await razorpay.payments.create({
        amount: amount * 100,  // in paise
        currency: "INR",
        receipt: orderId,
        payment_capture: 1      // auto capture
    });

    return payment; // this returns a payment_id you can use in Postman
}
// processPayment() 
const processPayment = async (razorpayPaymentId, email) => {
    const amount = 100; //100 ₹ - Rupees
    try {
        // Razorpay verifies card/UPI on frontend
        const captureResponse = await razorpay.payments.capture(
            razorpayPaymentId,
            amount * 100 // convert ₹ → paise
        );

        const transactionId = captureResponse.id || `txn_${Date.now()}`;

        if (captureResponse.status === "captured") {
            return {
                id: transactionId,
                status: "Payment Successful",
            };
        } else {
            throw new Error(captureResponse.error_description || "Payment failed.");
        }
    } catch (error) {
        throw new Error(`Payment processing failed: ${error.message}`);
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

export { processPayment, processRefund,createRazorpayOrder,simulatePayment };
