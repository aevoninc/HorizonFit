import mongoose from 'mongoose';

// Zone Video Schema
const zoneVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String},
  pdfUrl:{type: String},
  thumbnailUrl: { type: String },
  duration: { type: String },
  zoneNumber: { type: Number, required: true, min: 1, max: 5 },
  order: { type: Number, default: 0 },
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ZoneVideo = mongoose.model('ZoneVideo', zoneVideoSchema);

export default ZoneVideo