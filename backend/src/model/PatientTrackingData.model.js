// models/PatientTrackingData.js
import mongoose from 'mongoose';

const TrackingDataSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    dateRecorded: { 
        type: Date, 
        required: true 
    },
    weekNumber: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 15 
    },
    // Dynamic metrics storage (e.g., { weight: 95.5, bloodSugar: 120 })
    metrics: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    // Checkboxes/status for weekly tasks completion (e.g., { task_1: true, task_2: false })
    tasksCompleted: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

export default mongoose.model('PatientTrackingData', TrackingDataSchema);