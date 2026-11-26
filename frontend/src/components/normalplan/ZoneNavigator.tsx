import { motion } from 'framer-motion';
import { Lock, CheckCircle, Play } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ZoneData } from '@/lib/normalPlanTypes';
import { cn } from '@/lib/utils';

interface ZoneNavigatorProps {
  zones: ZoneData[];
  activeZone: number;
  currentZone: number;
  onZoneSelect: (zoneNumber: number) => void;
}

export const ZoneNavigator: React.FC<ZoneNavigatorProps> = ({
  zones,
  activeZone,
  currentZone,
  onZoneSelect,
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-muted-foreground">Your Journey</h3>
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 pb-2">
        {zones.map((zone, index) => {
          const isSelected = zone.zoneNumber === activeZone;
          const isCurrent = zone.zoneNumber === currentZone;
          const isCompleted = zone.zoneNumber < currentZone;
          const isLocked = zone.zoneNumber > currentZone;

          return (
            <motion.button
              key={zone.zoneNumber}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (!isLocked) onZoneSelect(zone.zoneNumber);
              }}
              disabled={isLocked}
              aria-pressed={isSelected}
              className={cn(
                'relative flex min-w-[120px] cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
                isCompleted && !isSelected && 'border-green-300 bg-green-50/50 opacity-70 hover:opacity-100',
                isSelected && 'border-secondary bg-secondary/10 shadow-teal',
                isCurrent && !isSelected && 'border-secondary/40 bg-card hover:border-secondary/60 hover:shadow-sm',
                isLocked && 'cursor-not-allowed border-dashed opacity-50 grayscale',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full transition-all',
                  isCompleted && !isSelected && 'bg-green-500',
                  isSelected && 'gradient-phoenix shadow-phoenix',
                  isCurrent && !isSelected && 'bg-secondary/20',
                  isLocked && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted && !isSelected ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5" />
                ) : isSelected ? (
                  <Play className="h-5 w-5 text-white" />
                ) : (
                  <span className="font-bold text-secondary">{zone.zoneNumber}</span>
                )}
              </div>

              <div className="text-center">
                <span className="block text-sm font-medium text-foreground">
                  {zone.zoneName}
                </span>
                {!zone.videosCompleted && zone.isUnlocked && !zone.isCompleted && (
                  <span className="text-xs text-yellow-600">Videos required</span>
                )}
              </div>

              {zone.isUnlocked && !zone.isCompleted && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-3/4 -translate-x-1/2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full gradient-teal"
                    style={{ width: `${zone.videosCompleted ? 100 : 50}%` }}
                  />
                </div>
              )}

              {isSelected && (
                <motion.div
                  layoutId="activeZoneIndicator"
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full gradient-phoenix shadow-phoenix"
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
);
