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
    // Store reason for cancellation if applicable
    cancellationReason: { type: String, default: null },

    
    // Use a single status field to track the progress
    status: { 
        type: String, 
        enum: [
            'Awaiting Payment', 
            'Payment Successful', // Ready for Doctor Review
            'Confirmed', 
            'Rescheduled',        // Added for clarity on Doctor's update
            'Cancelled'
        ], 
        default: 'Awaiting Payment' 
    },
    

    // Reference to the payment transaction
    transactionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Transaction',
        default: null
    },

    // Reference to the Razorpay order ID
    orderId: { 
        type: String,
        default: null
    },

    // Reference to the Razorpay Refund ID (Crucial for reconciliation and tracking refund status)
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