// models/ConsultationBooking.js (UPDATED RECOMMENDED SCHEMA)
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Doctor ID is essential for filtering the Doctor's dashboard
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
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
            'Cancelled'
        ], 
        default: 'Awaiting Payment' 
    },
    
    // Once confirmed, the Zoom link is stored here
    zoomLink: { type: String, default: null },

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
    }

}, { timestamps: true });

export default mongoose.model('ConsultationBooking', BookingSchema);