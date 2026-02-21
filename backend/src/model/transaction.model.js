import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ConsultationBooking', 
        required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }, // Adjust based on your preferred gateway
    
    // ID provided by Stripe/Razorpay
    paymentGatewayReferenceId: { type: String, required: true, unique: true }, 
    
    status: { 
        type: String, 
        enum: ['Pending', 'Successful', 'Failed'], 
        default: 'Pending' 
    },
    
    paymentGateway: { type: String, enum: ['Stripe', 'Razorpay'], required: true },

}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);