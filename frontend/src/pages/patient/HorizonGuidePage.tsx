import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calculator,
  Dumbbell,
  Droplets,
  Moon,
  Brain,
  Play,
  Clock,
  ChevronLeft,
  Video,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  HorizonGuideVideo,
  HORIZON_GUIDE_CATEGORIES,
} from "@/lib/normalPlanTypes";
import { normalPlanPatientApi } from "@/lib/normalPlanApi";

const iconMap: Record<string, React.ElementType> = {
  Calculator,
  Dumbbell,
  Droplets,
  Moon,
  Brain,
};

export const HorizonGuidePage: React.FC = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<HorizonGuideVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("calories");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<HorizonGuideVideo | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [activeCategory]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await normalPlanPatientApi.getHorizonGuideVideos(
        activeCategory === "all" ? undefined : activeCategory
      );
      setVideos(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesCategory =
      activeCategory === "all" || video.category === activeCategory;
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const Icon =
      iconMap[
        HORIZON_GUIDE_CATEGORIES.find((c) => c.value === category)?.icon ||
          "BookOpen"
      ] || BookOpen;
    return Icon;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/patient/normal-plan">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-secondary" />
              Horizon Guide
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your comprehensive library for self-managed health education
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex w-full flex-wrap gap-2 h-auto bg-transparent p-0">
          {HORIZON_GUIDE_CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || BookOpen;
            const count = videos.filter(
              (v) => v.category === category.value
            ).length;

            return (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 data-[state=active]:border-secondary data-[state=active]:bg-secondary/10"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {category.label.split(" ").slice(-1)[0]}
                </span>
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {HORIZON_GUIDE_CATEGORIES.map((category) => (
          <TabsContent
            key={category.value}
            value={category.value}
            className="mt-6"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {category.label}
              </h2>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Video Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video, index) => {
          const CategoryIcon = getCategoryIcon(video.category);

          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="card-elevated cursor-pointer transition-all hover:shadow-lg hover:border-secondary/50"
                onClick={() => {
                  setSelectedVideo(video);
                  setIsPlaying(true);
                }}
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted">
                  <div className="flex h-full w-full items-center justify-center gradient-teal">
                    <CategoryIcon className="h-12 w-12 text-white/80" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                      <Play className="h-6 w-6 text-secondary ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1">
                    <span className="flex items-center gap-1 text-xs text-white">
                      <Clock className="h-3 w-3" />
                      {video.duration}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <Badge variant="outline" className="text-xs capitalize">
                    {video.category}
                  </Badge>
                  <h3 className="mt-2 font-semibold text-foreground line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium text-muted-foreground">
              No videos found
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video Player Dialog */}
      <Dialog
        open={isPlaying}
        onOpenChange={(open) => !open && setIsPlaying(false)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {selectedVideo?.videoUrl ? (
              <iframe
                src={selectedVideo.videoUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                <div className="text-center">
                  <BookOpen className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-4 text-lg">{selectedVideo?.title}</p>
                  <p className="mt-1 text-sm opacity-70">
                    {selectedVideo?.description}
                  </p>
                  <p className="mt-2 text-xs opacity-50">
                    Duration: {selectedVideo?.duration}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
