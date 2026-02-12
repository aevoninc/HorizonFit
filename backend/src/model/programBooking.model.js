import mongoose from 'mongoose';

const programBookingSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true
    },

    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },

    // --- Program Details ---

    programCategory: {
        type: String,
        required: true, // Must be provided during booking
        trim: true
    },

    programPrice: {
        type: Number,
        required: true, // Crucial for auditing and reconciliation
    },

    // --- Status and Cancellation ---
    status: { 
        type: String, 
        enum: [
            'Awaiting Payment', 
            'Payment Successful',
            'Confirmed', 
            'Rescheduled', 
            'Cancelled'
        ], 
        default: 'Awaiting Payment' 
    },
    
    cancellationReason: { type: String, default: null },

    // --- Payment Details (External IDs) ---

    // Renamed from transactionId and changed to String to store external payment ID (e.g., Razorpay Payment ID)
    externalTransactionId: { 
        type: String,
        default: null
    },

    // Reference to the Razorpay order ID
    orderId: { 
        type: String,
        default: null
    },

    // Reference to the Razorpay Refund ID
    refundId: { 
        type: String,
        default: null
    },

    paymentSignature: { 
        type: String,
        default: null
    }

}, { timestamps: true });

export default mongoose.model("ProgramBooking",programBookingSchema);