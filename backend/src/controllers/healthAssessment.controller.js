import { createHash, randomBytes } from 'crypto';
import { sendHealthAssessmentEmail } from '../utils/mailer.js';
import HealthAssessmentReport from '../model/healthAssessmentReport.model.js';

const hashAccessToken = (token) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeMobile = (mobile) => {
    const digits = mobile.replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

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
    if (typeof formData.mobile !== 'string' || normalizeMobile(formData.mobile).length !== 10 || formData.mobile.length > 30) {
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
    const normalizedEmail = normalizeEmail(formData.email);
    const normalizedMobile = normalizeMobile(formData.mobile);
    const storedFormData = {
        fullName: formData.fullName,
        mobile: normalizedMobile,
        email: normalizedEmail,
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        waist: formData.waist,
        familyDiabetes: formData.familyDiabetes,
        highBloodSugar: formData.highBloodSugar,
        highBP: formData.highBP,
        physicalActivity: formData.physicalActivity,
        conditions: formData.conditions,
        primaryGoal: formData.primaryGoal,
        contactPreference: formData.contactPreference,
        assessmentDate: formData.assessmentDate,
        confirmedAccurate: formData.confirmedAccurate,
    };
    const accessToken = randomBytes(32).toString('base64url');
    const reportUrl = new URL('/', process.env.ASSESSMENT_APP_URL || 'https://assessment.horizonfit.in');
    reportUrl.hash = `token=${accessToken}`;

    try {
        const [emailMatch, mobileMatch] = await Promise.all([
            HealthAssessmentReport.findOne({ email: normalizedEmail }),
            HealthAssessmentReport.findOne({ mobile: normalizedMobile }),
        ]);

        if ((emailMatch && emailMatch.mobile !== normalizedMobile)
            || (mobileMatch && mobileMatch.email !== normalizedEmail)
            || (emailMatch && mobileMatch && !emailMatch._id.equals(mobileMatch._id))) {
            return res.status(409).json({
                message: 'That email or phone number is already linked to a different assessment. Use the same email and phone together, or contact Horizon Fit for help.',
            });
        }

        const reportRecord = emailMatch || mobileMatch;
        const reportUpdate = {
            email: normalizedEmail,
            mobile: normalizedMobile,
            accessTokenHash: hashAccessToken(accessToken),
            formData: storedFormData,
        };

        if (reportRecord) {
            await HealthAssessmentReport.findByIdAndUpdate(reportRecord._id, { $set: reportUpdate }, { runValidators: true });
        } else {
            await HealthAssessmentReport.create(reportUpdate);
        }

        const delivery = await sendHealthAssessmentEmail({
            formData: storedFormData,
            filename,
            pdfBuffer: req.file.buffer,
            reportUrl: reportUrl.toString(),
        });
        return res.status(200).json({
            message: 'Assessment saved.',
            recipient: delivery.recipient,
            filename,
            accessToken,
            emailDelivery: {
                clinic: delivery.clinicEmailSent,
                respondent: delivery.reportLinkSent,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'That email or phone number is already linked to a different assessment. Use the same email and phone together, or contact Horizon Fit for help.',
            });
        }
        console.error('[EMAIL] Health assessment delivery failed:', error.message);
        return res.status(500).json({ message: 'The assessment could not be saved. Please try again.' });
    }
};

export const getHealthAssessmentReport = async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');

    const match = req.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
    if (!match) return res.status(401).json({ message: 'A valid report access link is required.' });

    const report = await HealthAssessmentReport.findOne({
        accessTokenHash: hashAccessToken(match[1]),
    }).lean();

    if (!report) return res.status(404).json({ message: 'This saved report could not be found.' });
    return res.status(200).json({ formData: report.formData, updatedAt: report.updatedAt });
};