import { Link } from 'react-router';
import { Sparkles, Truck, Shield, Star, ArrowRight, Flower2, Camera, Quote, Leaf, Palette, BadgeCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BouquetCard } from '../components/BouquetCard';
import { useProducts } from '../contexts/ProductsContext';
import { useGallery } from '../contexts/GalleryContext';
import { useReviews } from '../contexts/ReviewsContext';

// Category tiles use real flower photos (public/categories/*.jpg — sourced
// from Unsplash) instead of emoji icons. Swap any file to restyle a tile.
const CATEGORIES = [
  { name: 'Roses', photo: '/categories/roses.jpg', link: '/catalog?category=Roses' },
  { name: 'Tulips', photo: '/categories/tulips.jpg', link: '/catalog?category=Tulips' },
  { name: 'Sunflowers', photo: '/categories/sunflowers.jpg', link: '/catalog?category=Sunflowers' },
  { name: 'Orchids', photo: '/categories/orchids.jpg', link: '/catalog?category=Orchids' },
  { name: 'Mixed', photo: '/categories/mixed.jpg', link: '/catalog?category=Mixed' },
  { name: 'Lilies', photo: '/categories/lilies.jpg', link: '/catalog?category=Lilies' },
];

const OCCASIONS = [
  { label: 'Birthday', emoji: '🎂', link: '/catalog?occasion=Birthday' },
  { label: 'Anniversary', emoji: '💍', link: '/catalog?occasion=Anniversary' },
  { label: 'Romance', emoji: '❤️', link: '/catalog?occasion=Romance' },
  { label: 'Wedding', emoji: '💒', link: '/catalog?occasion=Wedding' },
  { label: "Mother's Day", emoji: '👩', link: "/catalog?occasion=Mother's Day" },
  { label: 'Thank You', emoji: '🙏', link: '/catalog?occasion=Thank You' },
];

export function Home() {
  const { bouquets } = useProducts();
  const trending = bouquets.filter(b => b.popularity >= 92).slice(0, 4);
  const { getFeaturedPhotos } = useGallery();
  const { getApprovedReviews } = useReviews();
  const galleryPhotos = getFeaturedPhotos().slice(0, 6);
  const featuredReviews = getApprovedReviews().filter(r => r.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white">
        {/* Soft light blooms instead of emoji decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-10 -right-32 w-[28rem] h-[28rem] rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-purple-300/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/20">
            <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Floristry
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Fresh Flowers,<br />
            <span className="text-yellow-300">Delivered with Love</span>
          </h1>
          <p className="text-xl mb-10 text-rose-100 max-w-2xl mx-auto">
            Discover the perfect bouquet for every moment. Personalized recommendations powered by AI.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/catalog">
              <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 font-semibold">
                Shop Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/recommendations">
              <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-black font-semibold transition-all">
                <Sparkles className="w-4 h-4 mr-2" /> Get AI Picks
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-rose-100">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Same-day delivery</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> 100% freshness guarantee</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4" /> 4.9★ rated by 10,000+ customers</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-rose-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Shop by Category</h2>
            <p className="text-gray-500">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} to={cat.link} className="group">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-white ring-1 ring-pink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <img
                    src={cat.photo}
                    alt={`${cat.name} bouquet`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <span className="mx-auto block w-fit bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-gray-800 shadow-sm group-hover:text-rose-600 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">Trending Now</h2>
              <p className="text-gray-500">Most loved by our customers this week</p>
            </div>
            <Link to="/catalog">
              <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map(b => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Shop by Occasion</h2>
            <p className="text-gray-500">Perfect blooms for every special moment</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {OCCASIONS.map(occ => (
              <Link key={occ.label} to={occ.link}>
                <div className="bg-white border border-pink-100 rounded-2xl p-5 text-center hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-3xl mb-2">{occ.emoji}</div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">{occ.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      {galleryPhotos.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-1">Customer Gallery</h2>
                <p className="text-gray-500">Real photos from our happy customers</p>
              </div>
              <Link to="/gallery">
                <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                  <Camera className="w-4 h-4 mr-2" /> View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {galleryPhotos.map(photo => (
                <Link key={photo.id} to="/gallery">
                  <div className="rounded-2xl overflow-hidden aspect-square group">
                    <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {featuredReviews.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-rose-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">What Our Customers Say</h2>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(n => <Star key={n} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-500">4.9 stars from over 10,000 happy customers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredReviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <Quote className="w-8 h-8 text-rose-200 mb-3" />
                  <p className="text-gray-700 mb-4 leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {review.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{review.customerName}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Banner */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-rose-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-3xl font-bold mb-4">Not sure what to pick?</h2>
          <p className="text-lg text-purple-100 mb-8 max-w-xl mx-auto">
            Our AI recommendation engine asks a few questions and finds the perfect bouquet tailored just for you.
          </p>
          <Link to="/recommendations">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 font-semibold">
              <Sparkles className="w-4 h-4 mr-2" /> Get My Recommendations
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Why Evelina's Flowershop?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Leaf, title: 'Farm Fresh', desc: 'Sourced directly from local farms for maximum freshness' },
              { icon: Palette, title: 'Expert Design', desc: 'Crafted by experienced florists with an eye for beauty' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery available for orders placed before 2 PM' },
              { icon: BadgeCheck, title: 'Satisfaction Guaranteed', desc: "Not happy? We'll replace or refund, no questions asked" },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-2xl bg-rose-50 hover:bg-rose-100 transition-colors">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-rose-600 text-white text-center">
        <div className="container mx-auto px-4">
          <Flower2 className="w-10 h-10 mx-auto mb-3 text-rose-200" />
          <h3 className="text-2xl font-bold mb-2">Ready to make someone's day?</h3>
          <p className="text-rose-200 mb-6">Browse our full collection of handcrafted bouquets</p>
          <Link to="/catalog">
            <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 font-semibold">
              Browse Collection
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
