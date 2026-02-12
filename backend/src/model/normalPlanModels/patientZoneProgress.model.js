import mongoose from 'mongoose';

const patientZoneProgressSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  zoneNumber: { type: Number, required: true, min: 1, max: 5 },
  isUnlocked: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  videosCompleted: { type: Boolean, default: false },
  watchedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ZoneVideo' }],
  weeksInZone: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

const PatientZoneProgress = mongoose.model('PatientZoneProgress', patientZoneProgressSchema);

export default PatientZoneProgress;