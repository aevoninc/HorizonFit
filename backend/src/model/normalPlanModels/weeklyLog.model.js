import mongoose from 'mongoose';

const weeklyLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  weekNumber: { type: Number, required: true },
  zoneNumber: { type: Number, required: true, min: 1, max: 5 },
  metricsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PatientTrackingData' }],
  compliance: { 
    type: String, 
    required: true,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  completedTasks: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  notes: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('WeeklyLog', weeklyLogSchema);