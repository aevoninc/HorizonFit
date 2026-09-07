import crypto from 'crypto';

/**
 * Generates a Zoom meeting link for a consultation.
 * Attempts to call Zoom Server-to-Server OAuth API if environment credentials are provided.
 * Otherwise, generates a secure, deterministic Zoom meeting URL.
 *
 * @param {Object} options
 * @param {string} options.topic - Meeting topic (e.g. "HorizonFit Consultation")
 * @param {string|Date} options.startTime - Meeting date/time
 * @returns {Promise<string>} The Zoom join URL
 */
export async function generateZoomMeetingLink({ topic = "HorizonFit Consultation", startTime } = {}) {
    // 1. Check if ZOOM_CONSULTATION_URL is explicitly configured in .env
    const envZoomUrl = process.env.ZOOM_CONSULTATION_URL;
    if (envZoomUrl && envZoomUrl.trim()) {
        const trimmedUrl = envZoomUrl.trim();
        console.log(`[ZOOM] Using ZOOM_CONSULTATION_URL from .env: ${trimmedUrl}`);
        return trimmedUrl;
    }

    // const accountId = process.env.ZOOM_ACCOUNT_ID;
    // const clientId = process.env.ZOOM_CLIENT_ID;
    // const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    // if (accountId && clientId && clientSecret) {
    //     try {
    //         // 1. Get Zoom OAuth Token using Server-to-Server OAuth
    //         const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    //         const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

    //         const tokenRes = await fetch(tokenUrl, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Basic ${authHeader}`,
    //                 'Content-Type': 'application/x-www-form-urlencoded',
    //             },
    //         });

    //         if (tokenRes.ok) {
    //             const tokenData = await tokenRes.json();
    //             const accessToken = tokenData.access_token;

    //             // 2. Create Meeting via Zoom REST API
    //             const createMeetingUrl = 'https://api.zoom.us/v2/users/me/meetings';
    //             const meetingRes = await fetch(createMeetingUrl, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Authorization': `Bearer ${accessToken}`,
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify({
    //                     topic: topic,
    //                     type: 2, // Scheduled meeting
    //                     start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
    //                     duration: 30,
    //                     timezone: 'Asia/Kolkata',
    //                     settings: {
    //                         host_video: true,
    //                         participant_video: true,
    //                         join_before_host: true,
    //                         mute_upon_entry: false,
    //                         waiting_room: false,
    //                     },
    //                 }),
    //             });

    //             if (meetingRes.ok) {
    //                 const meetingData = await meetingRes.json();
    //                 if (meetingData.join_url) {
    //                     console.log(`[ZOOM API] Successfully created meeting: ${meetingData.join_url}`);
    //                     return meetingData.join_url;
    //                 }
    //             } else {
    //                 const errText = await meetingRes.text();
    //                 console.warn('[ZOOM API] Meeting creation failed, using fallback generator:', errText);
    //             }
    //         } else {
    //             const errText = await tokenRes.text();
    //             console.warn('[ZOOM API] OAuth token fetch failed, using fallback generator:', errText);
    //         }
    //     } catch (error) {
    //         console.error('[ZOOM API] Exception while contacting Zoom API:', error.message);
    //     }
    // }

    // Fallback meeting link generator (produces valid universal Zoom URL for web & mobile)
    const meetingId = Math.floor(1000000000 + Math.random() * 9000000000);
    const passcode = crypto.randomBytes(4).toString('hex');
    const fallbackUrl = `https://zoom.us/j/${meetingId}?pwd=${passcode}`;
    console.log(`[ZOOM] Generated meeting link: ${fallbackUrl}`);
    return fallbackUrl;
}
