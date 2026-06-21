import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle,
  Lock,
  Clock,
  ChevronRight,
  Video,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ZoneVideo } from '@/lib/normalPlanTypes';
import { getLocalZoneVideoUrl, START_HERE_VIDEOS, ZONE_VIDEOS_MAP } from '@/lib/videoAssets';

interface ZoneVideoPlayerProps {
  videos: ZoneVideo[];
  zoneName: string;
  isZoneLocked: boolean;
  onVideoComplete: (videoId: string) => void;
}

export const ZoneVideoPlayer: React.FC<ZoneVideoPlayerProps> = ({
  videos,
  zoneName,
  isZoneLocked,
  onVideoComplete,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<ZoneVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const augmentedVideos = useMemo(() => {
    let result = [...videos];
    let manualZoneNumber = 1;
    if (zoneName.includes('2')) manualZoneNumber = 2;
    else if (zoneName.includes('3')) manualZoneNumber = 3;
    else if (zoneName.includes('4')) manualZoneNumber = 4;
    else if (zoneName.includes('5')) manualZoneNumber = 5;

    const assumedZoneNumber = (videos.length > 0 ? videos[0].zoneNumber : manualZoneNumber);

    const exactLocalVideos = ZONE_VIDEOS_MAP[assumedZoneNumber] || [];
    exactLocalVideos.forEach((lv, idx) => {
      const matchStr = lv.replace('.mp4', '').toLowerCase().replace(/^[0-9.]+\s*/, '');
      const isMatched = result.some(v => v.videoUrl === `/horizonFitVideos/Zone- ${assumedZoneNumber}/${lv}` || (v.title && v.title.toLowerCase().includes(matchStr)));
      if (!isMatched) {
        result.push({
          _id: `local-${assumedZoneNumber}-${idx}`,
          id: `local-${assumedZoneNumber}-${idx}`,
          title: lv.replace('.mp4', '').replace(/^[0-9.]+\s*/, ''),
          description: '',
          videoUrl: `/horizonFitVideos/Zone- ${assumedZoneNumber}/${lv}`,
          duration: 'N/A',
          isWatched: false,
          isRequired: true,
          zoneNumber: assumedZoneNumber,
          order: idx + 10
        } as ZoneVideo);
      }
    });

    if (zoneName === 'Foundation' || zoneName.includes('1') || assumedZoneNumber === 1) {
      const existingUrls = result.map(v => v.videoUrl || '');
      const startHere = START_HERE_VIDEOS.map((sh, idx) => {
        const url = `/horizonFitVideos/Start Here/${sh}`;
        return {
          _id: `start-here-${idx}`,
          id: `start-here-${idx}`,
          title: sh.replace('.mp4', '').replace(/^[0-9.]+\s*/, ''),
          description: '',
          videoUrl: url,
          duration: 'N/A',
          isWatched: videos.some(v => v.videoUrl === url && v.isWatched),
          isRequired: true,
          zoneNumber: 1,
          order: -1
        } as ZoneVideo;
      });
      const toAdd = startHere.filter(sh => !existingUrls.includes(sh.videoUrl));
      result = [...toAdd, ...result];
    }

    return result.map(v => {
      // Find the best local match or keep existing
      const localUrl = getLocalZoneVideoUrl(v.zoneNumber, v.title);
      return { ...v, videoUrl: localUrl || v.videoUrl };
    }).sort((a, b) => a.order - b.order);
  }, [videos, zoneName]);

  const completedCount = augmentedVideos.filter(v => v.isWatched).length;
  const requiredCount = augmentedVideos.filter(v => v.isRequired).length;
  const requiredCompleted = augmentedVideos.filter(v => v.isRequired && v.isWatched).length;
  const allRequiredComplete = requiredCount > 0 ? requiredCompleted === requiredCount : true;
  const progress = augmentedVideos.length > 0 ? (completedCount / augmentedVideos.length) * 100 : 0;

  const handlePlayVideo = (video: ZoneVideo) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const handleVideoEnd = () => {
    if (selectedVideo && !selectedVideo.isWatched) {
      onVideoComplete(selectedVideo._id);
    }
    setIsPlaying(false);
    setSelectedVideo(null);
  };

  return (
    <>
      <Card className="card-elevated overflow-hidden">
        <CardHeader className={isZoneLocked ? 'bg-muted/50' : 'gradient-phoenix'}>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 text-lg ${isZoneLocked ? 'text-muted-foreground' : 'text-white'}`}>
              <Video className="h-5 w-5" />
              {zoneName} Videos
            </CardTitle>
            {isZoneLocked ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : allRequiredComplete ? (
              <Badge className="gap-1 bg-green-500">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-white bg-white/20">
                {requiredCompleted}/{requiredCount} Required
              </Badge>
            )}
          </div>
          {!isZoneLocked && (
            <Progress value={progress} className="mt-3 h-2 bg-white/20" />
          )}
        </CardHeader>
        <CardContent className="p-4">
          {isZoneLocked ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium text-muted-foreground">
                Complete previous zone to unlock these videos
              </p>
            </div>
          ) : augmentedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Video className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No videos available for this zone yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {augmentedVideos.map((video, index) => (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group flex items-center gap-4 rounded-lg border p-3 transition-all cursor-pointer ${video.isWatched
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    }`}
                  onClick={() => handlePlayVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center gradient-teal">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {video.title}
                      </p>
                      {video.isRequired && !video.isWatched && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {video.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {video.duration}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {video.isWatched ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={isPlaying} onOpenChange={(open) => !open && handleVideoEnd()}>
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
                  <Video className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-4 text-lg">Video will play here</p>
                  <p className="mt-1 text-sm opacity-70">
                    {selectedVideo?.description}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleVideoEnd}
                    className="mt-6"
                  >
                    Mark as Watched
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
