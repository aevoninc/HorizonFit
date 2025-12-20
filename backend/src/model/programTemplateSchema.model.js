// models/ProgramTemplate.js
import mongoose from 'mongoose';

const ProgramTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Weight Loss Program"
    metricType: { type: String, enum: ['Weight Gain', 'Weight Loss'], required: true },
    
    // This is the array of "blueprint" tasks
    tasks: [{
        description: { type: String, required: true },
        programWeek: { type: Number, required: true, min: 1, max: 15 },
        zone: { type: Number, required: true, min: 1, max: 5 },
        frequency: { type: String, enum: ['Daily', 'SpecificDays', 'Weekly', 'OneTime'], required: true },
        daysApplicable: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
        timeOfDay: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night'] },
        metricRequired: { type: String, enum: ['Weight Gain', 'Weight Loss', null] }
    }]
}, { timestamps: true });

export default mongoose.model('ProgramTemplate', ProgramTemplateSchema);