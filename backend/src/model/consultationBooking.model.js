// models/ConsultationBooking.js (UPDATED RECOMMENDED SCHEMA)
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null
    },
    
    patientEmail: {
        type: String,
        required: true, 
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },

    // Store the requested date and time for the consultation
    requestedDateTime: { type: Date, required: true }, 

    // **ADD THIS:** Store the final confirmed/rescheduled time
    confirmedDateTime: { type: Date, default: null }, 
    
    patientQuery: { type: String, default: 'General Consultation' },

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
            'Refunded',
            'Cancelled',
        ], 
        default: 'Awaiting Payment' 
    },
    

    // Reference to the payment transaction
    transactionId: { 
        type: String,
        default: null
    },

    // Reference to the Razorpay order ID
    orderId: { 
        type: String,
        default: null
    }

    // Reference to the Razorpay Refund ID (Crucial for reconciliation and tracking refund status)
    ,
    refundId: { 
        type: String,
        default: null
    },

    paymentSignature: { 
        type: String,
        default: null
    }

}, { timestamps: true });

export default mongoose.model('ConsultationBooking', BookingSchema);