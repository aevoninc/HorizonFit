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
        password,
        assignedCategory,
        programStartDate,
        paymentToken,        // razorpay_payment_id
        orderId,             // razorpay_order_id
        razorpaySignature,   // signature
    } = req.body;

    // 1. Initial Validation
    if (!name || !email || !mobileNumber || !password || !assignedCategory) {
        return res.status(400).json({
            message: "Please provide name, email, mobile number, password, and assigned category."
        });
    }
    if (!paymentToken || !orderId || !razorpaySignature) {
        return res.status(400).json({
            message: "Payment verification details (ID, Order ID, and Signature) are required."
        });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ 
            message: `User already exists with this email: ${email}.` 
        });
    }

    // 3. Verify Razorpay Signature Security
    // This MUST be done BEFORE capturing payment, but after receiving the token/signature from client.
    const generated_signature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(orderId + "|" + paymentToken)
        .digest("hex");
        
    if (generated_signature !== razorpaySignature) {
        // Log this failure attempt for security audit
        console.error(`Payment Signature Mismatch for order ${orderId}`);
        return res.status(400).json({ message: "Payment verification failed due to invalid signature!" });
    }

    // 4. Capture Payment (if necessary, assuming a two-step process)
    const paymentResult = await processPayment(
        paymentToken,
        email,
        PROGRAM_BOOKING_PRICE
    );

    if (paymentResult.status !== "Payment Successful") {
        // Log the failure to capture the payment
        console.error(`Payment capture failed for order ${orderId}: ${paymentResult.status}`);
        return res.status(400).json({ message: "Payment capture failed! Please try again or contact support." });
    }

    // 5. Create Program Booking Record
    // Storing the external transaction ID (string) as it comes from the payment gateway.
    const booking = await programBookingModel.create({
        status: "Payment Successful",
        email,
        mobileNumber,
        // Renamed 'transactionId' to 'externalTransactionId' for clarity 
        // that it holds the external payment ID (string), not a local ObjectId.
        externalTransactionId: paymentResult.id, 
        orderId,
        paymentSignature: razorpaySignature,
        programCategory: assignedCategory, 
        programPrice: PROGRAM_BOOKING_PRICE 
    });

    // 6. Create the Patient User Account
    const patient = await User.create({
        name,
        email,
        password,
        mobileNumber,
        role: "Patient",
        assignedCategory,
        programStartDate: programStartDate || new Date(),
        programBookingId: booking._id 
    });

    if (!patient) {
         // This is a serious error. Payment succeeded but user creation failed.
         // A compensation step (like refund or manual alert) should be triggered here.
        return res.status(500).json({ message: "Internal error: Payment successful but failed to create user account." });
    }

    // 7. Send Notifications (Fire and Forget - don't block the response)
    // Use Promise.allSettled to ensure failure of one email doesn't crash the entire function
    await Promise.allSettled([
        // Send confirmation to the patient
        sendProgramBookingEmail(email, name, PROGRAM_BOOKING_PRICE),
        
        // Send internal notifications
        sendProgramBookingEmail(DOCTOR_EMAIL, `New Program Booking by ${name} mobile number: ${mobileNumber}`, PROGRAM_BOOKING_PRICE),
        sendProgramBookingEmail(ADMIN_MAIL, `New Program Booking by ${name} mobile number: ${mobileNumber}`, PROGRAM_BOOKING_PRICE),

        // Send patient welcome email with login details/doctor info
        sendPatientWelcomeEmail(email, name, DOCTOR_NAME)
    ]);
    
    // 8. Final Success Response (Only ONE response)
    res.status(201).json({
        message: "Program booked and patient enrolled successfully! Welcome emails have been sent.",
        patient: { _id: patient._id, email: patient.email },
        bookingId: booking._id
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
