import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Layers,
  Loader2,
  Save,
  GripVertical,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ZoneVideo,
  HorizonGuideVideo,
  ZONE_DEFINITIONS,
  HORIZON_GUIDE_CATEGORIES,
} from "@/lib/normalPlanTypes";
import { normalPlanDoctorApi } from "@/lib/normalPlanApi";

interface VideoFormData {
  type: "video" | "pdf"; // Add this
  title: string;
  description: string;
  videoUrl: string; // This will store the PDF link if type is pdf
  thumbnailUrl: string;
  duration: string;
  isRequired: boolean;
  zoneNumber?: number;
  category?: string;
}

const initialFormData: VideoFormData = {
  type: "video",
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: "",
  isRequired: true,
};

export const NormalPlanVideosPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("zone-videos");
  const [selectedZone, setSelectedZone] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("calories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [zoneVideos, setZoneVideos] = useState<ZoneVideo[]>([]);
  const [guideVideos, setGuideVideos] = useState<HorizonGuideVideo[]>([]);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const [zoneRes, guideRes] = await Promise.all([
        normalPlanDoctorApi.getZoneVideos(selectedZone),
        normalPlanDoctorApi.getHorizonGuideVideos(selectedCategory),
      ]);
      setZoneVideos(zoneRes.data);
      setGuideVideos(guideRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedCategory, toast]);

  useEffect(() => {
    fetchVideos();
  }, [activeTab, selectedZone, selectedCategory, fetchVideos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const handleOpenModal = (
    isEdit: boolean = false,
    video?: ZoneVideo | HorizonGuideVideo
  ) => {
    setIsEditing(isEdit);
    if (isEdit && video) {
      setEditingVideoId(video._id);
      setFormData({
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || "",
        duration: video.duration,
        isRequired: "isRequired" in video ? video.isRequired : true,
        zoneNumber: "zoneNumber" in video ? video.zoneNumber : undefined,
        category: "category" in video ? video.category : undefined,
      });
    } else {
      setEditingVideoId(null);
      setFormData({
        ...initialFormData,
        zoneNumber:
          activeTab === "zone-videos" ? parseInt(selectedZone) : undefined,
        category: activeTab === "horizon-guide" ? selectedCategory : undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingVideoId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.videoUrl || !formData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "zone-videos") {
        const videoData = {
          title: formData.title,
          description: formData.description,
          isActive: true,
          // Map the single URL field to the correct backend key
          videoUrl: formData.type === "video" ? formData.videoUrl : undefined,
          pdfUrl: formData.type === "pdf" ? formData.videoUrl : undefined,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          duration: formData.type === "video" ? formData.duration : "N/A",
          isRequired: formData.isRequired,
          type: formData.type, // Send type to backend
          zoneNumber: formData.zoneNumber || parseInt(selectedZone),
        };

        if (isEditing && editingVideoId) {
          await normalPlanDoctorApi.updateZoneVideo(editingVideoId, videoData);
        } else {
          await normalPlanDoctorApi.createZoneVideo(videoData);
        }
      } else {
        const videoData = {
          title: formData.title,
          description: formData.description,
          isActive: true,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          duration: formData.duration,
          category: (formData.category ||
            selectedCategory) as HorizonGuideVideo["category"],
          order:
            guideVideos.filter((v) => v.category === selectedCategory).length +
            1,
        };

        if (isEditing && editingVideoId) {
          await normalPlanDoctorApi.updateHorizonGuideVideo(
            editingVideoId,
            videoData
          );
        } else {
          await normalPlanDoctorApi.createHorizonGuideVideo(videoData);
        }
      }

      handleCloseModal();
      await fetchVideos();

      toast({
        title: isEditing ? "Video Updated" : "Video Added",
        description: `The video has been ${
          isEditing ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save video.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, type: "zone" | "guide") => {
    try {
      if (type === "zone") {
        await normalPlanDoctorApi.deleteZoneVideo(videoId);
      } else {
        await normalPlanDoctorApi.deleteHorizonGuideVideo(videoId);
      }
      await fetchVideos();
      toast({
        title: "Video Deleted",
        description: "The video has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const filteredZoneVideos = zoneVideos.filter(
    (v) => v.zoneNumber === parseInt(selectedZone)
  );
  const filteredGuideVideos = guideVideos.filter(
    (v) => v.category === selectedCategory
  );

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Normal Plan Videos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage educational videos for zones and the Horizon Guide
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="zone-videos" className="gap-2">
            <Layers className="h-4 w-4" />
            Zone Videos
          </TabsTrigger>
          <TabsTrigger value="horizon-guide" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Horizon Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zone-videos" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">
                  Zone Educational Videos
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONE_DEFINITIONS.map((zone) => (
                        <SelectItem
                          key={zone.zoneNumber}
                          value={zone.zoneNumber.toString()}
                        >
                          Zone {zone.zoneNumber}: {zone.zoneName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleOpenModal()}
                    className="gap-2 gradient-phoenix text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Video
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredZoneVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-medium text-muted-foreground">
                    No videos for Zone {selectedZone} yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredZoneVideos.map((video, index) => (
                    <motion.div
                      key={video._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/30"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <div className="flex h-full w-full items-center justify-center gradient-teal">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {video.title}
                          </p>
                          {video.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {video.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(true, video)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteVideo(video._id, "zone")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horizon-guide" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">Horizon Guide Library</CardTitle>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HORIZON_GUIDE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleOpenModal()}
                    className="gap-2 gradient-teal text-secondary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Video
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredGuideVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-medium text-muted-foreground">
                    No videos in this category
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGuideVideos.map((video, index) => (
                    <motion.div
                      key={video._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/30"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <div className="flex h-full w-full items-center justify-center bg-secondary/20">
                          <BookOpen className="h-6 w-6 text-secondary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {video.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {video.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(true, video)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteVideo(video._id, "guide")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Video Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Video" : "Add New Video"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <div className="flex gap-2 p-1 bg-muted rounded-md">
                <Button
                  type="button"
                  variant={formData.type === "video" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: "video" })}
                >
                  <Video className="mr-2 h-4 w-4" /> Video
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "pdf" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: "pdf" })}
                >
                  <FileText className="mr-2 h-4 w-4" /> PDF Document
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title"> Title *</Label>
              <Input
                id="title"
                placeholder="Enter title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/..."
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {formData.type === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  placeholder="https://..."
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnailUrl: e.target.value })
                  }
                />
              </div>
            </div>

            {activeTab === "zone-videos" && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Required Video</Label>
                  <p className="text-xs text-muted-foreground">
                    Must watch before entering zone
                  </p>
                </div>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gradient-phoenix text-primary-foreground"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Update Video" : "Add Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
