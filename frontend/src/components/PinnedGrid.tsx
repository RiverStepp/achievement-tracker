import React from 'react';
import { Pin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GamePin } from '@/types/user';

interface PinnedGridProps {
  pins: GamePin[];
  onEditPins: () => void;
}

export const PinnedGrid: React.FC<PinnedGridProps> = ({ pins, onEditPins }) => {
  const visiblePins = pins.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Pin className="h-5 w-5 text-brand" aria-hidden="true" />
            Pinned Highlights
          </CardTitle>
          {pins.length > 10 && (
            <p className="text-xs text-blue-200/70">Showing your top 10 pins. Manage them from edit mode.</p>
          )}
        </div>
        <Button variant="outline" className="border-brand/50 text-blue-100 hover:bg-brand/20" onClick={onEditPins}>
          Edit Pins
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePins.map((pin, index) => (
            <div
              key={`${pin.title}-${index}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-slate-950/30"
            >
              <div className="flex items-center gap-3">
                {pin.achievementIconUrl ? (
                  <img
                    src={pin.achievementIconUrl}
                    alt="Achievement icon"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Pin className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{pin.title}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-200/80">{pin.statLabel}</p>
                </div>
              </div>
              {pin.value && <p className="text-sm text-blue-100">{pin.value}</p>}
            </div>
          ))}
          {visiblePins.length === 0 && (
            <p className="col-span-full text-sm text-blue-200/70">No pins yet. Add some highlights in the editor.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
