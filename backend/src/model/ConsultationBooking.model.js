import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Doctor ID is implicit since there's only one, but good practice to include if needed
    // doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    
    requestedDate: { type: Date, required: true }, // Date and Time selected by patient
    patientQuery: { type: String, default: 'General Consultation' }, // Patient's written concern

    status: { 
        type: String, 
        enum: ['Awaiting Payment', 'Payment Successful', 'Confirmed', 'Cancelled'], 
        default: 'Awaiting Payment' 
    },
    
    // Once confirmed, the Zoom link is stored here
    zoomLink: { type: String, default: null },

    // Reference to the payment transaction
    transactionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Transaction',
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('ConsultationBooking', BookingSchema);