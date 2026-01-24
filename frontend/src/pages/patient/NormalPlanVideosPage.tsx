import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Plus, 
  Trash2, 
  Edit2, 
  Upload,
  BookOpen,
  Layers,
  Loader2,
  Save,
  X,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ZoneVideo, HorizonGuideVideo, ZONE_DEFINITIONS, HORIZON_GUIDE_CATEGORIES } from '@/lib/normalPlanTypes';

interface VideoFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  isRequired: boolean;
  zoneNumber?: number;
  category?: string;
}

const initialFormData: VideoFormData = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  duration: '',
  isRequired: true,
};

export const NormalPlanVideosPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('zone-videos');
  const [selectedZone, setSelectedZone] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('calories');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data
  const [zoneVideos, setZoneVideos] = useState<ZoneVideo[]>([
    {
      id: 'zv-1',
      title: 'Foundation Zone Introduction',
      description: 'Welcome to Zone 1 - Building your foundation for health',
      videoUrl: 'https://example.com/video1',
      duration: '10:30',
      isWatched: false,
      isRequired: true,
      zoneNumber: 1,
      order: 1,
    },
    {
      id: 'zv-2',
      title: 'Foundation Zone Guidelines',
      description: 'Step-by-step guide for Zone 1 tasks and expectations',
      videoUrl: 'https://example.com/video2',
      duration: '15:45',
      isWatched: false,
      isRequired: true,
      zoneNumber: 1,
      order: 2,
    },
  ]);

  const [guideVideos, setGuideVideos] = useState<HorizonGuideVideo[]>([
    {
      id: 'hg-1',
      category: 'calories',
      title: 'Understanding Calorie Basics',
      description: 'Learn how calories work and why they matter',
      videoUrl: 'https://example.com/guide1',
      duration: '12:20',
      order: 1,
    },
  ]);

  const handleOpenModal = (isEdit: boolean = false, video?: ZoneVideo | HorizonGuideVideo) => {
    setIsEditing(isEdit);
    if (isEdit && video) {
      setEditingVideoId(video._id);
      setFormData({
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || '',
        duration: video.duration,
        isRequired: 'isRequired' in video ? video.isRequired : true,
        zoneNumber: 'zoneNumber' in video ? video.zoneNumber : undefined,
        category: 'category' in video ? video.category : undefined,
      });
    } else {
      setEditingVideoId(null);
      setFormData({
        ...initialFormData,
        zoneNumber: activeTab === 'zone-videos' ? parseInt(selectedZone) : undefined,
        category: activeTab === 'horizon-guide' ? selectedCategory : undefined,
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
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (activeTab === 'zone-videos') {
      const newVideo: ZoneVideo = {
        id: isEditing ? editingVideoId! : `zv-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        duration: formData.duration,
        isWatched: false,
        isRequired: formData.isRequired,
        zoneNumber: formData.zoneNumber || parseInt(selectedZone),
        order: isEditing 
          ? zoneVideos.find(v => v._id === editingVideoId)?.order || 1 
          : zoneVideos.filter(v => v.zoneNumber === parseInt(selectedZone)).length + 1,
      };

      if (isEditing) {
        setZoneVideos(prev => prev.map(v => v._id === editingVideoId ? newVideo : v));
      } else {
        setZoneVideos(prev => [...prev, newVideo]);
      }
    } else {
      const newVideo: HorizonGuideVideo = {
        id: isEditing ? editingVideoId! : `hg-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        duration: formData.duration,
        category: (formData.category || selectedCategory) as HorizonGuideVideo['category'],
        order: isEditing 
          ? guideVideos.find(v => v._id === editingVideoId)?.order || 1 
          : guideVideos.filter(v => v.category === selectedCategory).length + 1,
      };

      if (isEditing) {
        setGuideVideos(prev => prev.map(v => v._id === editingVideoId ? newVideo : v));
      } else {
        setGuideVideos(prev => [...prev, newVideo]);
      }
    }

    setIsSubmitting(false);
    handleCloseModal();
    
    toast({
      title: isEditing ? 'Video Updated' : 'Video Added',
      description: `The video has been ${isEditing ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteVideo = (videoId: string, type: 'zone' | 'guide') => {
    if (type === 'zone') {
      setZoneVideos(prev => prev.filter(v => v._id !== videoId));
    } else {
      setGuideVideos(prev => prev.filter(v => v._id !== videoId));
    }
    
    toast({
      title: 'Video Deleted',
      description: 'The video has been removed.',
    });
  };

  const filteredZoneVideos = zoneVideos.filter(v => v.zoneNumber === parseInt(selectedZone));
  const filteredGuideVideos = guideVideos.filter(v => v.category === selectedCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Normal Plan Videos</h1>
          <p className="mt-1 text-muted-foreground">
            Manage educational videos for zones and the Horizon Guide
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

        {/* Zone Videos Tab */}
        <TabsContent value="zone-videos" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">Zone Educational Videos</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONE_DEFINITIONS.map((zone) => (
                        <SelectItem key={zone.zoneNumber} value={zone.zoneNumber.toString()}>
                          Zone {zone.zoneNumber}: {zone.zoneName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleOpenModal()} className="gap-2 gradient-phoenix text-primary-foreground">
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
                  <p className="text-sm text-muted-foreground">
                    Add videos that patients must watch before entering this zone
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
                          <p className="font-medium text-foreground truncate">{video.title}</p>
                          {video.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Duration: {video.duration}</p>
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
                          onClick={() => handleDeleteVideo(video._id, 'zone')}
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

        {/* Horizon Guide Tab */}
        <TabsContent value="horizon-guide" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">Horizon Guide Library</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  <Button onClick={() => handleOpenModal()} className="gap-2 gradient-teal text-secondary-foreground">
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
                    No videos in {HORIZON_GUIDE_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add educational content for patient self-learning
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
                        <p className="font-medium text-foreground truncate">{video.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Duration: {video.duration}</p>
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
                          onClick={() => handleDeleteVideo(video._id, 'guide')}
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
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Video' : 'Add New Video'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                placeholder="Enter video title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the video content"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/embed/..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 12:30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  placeholder="Optional thumbnail"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                />
              </div>
            </div>

            {activeTab === 'zone-videos' && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="isRequired">Required Video</Label>
                  <p className="text-sm text-muted-foreground">
                    Patients must watch before entering zone
                  </p>
                </div>
                <Switch
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Video' : 'Add Video'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
