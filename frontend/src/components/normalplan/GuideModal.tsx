import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Droplets,
    Salad,
    Dumbbell,
    Moon,
    Brain,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { patientApi, HabitCode, HabitGuide } from "@/lib/api";
import { getZoneName } from "@/lib/zoneUtils";

export const HABIT_META: Record<HabitCode, {
    icon: React.FC<{ className?: string }>;
    emoji: string;
    color: string;
    bgGradient: string;
    border: string;
    description: string;
}> = {
    Hydration: {
        icon: Droplets,
        emoji: "💧",
        color: "text-blue-500",
        bgGradient: "from-blue-50 to-cyan-50",
        border: "border-blue-200",
        description: "Drink at least 3L of water",
    },
    Nutrition: {
        icon: Salad,
        emoji: "🥗",
        color: "text-green-500",
        bgGradient: "from-green-50 to-emerald-50",
        border: "border-green-200",
        description: "Follow your prescribed meal plan",
    },
    Exercise: {
        icon: Dumbbell,
        emoji: "🏋️",
        color: "text-orange-500",
        bgGradient: "from-orange-50 to-amber-50",
        border: "border-orange-200",
        description: "Complete your daily workout",
    },
    Sleep: {
        icon: Moon,
        emoji: "🌙",
        color: "text-indigo-500",
        bgGradient: "from-indigo-50 to-violet-50",
        border: "border-indigo-200",
        description: "Get 7-8 hours of quality sleep",
    },
    Mindset: {
        icon: Brain,
        emoji: "🧠",
        color: "text-purple-500",
        bgGradient: "from-purple-50 to-fuchsia-50",
        border: "border-purple-200",
        description: "Practice your mindfulness drills",
    },
};

interface GuideModalProps {
    habitCode: HabitCode | null;
    zone: number;
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ habitCode, zone, onClose }) => {
    const [guide, setGuide] = useState<HabitGuide | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!habitCode) return;
        const fetch = async () => {
            setLoading(true);
            try {
                // Pass the zone prop to ensure we get the guide for the zone being viewed
                const res = await patientApi.getHabitGuide(habitCode, zone);
                console.log(res)
                setGuide(res.data.guide);
            } catch {
                toast({ title: "Failed to load guide", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [habitCode, toast]);

    if (!habitCode) return null;
    const meta = HABIT_META[habitCode];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                >
                    <div className={`bg-gradient-to-r ${meta.bgGradient} px-6 py-5 flex items-center justify-between border-b ${meta.border}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{meta.emoji}</span>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{habitCode}</h2>
                                <p className="text-sm text-muted-foreground">{getZoneName(zone)} Guidance</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-black/10 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            </div>
                        ) : guide ? (
                            <div className="prose prose-sm max-w-none">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{guide.content}</p>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="font-medium text-foreground">Your guide will be available soon.</p>
                                <p className="text-sm text-muted-foreground mt-1">Our team is preparing your personalized instructions.</p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-5">
                        <Button variant="outline" className="w-full h-11" onClick={onClose}>Close</Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
