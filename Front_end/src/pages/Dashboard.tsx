import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DietPlan {
  day: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [dietType, setDietType] = useState<"loss" | "gain">("loss");
  const [selectedDay, setSelectedDay] = useState(1);

  // useEffect(() => {
  //   const session = localStorage.getItem("userSession");
  //   if (!session) {
  //     navigate("/login");
  //     return;
  //   }
  //   const parsedSession = JSON.parse(session);
  //   if (parsedSession.type !== "user") {
  //     navigate("/login");
  //     return;
  //   }
  //   setUserEmail(parsedSession.email);

  //   // Load saved diet type
  //   const savedDietType = localStorage.getItem("dietType");
  //   if (savedDietType) {
  //     setDietType(savedDietType as "loss" | "gain");
  //   }
  // }, [navigate]);
  useEffect(() => {
  const session = localStorage.getItem("userSession");
  if (!session) {
    navigate("/login");
    return;
  }

  const parsedSession = JSON.parse(session);

  // FIXED: patient, not user
  if (parsedSession.type !== "patient") {
    navigate("/login");
    return;
  }

  setUserEmail(parsedSession.email);

  const savedDietType = localStorage.getItem("dietType");
  if (savedDietType) {
    setDietType(savedDietType as "loss" | "gain");
  }
}, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  const handleDietTypeChange = (type: "loss" | "gain") => {
    setDietType(type);
    localStorage.setItem("dietType", type);
    setSelectedDay(1);
  };

  // Sample diet plans
  const weightLossPlan: DietPlan[] = [
    {
      day: 1,
      breakfast: "Oatmeal with berries and almonds (350 cal)",
      lunch: "Grilled chicken salad with olive oil (450 cal)",
      dinner: "Baked salmon with steamed vegetables (500 cal)",
      snacks: "Greek yogurt, apple (200 cal)",
    },
    {
      day: 2,
      breakfast: "Scrambled eggs with spinach and whole grain toast (400 cal)",
      lunch: "Quinoa bowl with chickpeas and veggies (480 cal)",
      dinner: "Turkey meatballs with zucchini noodles (450 cal)",
      snacks: "Handful of nuts, carrot sticks (180 cal)",
    },
    {
      day: 3,
      breakfast: "Protein smoothie with banana and spinach (380 cal)",
      lunch: "Tuna salad wrap with whole wheat tortilla (420 cal)",
      dinner: "Grilled chicken breast with roasted sweet potato (520 cal)",
      snacks: "Cottage cheese, cucumber slices (150 cal)",
    },
  ];

  const weightGainPlan: DietPlan[] = [
    {
      day: 1,
      breakfast: "Pancakes with peanut butter and banana (650 cal)",
      lunch: "Beef burger with sweet potato fries (850 cal)",
      dinner: "Pasta with meatballs and cheese (900 cal)",
      snacks: "Protein shake, trail mix (500 cal)",
    },
    {
      day: 2,
      breakfast: "French toast with syrup and eggs (700 cal)",
      lunch: "Chicken rice bowl with avocado (800 cal)",
      dinner: "Steak with mashed potatoes and gravy (950 cal)",
      snacks: "Granola bar, whole milk (450 cal)",
    },
    {
      day: 3,
      breakfast: "Bagel with cream cheese and salmon (680 cal)",
      lunch: "BBQ ribs with mac and cheese (900 cal)",
      dinner: "Grilled chicken thighs with rice pilaf (880 cal)",
      snacks: "Peanut butter toast, banana (520 cal)",
    },
  ];

  const currentPlan = dietType === "loss" ? weightLossPlan : weightGainPlan;
  const currentDay = currentPlan[selectedDay - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
          <img src="/logo.png" className="h-14" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 animate-fade-in">
            Your <span className="text-gradient">Diet Plan</span>
          </h2>
          <p className="text-muted-foreground mb-8 animate-fade-in">
            Follow your personalized 3-week nutrition plan
          </p>

          {/* Diet Type Selection */}
          <div className="flex gap-4 mb-8 animate-slide-up">
            <Button
              variant={dietType === "loss" ? "default" : "outline"}
              onClick={() => handleDietTypeChange("loss")}
              className={dietType === "loss" ? "gradient-orange text-white" : ""}
            >
              Weight Loss Plan
            </Button>
            <Button
              variant={dietType === "gain" ? "default" : "outline"}
              onClick={() => handleDietTypeChange("gain")}
              className={dietType === "gain" ? "gradient-orange text-white" : ""}
            >
              Weight Gain Plan
            </Button>
          </div>

          {/* Day Selector */}
          <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(Number(v))} className="animate-fade-in">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="1">Day 1</TabsTrigger>
              <TabsTrigger value="2">Day 2</TabsTrigger>
              <TabsTrigger value="3">Day 3</TabsTrigger>
            </TabsList>

            {[1, 2, 3].map((day) => (
              <TabsContent key={day} value={day.toString()}>
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle>
                      Day {day} - {dietType === "loss" ? "Weight Loss" : "Weight Gain"}
                    </CardTitle>
                    <CardDescription>
                      Follow this meal plan for optimal results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-lg mb-2">🌅 Breakfast</h4>
                      <p className="text-muted-foreground">{currentDay.breakfast}</p>
                    </div>

                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-semibold text-lg mb-2">☀️ Lunch</h4>
                      <p className="text-muted-foreground">{currentDay.lunch}</p>
                    </div>

                    <div className="border-l-4 border-primary-light pl-4">
                      <h4 className="font-semibold text-lg mb-2">🌙 Dinner</h4>
                      <p className="text-muted-foreground">{currentDay.dinner}</p>
                    </div>

                    <div className="border-l-4 border-muted pl-4">
                      <h4 className="font-semibold text-lg mb-2">🍎 Snacks</h4>
                      <p className="text-muted-foreground">{currentDay.snacks}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-8 p-6 bg-gradient-orange-subtle rounded-lg animate-fade-in">
            <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Drink at least 8 glasses of water daily</li>
              <li>• Maintain consistent meal times</li>
              <li>• Track your progress weekly</li>
              <li>• Contact your coach if you need adjustments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
