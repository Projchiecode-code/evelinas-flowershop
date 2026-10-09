import { useState } from 'react';
import { Sparkles, Heart, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { BouquetCard } from '../components/BouquetCard';
import { AIRecommendationEngine } from '../utils/aiRecommendations';
import { useProducts } from '../contexts/ProductsContext';
import { UserPreferences } from '../types';
import { Badge } from '../components/ui/badge';

export function Recommendations() {
  // Subscribes to the live catalog so the lists below re-render when it loads.
  useProducts();
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteColors: [],
    occasions: [],
    priceRange: [50, 120],
    preferredFlowers: []
  });

  const [showResults, setShowResults] = useState(false);

  const colors = ['Red', 'Pink', 'White', 'Yellow', 'Purple', 'Orange', 'Mixed'];
  const occasions = ['Birthday', 'Anniversary', 'Romance', 'Wedding', 'Sympathy', 'Congratulations', 'Thank You'];
  const flowers = ['Roses', 'Lilies', 'Tulips', 'Sunflowers', 'Orchids', 'Peonies', 'Carnations'];

  const togglePreference = (category: keyof Pick<UserPreferences, 'favoriteColors' | 'occasions' | 'preferredFlowers'>, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const recommendations = showResults
    ? AIRecommendationEngine.getPersonalizedRecommendations(preferences, [], 8)
    : [];

  const occasionRecommendations = occasions.map(occasion => ({
    occasion,
    bouquets: AIRecommendationEngine.getOccasionRecommendations(occasion, 2)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">AI-Powered Recommendations</h1>
          <p className="text-xl text-gray-600">
            Tell us your preferences and let our AI find the perfect bouquet for you
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Preferences Form */}
            <div className="max-w-4xl mx-auto">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    Your Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Favorite Colors */}
                  <div>
                    <Label className="text-lg mb-4 block">Favorite Colors</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {colors.map(color => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={preferences.favoriteColors.includes(color)}
                            onCheckedChange={() => togglePreference('favoriteColors', color)}
                          />
                          <Label htmlFor={`color-${color}`} className="cursor-pointer">
                            {color}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Occasions */}
                  <div>
                    <Label className="text-lg mb-4 block flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Occasions
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {occasions.map(occasion => (
                        <div key={occasion} className="flex items-center space-x-2">
                          <Checkbox
                            id={`occasion-${occasion}`}
                            checked={preferences.occasions.includes(occasion)}
                            onCheckedChange={() => togglePreference('occasions', occasion)}
                          />
                          <Label htmlFor={`occasion-${occasion}`} className="cursor-pointer">
                            {occasion}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Flowers */}
                  <div>
                    <Label className="text-lg mb-4 block">Preferred Flowers</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {flowers.map(flower => (
                        <div key={flower} className="flex items-center space-x-2">
                          <Checkbox
                            id={`flower-${flower}`}
                            checked={preferences.preferredFlowers.includes(flower)}
                            onCheckedChange={() => togglePreference('preferredFlowers', flower)}
                          />
                          <Label htmlFor={`flower-${flower}`} className="cursor-pointer">
                            {flower}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-lg mb-4 block flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Budget: ${preferences.priceRange[0]} - ${preferences.priceRange[1]}
                    </Label>
                    <Slider
                      min={0}
                      max={200}
                      step={10}
                      value={preferences.priceRange}
                      onValueChange={(value) =>
                        setPreferences(prev => ({
                          ...prev,
                          priceRange: value as [number, number]
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setShowResults(true)}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get My Personalized Recommendations
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Browse by Occasion */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Or Browse by Occasion</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {occasions.slice(0, 8).map(occasion => (
                    <Button
                      key={occasion}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => {
                        setPreferences(prev => ({
                          ...prev,
                          occasions: [occasion]
                        }));
                        setShowResults(true);
                      }}
                    >
                      <Calendar className="w-6 h-6" />
                      {occasion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Recommendations Results */}
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Your Personalized Picks</h2>
                  <p className="text-gray-600">
                    Based on your preferences, our AI recommends these bouquets
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowResults(false)}>
                  Adjust Preferences
                </Button>
              </div>

              {/* Active Filters */}
              <div className="mb-6 flex flex-wrap gap-2">
                {preferences.occasions.map(occ => (
                  <Badge key={occ} variant="secondary">{occ}</Badge>
                ))}
                {preferences.favoriteColors.map(color => (
                  <Badge key={color} variant="secondary">{color}</Badge>
                ))}
                {preferences.preferredFlowers.map(flower => (
                  <Badge key={flower} variant="secondary">{flower}</Badge>
                ))}
                <Badge variant="outline">
                  ${preferences.priceRange[0]} - ${preferences.priceRange[1]}
                </Badge>
              </div>

              {recommendations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your preferences to see more recommendations
                    </p>
                    <Button onClick={() => setShowResults(false)}>
                      Adjust Preferences
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {recommendations.map(bouquet => (
                    <BouquetCard
                      key={bouquet.id}
                      bouquet={bouquet}
                      showRecommendation
                      recommendationText={bouquet.reasons
                        .slice(0, 2)
                        .map(r => r.message)
                        .join(' • ')}
                    />
                  ))}
                </div>
              )}

              {/* Browse by Occasion */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold mb-8">Popular Choices by Occasion</h2>
                {occasionRecommendations.slice(0, 4).map(({ occasion, bouquets }) => (
                  bouquets.length > 0 && (
                    <div key={occasion} className="mb-12">
                      <h3 className="text-2xl font-semibold mb-4">{occasion}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bouquets.map(bouquet => (
                          <BouquetCard
                            key={bouquet.id}
                            bouquet={bouquet}
                            showRecommendation
                            recommendationText={bouquet.reasons[0]?.message}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
