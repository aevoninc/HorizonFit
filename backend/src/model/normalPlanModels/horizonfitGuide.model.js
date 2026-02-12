import mongoose from 'mongoose';

const horizonGuideVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  duration: { type: String },
  category: { 
    type: String, 
    required: true,
    enum: ['calories', 'workouts', 'hydration', 'sleep', 'mindset']
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('HorizonFitGuide', horizonGuideVideoSchema);