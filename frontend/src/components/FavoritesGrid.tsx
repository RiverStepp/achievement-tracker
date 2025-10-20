import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FavoritesGridProps {
  favoriteGames: string[];
  favoriteGenres: string[];
}

export const FavoritesGrid: React.FC<FavoritesGridProps> = ({ favoriteGames, favoriteGenres }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-white">
          <Heart className="h-5 w-5 text-brand" aria-hidden="true" />
          Favorites
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">Games</p>
          <div className="flex flex-wrap gap-2">
            {favoriteGames.map((game) => (
              <Badge key={game} className="bg-slate-950/70 text-blue-100">
                {game}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">Genres</p>
          <div className="flex flex-wrap gap-2">
            {favoriteGenres.map((genre) => (
              <Badge key={genre} variant="outline" className="border-brand/50 text-blue-100">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
