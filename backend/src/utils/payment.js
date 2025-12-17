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
const createRazorpayOrder = async (tier) => {
    // Dynamic price logic
    const amount = tier === 'premium' ? 25000 : 10000; 
    
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // Converts ₹10,000 to 1,000,000 paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        });
        return order; 
    } catch (error) {
        throw new Error(`Order creation failed: ${error.message}`);
    }
};

// processPayment() 
const processPayment = async (razorpayPaymentId, email,amount) => {
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

export { processPayment, processRefund,createRazorpayOrder };
