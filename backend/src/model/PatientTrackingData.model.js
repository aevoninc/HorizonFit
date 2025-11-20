// src/model/patientTrackingData.model.js

import mongoose from 'mongoose';

const TrackingDataSchema = new mongoose.Schema({
    // 1. Link to the User
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // 2. When the data was taken
    dateRecorded: { 
        type: Date, 
        required: true 
    },
    
    // 3. Optional: Contextual week for easy grouping
    weekNumber: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 15 
    },
    
    // 4. Objective Measurement (e.g., Blood Sugar, Weight)
    // We are simplifying 'metrics' to be a clear list of health metrics:
    type: {
        type: String,
        enum: ['Weight', 'BloodSugar', 'BloodPressure', 'Activity'], 
        required: true 
    },
    
    // 5. The actual value
    value: {
        type: Number,
        required: true
    },
    
    // 6. Unit of measurement (e.g., kg, mg/dL)
    unit: {
        type: String,
        required: true
    }

}, { timestamps: true });

export default mongoose.model('PatientTrackingData', TrackingDataSchema);