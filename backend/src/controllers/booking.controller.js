import asyncHandler from '../utils/asyncHandler.js';
import User from '../model/user.model.js';  
import ConsultationBooking from '../model/consultationBooking.model.js';
import programBookingModel from '../model/programBooking.model.js';
import {
    processPayment,
    processRefund,
    createRazorpayOrder
} from '../utils/payment.js';
import {
    sendConsultationUpdateEmail, 
    sendPasswordResetEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail,
    sendProgramBookingEmail 
} from '../utils/mailer.js';
import crypto from 'crypto';
import {
    DOCTOR_EMAIL,
    DOCTOR_NAME,
    ADMIN_MAIL,
    CONSULTANCY_BOOKING_PRICE,
    PROGRAM_BOOKING_PRICE
} from '../constants.js';


const newRequestConsultation = asyncHandler(async (req, res) => {

    const { 
        name,
        email,
        mobileNumber,
        requestedDateTime,
        paymentToken,              // razorpay_payment_id
        orderId,                   // razorpay_order_id
        razorpaySignature,         // signature
        patientQuery, 
    } = req.body;

    if (!requestedDateTime || !paymentToken || !orderId) {
        return res.status(400).json({ 
            message: "Date, Payment ID, and Order ID are required." 
        });
    }

    // 1. Verify Razorpay signature security
    const generated_signature = crypto
        .createHmac("sha256", process.env.KEY_SECRET)
        .update(orderId + "|" + paymentToken)
        .digest("hex");

    if (generated_signature !== razorpaySignature) {
        return res.status(400).json({ message: "Payment verification failed!" });
    }

    // 2. Capture payment (if needed)
    const paymentResult = await processPayment(
        paymentToken,
        email,
        CONSULTANCY_BOOKING_PRICE
    );

    if (paymentResult.status !== "Payment Successful") {
        return res.status(400).json({ message: "Payment capture failed!" });
    }

    const booking = await ConsultationBooking.create({
        patientEmail: email,
        mobileNumber,
        requestedDateTime,
        patientQuery,
        status: "Payment Successful",
        transactionId: paymentResult.id,
        orderId,
        paymentSignature: razorpaySignature,
    })

    await sendConsultationUpdateEmail(
        DOCTOR_EMAIL,
        'New Consultation Booking',
        `A new consultation has been booked for ${requestedDateTime} by patient: ${name} email: ${email} mobile number: ${mobileNumber}. Please review the booking details in your dashboard.`
    );
    await sendConsultationUpdateEmail(
        ADMIN_MAIL,
        'New Consultation Booking',
        `A new consultation has been booked for ${requestedDateTime} by patient: ${name} email: ${email} mobile number: ${mobileNumber}. Please review the booking details in your dashboard.`
        `transaction Id: ${paymentResult.id}`
        `Order Id: ${orderId}`
    );
    await sendConsultationUpdateEmail(
        email,
        'Consultation Booking Confirmed',
        `Your consultation has been successfully booked for ${requestedDateTime}. We look forward to assisting you!`
        `transaction Id: ${paymentResult.id}`
        `Order Id: ${orderId}`
    );

    res.status(201).json({
        message: "Consultation booked successfully!",
        paymentDetails: {
            transactionId: paymentResult.id,
            orderId: orderId
        }
    });
});

const programBooking = asyncHandler(async (req, res) => {

    const {
        name,
        email,
        mobileNumber,
        paymentToken,              // razorpay_payment_id
        orderId,                   // razorpay_order_id
        razorpaySignature,         // signature
    } = req.body;
    if (!paymentToken || !orderId) {
        return res.status(400).json({
            message: "Payment ID and Order ID are required."
        });
    }
    // 1. Verify Razorpay signature security
    const generated_signature = crypto
        .createHmac("sha256", process.env.KEY_SECRET)
        .update(orderId + "|" + paymentToken)
        .digest("hex");
    if (generated_signature !== razorpaySignature) {
        return res.status(400).json({ message: "Payment verification failed!" });
    }
    // 2. Capture payment (if needed)
    const paymentResult = await processPayment(
        paymentToken,
        email,
        PROGRAM_BOOKING_PRICE
    );
    if (paymentResult.status !== "Payment Successful") {
        return res.status(400).json({ message: "Payment capture failed!" });
    }
    const booking = await programBookingModel.create({
        status: "Payment Successful",
        email,
        mobileNumber,
        transactionId: paymentResult.id,
        orderId,
        paymentSignature: razorpaySignature,

    });
    // 4. Send Confirmation Email
    await sendProgramBookingEmail(
        email,
        name,
        PROGRAM_BOOKING_PRICE
    );

    await sendProgramBookingEmail(
        DOCTOR_EMAIL,
        `New Program Booking by ${name} mobile number: ${mobileNumber}`,
        PROGRAM_BOOKING_PRICE
    );

    await sendProgramBookingEmail(
        ADMIN_MAIL,
        `New Program Booking by ${name} mobile number: ${mobileNumber}`,
        PROGRAM_BOOKING_PRICE
    );
    res.status(201).json({
        message: "Program booked successfully!"
    });
});

const newCreateOrderId = asyncHandler(async (req, res) => {

    try {
        const order = await createRazorpayOrder();
        res.status(201).json({
            message: "Razorpay order created successfully.",
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export {
    newRequestConsultation,
    programBooking,
    newCreateOrderId
};
