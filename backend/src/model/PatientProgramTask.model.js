// models/PatientProgramTask.js
import mongoose from 'mongoose';

const PatientProgramTaskSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    weekNumber: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 15 
    },
    // The actual text of the customized task
    taskDescription: { 
        type: String, 
        required: true 
    },
    // The Doctor can also set specific metrics to be tracked for this task
    metricsToTrack: [{ type: String }],
    
    // Status can be updated by the Doctor (e.g., mark as 'Achieved')
    status: { 
        type: String, 
        enum: ['Pending', 'Completed', 'Doctor Override'],
        default: 'Pending'
    },
}, { timestamps: true });

export default mongoose.model('PatientProgramTask', PatientProgramTaskSchema);