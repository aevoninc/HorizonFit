import { sendHealthAssessmentEmail } from '../utils/mailer.js';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateHealthAssessmentForm = (formData) => {
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
        return 'Assessment details are required.';
    }

    if (typeof formData.fullName !== 'string' || formData.fullName.trim().length < 2 || formData.fullName.length > 120) {
        return 'A valid full name is required.';
    }
    if (typeof formData.email !== 'string' || !isValidEmail(formData.email) || formData.email.length > 254) {
        return 'A valid email address is required.';
    }
    if (typeof formData.mobile !== 'string' || formData.mobile.replace(/\D/g, '').length < 10 || formData.mobile.length > 30) {
        return 'A valid mobile number is required.';
    }

    const age = Number(formData.age);
    const height = Number(formData.height);
    const weight = Number(formData.weight);
    const waist = Number(formData.waist);
    if (!Number.isInteger(age) || age < 15 || age > 110) return 'Age is outside the accepted range.';
    if (!Number.isFinite(height) || height < 100 || height > 240) return 'Height is outside the accepted range.';
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) return 'Weight is outside the accepted range.';
    if (!Number.isFinite(waist) || waist < 45 || waist > 200) return 'Waist circumference is outside the accepted range.';
    if (formData.confirmedAccurate !== true) return 'Assessment consent is required.';

    return null;
};

const makeReportFilename = (formData) => {
    const safeName = formData.fullName.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Client';
    const dateParts = String(formData.assessmentDate || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const date = dateParts
        ? `${dateParts[3]}-${dateParts[2].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
        : new Date().toISOString().slice(0, 10);
    return `HorizonFit_Health_Insight_Report_${safeName}_${date}.pdf`;
};

export const submitHealthAssessment = async (req, res) => {
    let formData;
    try {
        formData = JSON.parse(req.body.formData || '');
    } catch {
        return res.status(400).json({ message: 'Assessment details must be valid JSON.' });
    }

    const validationError = validateHealthAssessmentForm(formData);
    if (validationError) return res.status(400).json({ message: validationError });
    if (!req.file || req.file.mimetype !== 'application/pdf' || !req.file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        return res.status(400).json({ message: 'A valid PDF report attachment is required.' });
    }

    const filename = makeReportFilename(formData);
    try {
        const delivery = await sendHealthAssessmentEmail({
            formData,
            filename,
            pdfBuffer: req.file.buffer,
        });
        return res.status(200).json({
            message: 'Assessment submitted and report emailed successfully.',
            recipient: delivery.recipient,
            filename,
        });
    } catch (error) {
        console.error('[EMAIL] Health assessment delivery failed:', error.message);
        return res.status(502).json({ message: 'The assessment was received, but the report email could not be sent. Please try again.' });
    }
};