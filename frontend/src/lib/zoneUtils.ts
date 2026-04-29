export const ZONE_NAMES: Record<number, string> = {
    1: "Foundation",
    2: "Momentum",
    3: "Transformation",
    4: "Mastery",
    5: "Freedom",
};

export const getZoneName = (zone: number): string => {
    return ZONE_NAMES[zone] || `Zone ${zone}`;
};
