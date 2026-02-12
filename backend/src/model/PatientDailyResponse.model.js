import mongoose from 'mongoose';

const PatientDailyResponseSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true
    },
    breakfast: String,
    lunch: String,
    dinner: String,
    meditationMinutes: Number,
    waterLitres: Number,
    exerciseMinutes: Number,
    sleepTime: String,
    sleepFrom: String,
    sleepTo: String
});

// Ensure one response per patient per day
PatientDailyResponseSchema.index({ patientId: 1, date: 1 }, { unique: true });

export default mongoose.model('PatientDailyResponse', PatientDailyResponseSchema);