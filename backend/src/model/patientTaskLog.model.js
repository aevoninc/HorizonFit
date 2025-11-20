// models/PatientTaskLog.js
import mongoose from 'mongoose';

const PatientTaskLogSchema = new mongoose.Schema({
    // 1. Link to the Master Task
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PatientProgramTask', 
        required: true 
    },

    // 2. Link to the User (Patient)
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // 3. The completion record
    completionDate: { 
        type: Date, 
        default: Date.now, // Automatically set to the time the patient logs the action
        required: true 
    },

    // 4. Confirmation (can be simplified/omitted, but useful for clarity)
    // Since the document's existence implies completion, this can be simple.
    isComplete: { 
        type: Boolean, 
        default: true 
    },

}, { 
    timestamps: true 
});

export default mongoose.model('PatientTaskLog', PatientTaskLogSchema);