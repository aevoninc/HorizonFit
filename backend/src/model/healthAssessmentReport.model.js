import mongoose from 'mongoose';

const healthAssessmentReportSchema = new mongoose.Schema({
    accessTokenHash: {
        type: String,
        required: true,
        unique: true,
        select: false,
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
    },
    mobile: {
        type: String,
        trim: true,
    },
    formData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });

healthAssessmentReportSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);
healthAssessmentReportSchema.index(
    { mobile: 1 },
    { unique: true, partialFilterExpression: { mobile: { $type: 'string' } } },
);

export default mongoose.model('HealthAssessmentReport', healthAssessmentReportSchema);