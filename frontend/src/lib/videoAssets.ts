export const ZONE_VIDEOS_MAP: Record<number, string[]> = {
    1: [
        "1. Zone 1 - Orientation Video.mp4",
        "2. Zone 1- DIY- Hydration tracker video.mp4",
        "4. Zone 1 Nutrition Video.mp4",
        "6. Zone 1 Exercise Video.mp4",
        "8. Zone 1 hydration Video.mp4",
        "10. Zone 1 Sleep Video.mp4",
        "12. Zone 1 Mindset Video.mp4",
        "14. How to Use Horizon Fit – Final Orientation.mp4",
    ],
    2: [
        "1. Zone 2 - Orientation Video.mp4",
        "2. Zone 2- DIY- Sleep tracker video.mp4",
        "4. Zone 2 Nutrition Video.mp4",
        "6. Zone 2 Exercise Video.mp4",
        "8. Zone 2 hydration Video.mp4",
        "10. Zone 2 Sleep Video.mp4.mp4",
        "12. Zone 2 Mindset Video.mp4",
        "14. How to Use Horizon Fit – Final Orientation.mp4",
    ],
    3: [
        "1. Zone 3 - Orientation Video.mp4",
        "2. Zone 3- DIY- Nutrition tracker video.mp4",
        "4. Zone 3 Nutrition Video.mp4",
        "6. Zone 3 Exercise Video.mp4",
        "8. Zone 3 hydration Video.mp4",
        "10. Zone 3 Sleep Video.mp4.mp4",
        "12. Zone 3 Mindset Video.mp4",
        "14. How to Use Horizon Fit – Final Orientation.mp4",
    ],
    4: [
        "1. Zone 4 - Orientation Video.mp4",
        "2. Zone 4- DIY- Exercise tracker video.mp4",
        "4. Zone 4 Nutrition Video.mp4",
        "6. Zone 4 Exercise Video.mp4",
        "8. Zone 4 hydration Video.mp4",
        "10. Zone 4 Sleep Video.mp4.mp4",
        "12. Zone 4 Mindset Video.mp4",
        "14. How to Use Horizon Fit – Final Orientation.mp4",
    ],
    5: [
        "1. Zone 5 - Orientation Video.mp4",
        "2. Zone 5- DIY- Mindset tracker video.mp4",
        "4. Zone 5 Nutrition Video.mp4",
        "6. Zone 5 Exercise Video.mp4",
        "8. Zone 5 hydration Video.mp4",
        "10. Zone 5 Sleep Video.mp4.mp4",
        "12. Zone 5 Mindset Video.mp4",
        "14. How to Use Horizon Fit – Final Orientation.mp4",
    ],
};

export const START_HERE_VIDEOS = [
    "1. Before You Start Horizon Fit.mp4",
    "2. Welcome to Horizon Fit – How the Program Works.mp4"
];

export const getLocalZoneVideoUrl = (zoneNumber: number, title: string): string | null => {
    const filenames = ZONE_VIDEOS_MAP[zoneNumber] || [];
    // Find a loose match
    const tLower = title.toLowerCase();
    const match = filenames.find(f => {
        const fLower = f.toLowerCase();
        // Use keywords matching based on usual titles (Orientation, Nutrition, etc.)
        if (tLower.includes('orientation') && fLower.includes('orientation') && !fLower.includes('final')) return true;
        if (tLower.includes('final') && fLower.includes('final')) return true;
        if (tLower.includes('nutrition') && fLower.includes('nutrition')) return true;
        if (tLower.includes('exercise') && fLower.includes('exercise')) return true;
        if (tLower.includes('hydration') && fLower.includes('hydration')) return true;
        if (tLower.includes('sleep') && fLower.includes('sleep')) return true;
        if (tLower.includes('mindset') && fLower.includes('mindset')) return true;
        if (tLower.includes('tracker') && fLower.includes('diy')) return true;
        return fLower.includes(tLower);
    });

    if (match) {
        return `/horizonFitVideos/Zone- ${zoneNumber}/${match}`;
    }
    return null;
};

// ─── Zone PDFs ────────────────────────────────────────────────────────────────
export const ZONE_PDFS_MAP: Record<number, string[]> = {
    1: [
        "3. Zone 1 -DIY- Hydration tracker pdf.pdf",
        "5. Zone-1 Nutrition template.pdf",
        "7. ZONE-1-Exercise-Blueprint-Tracker.pdf",
        "9. Horizon-Fit-21-Day-Zone-1-Hydration-Tracker.pdf",
        "11. Horizon-Fit-Zone-1-Sleep-Tracker.pdf",
        "13. Horizon-Fit-Zone-1-Mindset-Tracker.pdf",
        "15. Horizon-Daily-Code-Zone-1-Workbook.pdf",
    ],
    2: [
        "3. Zone 2 - DIY -Sleep tracker pdf.pdf",
        "5. Personal-Nutrition-Calculator-ZONE-2.pdf",
        "7. ZONE-2-Exercise-Blueprint-Tracker.pdf",
        "9. Horizon-Fit-21-Day-Zone-2-Hydration-Tracker.pdf",
        "11. Horizon-Fit-Zone-2-Sleep-Tracker.pdf",
        "13. Horizon-Fit-Zone-2-Mindset-Tracker.pdf",
        "15. Horizon-Daily-Code-Zone-2-Workbook.pdf",
    ],
    3: [
        "3. Zone 3 - DIY -Nutrition tracker pdf.pdf",
        "5. Personal-Nutrition-Calculator-ZONE-3.pdf",
        "7. ZONE-3-Exercise-Blueprint-Tracker.pdf",
        "9. Horizon-Fit-21-Day-Zone-3-Hydration-Tracker.pdf",
        "11. Horizon-Fit-Zone-3-Sleep-Tracker.pdf",
        "13. Horizon-Fit-Zone-3-Mindset-Tracker.pdf",
        "15. Horizon-Daily-Code-Zone-3-Workbook.pdf",
    ],
    4: [
        "3. Zone 4 - DIY -Exercise tracker pdf.pdf",
        "5. Personal-Nutrition-Calculator-ZONE-4.pdf",
        "7. ZONE-4-Exercise-Blueprint-Tracker.pdf",
        "9. Horizon-Fit-21-Day-Zone-4-Hydration-Tracker.pdf",
        "11. Horizon-Fit-Zone-4-Sleep-Tracker.pdf",
        "13. Horizon-Fit-Zone-4-Mindset-Tracker.pdf",
        "15. Horizon-Daily-Code-Zone-4-Workbook.pdf",
    ],
    5: [
        "3. Zone 5 - DIY -Mindset tracker pdf.pdf",
        "5. Personal-Nutrition-Calculator-ZONE-5.pdf",
        "7. ZONE-5-Exercise-Blueprint-Tracker.pdf",
        "9. Horizon-Fit-21-Day-Zone-5-Hydration-Tracker.pdf",
        "11. Horizon-Fit-Zone-5-Sleep-Tracker.pdf",
        "13. Horizon-Fit-Zone-5-Mindset-Tracker.pdf",
        "15. Horizon-Daily-Code-Zone-5-Workbook.pdf",
    ],
};

import { ZonePDF } from './normalPlanTypes';

export const getLocalZonePDFs = (zoneNumber: number): ZonePDF[] => {
    const files = ZONE_PDFS_MAP[zoneNumber] || [];
    return files.map((f, i) => ({
        id: `pdf-zone-${zoneNumber}-${i}`,
        title: f.replace('.pdf', '').replace(/^[0-9]+\.\s*/, ''),
        pdfUrl: `/horizonFitVideos/Zone- ${zoneNumber}/${f}`,
        zoneNumber,
        order: i,
    }));
};

// Map backend categories to folder structure
export const GUIDE_CATEGORY_MAPPING: Record<string, string> = {
    'calories': '1. Nutrition',
    'workouts': '2. Exercise',
    'hydration': '3. Hydration',
    'sleep': '4. Sleep',
    'mindset': '5. Mindset',
};

// Raw static list
export const GUIDE_VIDEOS_MAP: Record<string, string[]> = {
    '1. Nutrition': [
        "N1. Horizon Fit Start Here – Your Nutrition Roadmap video .mp4",
        "N2. Horizon Fit_ Find Your Daily Calories video.mp4",
        "N3. Horizon Fit_ How to Use Your Daily Calories video.mp4",
        "N4. Horizon Fit- Balanced Plate Method video.mp4",
        "N5. Horizon Fit The Daily Nutrition Blueprint video.mp4"
    ],
    '2. Exercise': [
        "E1. Horizon Fit Exercise Roadmap.mp4",
        "E2. Horizon Fit Safe Exercise System.mp4",
        "E3. Horizon Fit RPE Guide.mp4",
        "E4. Horizon Fit 5 Pillars of Exercise.mp4",
        "E5. Horizon Fit How to use Exercise Blueprint tracker.mp4"
    ],
    '3. Hydration': [
        "H1 Golden Rule of hydration.mp4",
        "H2 Hydration Mistakes & Weight Loss.mp4",
        "H3 Water vs Thirst vs Hunger.mp4",
        "H4 Hydration During Exercise.mp4",
        "H5 Hydration in Different Climates & Seasons.mp4"
    ],
    '4. Sleep': [
        "S1 The Golden Rule of Sleep.mp4",
        "S2 Why Your Sleep Feels Broken.mp4",
        "S3 Why Fixing Mornings Fixes Nights.mp4",
        "S4 Sleep & Weight Loss The Missing Link.mp4",
        "S5 How to Handle Bad Nights.mp4"
    ],
    '5. Mindset': [
        "M1 Training Your Brain for a Healthier Body.mp4",
        "M2 Why Change Feels Difficult at the Beginning.mp4",
        "M3  How the Brain Builds Stability Through Repetition.mp4",
        "M4 Why Progress Often Feels Slow in the Middle Phase.mp4",
        "M5 How Identity Changes Before Results Fully Appear.mp4"
    ]
};

import { HorizonGuideVideo } from './normalPlanTypes';

export const getLocalGuideVideos = (category: string): HorizonGuideVideo[] => {
    const folder = GUIDE_CATEGORY_MAPPING[category];
    if (!folder) return [];
    const files = GUIDE_VIDEOS_MAP[folder] || [];
    return files.map((f, i) => ({
        id: `local-guide-${category}-${i}`,
        category: category as any,
        title: f.replace('.mp4', '').replace(/^[A-Z0-9]+\. /, ''),
        description: '',
        videoUrl: `/horizonFitVideos/Horizon Guide/${folder}/${f}`,
        duration: "N/A",
        order: i
    }));
};
