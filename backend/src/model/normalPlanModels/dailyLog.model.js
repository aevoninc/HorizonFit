import mongoose from 'mongoose';
const dailyLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  zoneNumber: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, required: true },
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DIYTaskTemplate' }],
  notes: { type: String },
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible'] },
  createdAt: { type: Date, default: Date.now }
});

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

export default DailyLog;