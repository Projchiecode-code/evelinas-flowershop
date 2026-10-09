import { Link } from 'react-router';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

export function Favorites() {
  const { favorites, removeFavorite } = useFavorites();
  const { addToCart } = useCart();

  const handleAddToCart = (bouquetId: string) => {
    const b = favorites.find(f => f.id === bouquetId);
    if (b) {
      addToCart(b, 1);
      toast.success(`${b.name} added to cart!`);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 text-rose-200 fill-rose-200" />
          <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-rose-100">
            {favorites.length > 0
              ? `${favorites.length} bouquet${favorites.length > 1 ? 's' : ''} saved`
              : 'Your saved bouquets will appear here'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {favorites.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="text-8xl mb-6">🌸</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No favorites yet</h2>
            <p className="text-gray-500 mb-8">
              Browse our catalog and tap the heart icon to save bouquets you love.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/catalog">
                <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Browse Catalog
                </Button>
              </Link>
              <Link to="/recommendations">
                <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">
                  <Sparkles className="w-4 h-4 mr-2" /> Get AI Picks
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-rose-600">{favorites.length}</span> saved item{favorites.length > 1 ? 's' : ''}
              </p>
              <Link to="/catalog">
                <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">
                  + Add More
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map(bouquet => (
                <div key={bouquet.id} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative overflow-hidden h-56">
                    <Link to={`/bouquet/${bouquet.id}`}>
                      <img
                        src={bouquet.image}
                        alt={bouquet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    {/* Remove favorite */}
                    <button
                      onClick={() => { removeFavorite(bouquet.id); toast.success('Removed from favorites'); }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors group/btn"
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500 group-hover/btn:text-red-600 group-hover/btn:fill-red-600 transition-colors" />
                    </button>
                    {bouquet.popularity > 90 && (
                      <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900">⭐ Popular</Badge>
                    )}
                    {!bouquet.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className="bg-gray-800 text-white">Out of Stock</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <Link to={`/bouquet/${bouquet.id}`}>
                      <h3 className="font-bold text-gray-800 hover:text-rose-600 transition-colors mb-1">{bouquet.name}</h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{bouquet.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">{bouquet.category}</Badge>
                      {bouquet.occasion.slice(0, 1).map(occ => (
                        <Badge key={occ} className="bg-rose-100 text-rose-700 border-rose-200 text-xs">{occ}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-rose-600">${bouquet.price.toFixed(2)}</p>
                      <Button
                        size="sm"
                        disabled={!bouquet.inStock}
                        onClick={() => handleAddToCart(bouquet.id)}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
