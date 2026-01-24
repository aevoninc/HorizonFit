import mongoose from 'mongoose';


const recommendationsCacheSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  metricsId: { type: mongoose.Schema.Types.ObjectId, ref: 'BodyMetrics', required: true },
  dailyCalories: { type: Number, required: true },
  waterIntake: { type: Number, required: true },
  sleepDuration: { type: Number, required: true },
  sleepBedTime: { type: String },
  sleepWakeTime: { type: String },
  exerciseMinutes: { type: Number, required: true },
  exerciseType: { type: String },
  meditationMinutes: { type: Number, required: true },
  mindsetTip: { type: String },
  // Doctor can override any recommendation
  doctorOverride: {
    dailyCalories: { type: Number },
    waterIntake: { type: Number },
    sleepDuration: { type: Number },
    exerciseMinutes: { type: Number },
    exerciseType: { type: String },
    meditationMinutes: { type: Number },
    customNotes: { type: String }
  },
  calculatedAt: { type: Date, default: Date.now }
});


const RecommendationsCache = mongoose.model('RecommendationsCache', recommendationsCacheSchema);
export default RecommendationsCache;