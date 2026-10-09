import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Bouquet } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Link } from 'react-router';
import { useFavorites } from '../contexts/FavoritesContext';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/currency';

interface BouquetCardProps {
  bouquet: Bouquet;
  showRecommendation?: boolean;
  recommendationText?: string;
}

export function BouquetCard({ bouquet, showRecommendation, recommendationText }: BouquetCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(bouquet.id);

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(bouquet);
    toast.success(fav ? 'Removed from favorites' : `${bouquet.name} saved to favorites!`);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300 border-pink-100">
      <Link to={`/bouquet/${bouquet.id}`} className="block">
        <div className="relative overflow-hidden h-64">
          <img
            src={bouquet.image}
            alt={bouquet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!bouquet.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
            </div>
          )}
          {bouquet.popularity > 90 && bouquet.inStock && (
            <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900">
              <Star className="w-3 h-3 mr-1 fill-current" /> Popular
            </Badge>
          )}
          {showRecommendation && recommendationText && (
            <Badge className="absolute top-2 left-2 bg-purple-600">AI Pick</Badge>
          )}
        </div>
      </Link>

      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link to={`/bouquet/${bouquet.id}`}>
              <h3 className="font-semibold text-lg hover:text-rose-600 transition-colors truncate">{bouquet.name}</h3>
            </Link>
            <Badge variant="outline" className="mt-1 border-pink-200 text-purple-700">{bouquet.category}</Badge>
          </div>
          <button onClick={handleHeart} className="ml-2 shrink-0 text-gray-300 hover:scale-125 transition-transform">
            <Heart className={`w-5 h-5 transition-colors ${fav ? 'fill-rose-500 text-rose-500' : 'hover:text-rose-400'}`} />
          </button>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bouquet.description}</p>

        {showRecommendation && recommendationText && (
          <p className="text-xs text-purple-600 mb-2 italic">✨ {recommendationText}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {bouquet.occasion.slice(0, 2).map(occ => (
            <Badge key={occ} variant="secondary" className="text-xs bg-rose-100 text-rose-700 border-rose-200">{occ}</Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <p className="text-2xl font-bold text-rose-600">{formatCurrency(bouquet.price)}</p>
        <Link to={`/bouquet/${bouquet.id}`}>
          <Button disabled={!bouquet.inStock} className="bg-rose-500 hover:bg-rose-600 text-white">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {bouquet.inStock ? 'View Details' : 'Unavailable'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
