import { motion } from 'framer-motion';
import { Lock, CheckCircle, Play, ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ZoneData, ZONE_DEFINITIONS } from '@/lib/normalPlanTypes';
import { cn } from '@/lib/utils';

interface ZoneNavigatorProps {
  zones: ZoneData[];
  activeZone: number;
  onZoneSelect: (zoneNumber: number) => void;
}

export const ZoneNavigator: React.FC<ZoneNavigatorProps> = ({
  zones,
  activeZone,
  onZoneSelect,
}) => {
  const getZoneStatus = (zone: ZoneData) => {
    if (zone.isCompleted) return 'completed';
    if (zone.isUnlocked) return 'active';
    return 'locked';
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Your Journey</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {zones.map((zone, index) => {
            const status = getZoneStatus(zone);
            const definition = ZONE_DEFINITIONS.find(d => d.zoneNumber === zone.zoneNumber);
            const isActive = activeZone === zone.zoneNumber;
            
            return (
              <motion.button
                key={zone.zoneNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => zone.isUnlocked && onZoneSelect(zone.zoneNumber)}
                disabled={!zone.isUnlocked}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 min-w-[120px]',
                  status === 'completed' && 'border-green-300 bg-green-50/50',
                  status === 'active' && isActive && 'border-secondary bg-secondary/10 shadow-teal',
                  status === 'active' && !isActive && 'border-border bg-card hover:border-secondary/50 hover:shadow-sm',
                  status === 'locked' && 'cursor-not-allowed border-border/50 bg-muted/50 opacity-60'
                )}
              >
                {/* Zone Number Circle */}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-all',
                    status === 'completed' && 'bg-green-500',
                    status === 'active' && isActive && 'gradient-phoenix shadow-phoenix',
                    status === 'active' && !isActive && 'bg-secondary/20',
                    status === 'locked' && 'bg-muted'
                  )}
                >
                  {status === 'locked' ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : isActive ? (
                    <Play className="h-5 w-5 text-white" />
                  ) : (
                    <span className="font-bold text-secondary">{zone.zoneNumber}</span>
                  )}
                </div>

                {/* Zone Name */}
                <div className="text-center">
                  <span className={cn(
                    'text-sm font-medium block',
                    status === 'locked' ? 'text-muted-foreground' : 'text-foreground'
                  )}>
                    {zone.zoneName}
                  </span>
                  {!zone.videosCompleted && zone.isUnlocked && !zone.isCompleted && (
                    <span className="text-xs text-yellow-600">Videos required</span>
                  )}
                </div>

                {/* Progress Indicator */}
                {zone.isUnlocked && !zone.isCompleted && (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-3/4 -translate-x-1/2 overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full gradient-teal"
                      style={{ 
                        width: `${zone.videosCompleted ? 100 : 50}%` 
                      }}
                    />
                  </div>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeZoneIndicator"
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full gradient-phoenix shadow-phoenix"
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
};
