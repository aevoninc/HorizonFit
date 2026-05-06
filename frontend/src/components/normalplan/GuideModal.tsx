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
    CheckCircle 
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
    completedTasks: string[];
    onToggleTask: (taskName: string) => void;
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
    habitCode,
    zone,
    completedTasks,
    onToggleTask,
    onClose
}) => {
    const [guide, setGuide] = useState<HabitGuide | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!habitCode) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await patientApi.getHabitGuide(habitCode, zone);
                setGuide(res.data.guide);
            } catch {
                toast({ title: "Failed to load guide", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [habitCode, zone, toast]);

    if (!habitCode) return null;
    const meta = HABIT_META[habitCode];

    const totalTasks = guide?.tasks?.length || 0;
    const doneCount = completedTasks.length;

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

                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            </div>
                        ) : guide ? (
                            <>
                                {guide.tasks && guide.tasks.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Action Checklist</h3>
                                            <span className="text-xs font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                                                {doneCount}/{totalTasks} DONE
                                            </span>
                                        </div>
                                        <div className="grid gap-2">
                                            {guide.tasks.map((task, idx) => {
                                                const isDone = completedTasks.includes(task.taskName);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isDone ? 'border-emerald-500/30 bg-emerald-50/30' : 'border-muted bg-white hover:border-muted-foreground/20'
                                                            }`}
                                                        onClick={() => onToggleTask(task.taskName)}
                                                    >
                                                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
                                                            }`}>
                                                            {isDone && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isDone ? 'text-emerald-900 line-through opacity-60' : 'text-foreground'}`}>
                                                            {task.taskName}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Understanding {habitCode}</h3>
                                    <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-border/50">
                                        {guide.content}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="font-medium text-foreground">Your guide will be available soon.</p>
                                <p className="text-sm text-muted-foreground mt-1">Our team is preparing your personalized instructions.</p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-5">
                        <Button variant="secondary" className="w-full h-11" onClick={onClose}>Finish Reading</Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
