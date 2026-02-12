import mongoose from 'mongoose';
const diyTaskTemplateSchema = new mongoose.Schema({
  zoneNumber: { type: Number, required: true, min: 1, max: 5 },
  category: { 
    type: String, 
    required: true,
    enum: ['nutrition', 'exercise', 'hydration', 'sleep', 'mindset']
  },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DIYTaskTemplate = mongoose.model('DIYTaskTemplate', diyTaskTemplateSchema);
export default DIYTaskTemplate;