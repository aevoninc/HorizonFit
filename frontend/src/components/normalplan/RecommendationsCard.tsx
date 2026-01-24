import { motion } from "framer-motion";
import {
  Flame,
  Droplets,
  Moon,
  Dumbbell,
  Brain,
  Sparkles,
  Clock,
  Sun,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthRecommendations } from "@/lib/normalPlanTypes";

interface RecommendationsCardProps {
  recommendations: HealthRecommendations;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
}) => {
  const items = [
    {
      icon: Flame,
      label: "Daily Calories",
      value: `${recommendations.dailyCalories.toLocaleString()} kcal`,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      icon: Droplets,
      label: "Water Intake",
      value: `${recommendations.waterIntake} liters`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Moon,
      label: "Sleep Duration",
      value: `${recommendations.sleepDuration} hours`,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      icon: Clock,
      label: "Sleep Schedule",
      value: recommendations.sleepSchedule?.bedTime
        ? `${recommendations.sleepSchedule.bedTime} - ${recommendations.sleepSchedule.wakeTime}`
        : "Maintain a regular routine",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Dumbbell,
      label: "Exercise",
      value: `${recommendations.exerciseMinutes} min/day`,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Brain,
      label: "Meditation",
      value: `${recommendations.meditationMinutes} min/day`,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader className="gradient-teal pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Sparkles className="h-5 w-5" />
          Your Personalized Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Exercise Type Detail */}
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex items-start gap-3">
            <Sun className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Recommended Exercise
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                {recommendations.exerciseType}
              </p>
            </div>
          </div>
        </div>

        {/* Mindset Tip */}
        <div className="mt-4 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
          <div className="flex items-start gap-3">
            <Brain className="mt-0.5 h-5 w-5 text-secondary" />
            <div>
              <p className="font-medium text-secondary">Daily Mindset</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {recommendations.mindsetTip}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
