export const ZONE_NAMES: Record<number, string> = {
    1: "Foundation",
    2: "Momentum",
    3: "Transformation",
    4: "Mastery",
    5: "Freedom",
};

export const ZONE_MOTIVATIONS: Record<number, string> = {
    1: "Small daily actions. Big results.",
    2: "Keep the momentum. You're building strength.",
    3: "Transformation is happening. Stay focused.",
    4: "Mastering your habits. Mastering your life.",
    5: "Freedom is the reward for consistency.",
};

export const getZoneName = (zone: number): string => {
    return ZONE_NAMES[zone] || `Zone ${zone}`;
};

export const getZoneMotivation = (zone: number): string => {
    return ZONE_MOTIVATIONS[zone] || "";
};
