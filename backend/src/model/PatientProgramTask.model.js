// models/PatientProgramTask.js
import mongoose from 'mongoose';

const PatientProgramTaskSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    programWeek: { type: Number, required: true, min: 1, max: 15 },
    
    frequency: { type: String, enum: ['Daily', 'SpecificDays', 'Weekly', 'OneTime'], required: true }, 
    
    daysApplicable: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    
    metricRequired: { type: String, enum: ['BloodSugar', 'Weight', 'Activity', null], default: null },

    status: { type: String, enum: ['Pending', 'Completed', 'Missed'], default: 'Pending' },

    completionDate: { type: Date, default: null }, 
    
}, { timestamps: true });

export default mongoose.model('PatientProgramTask', PatientProgramTaskSchema);