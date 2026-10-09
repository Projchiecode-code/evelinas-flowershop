import { Bouquet, UserPreferences } from '../types';
import { getCatalog } from '../data/catalog';

export interface RecommendationReason {
  type: 'occasion' | 'preference' | 'popular' | 'price' | 'trending';
  message: string;
}

export interface RecommendedBouquet extends Bouquet {
  score: number;
  reasons: RecommendationReason[];
}

/**
 * AI-Powered recommendation engine that analyzes user preferences,
 * browsing history, and popular trends to suggest personalized bouquets
 */
export class AIRecommendationEngine {
  /**
   * Get personalized recommendations based on user preferences
   */
  static getPersonalizedRecommendations(
    preferences?: UserPreferences,
    viewedBouquets: string[] = [],
    limit: number = 4
  ): RecommendedBouquet[] {
    const recommendations: RecommendedBouquet[] = [];

    for (const bouquet of getCatalog()) {
      let score = 0;
      const reasons: RecommendationReason[] = [];

      // Base popularity score (0-30 points)
      score += (bouquet.popularity / 100) * 30;
      if (bouquet.popularity > 90) {
        reasons.push({
          type: 'popular',
          message: 'Highly rated by our customers'
        });
      }

      // User preference matching
      if (preferences) {
        // Price range preference (0-20 points)
        const [minPrice, maxPrice] = preferences.priceRange;
        if (bouquet.price >= minPrice && bouquet.price <= maxPrice) {
          score += 20;
          reasons.push({
            type: 'price',
            message: 'Matches your budget preference'
          });
        }

        // Occasion matching (0-25 points)
        const occasionMatch = preferences.occasions.some(occ =>
          bouquet.occasion.includes(occ)
        );
        if (occasionMatch) {
          score += 25;
          reasons.push({
            type: 'occasion',
            message: `Perfect for ${preferences.occasions[0]}`
          });
        }

        // Flower type preference (0-25 points)
        const flowerMatch = preferences.preferredFlowers.some(flower =>
          bouquet.flowers.some(bf => bf.toLowerCase().includes(flower.toLowerCase()))
        );
        if (flowerMatch) {
          score += 25;
          reasons.push({
            type: 'preference',
            message: 'Contains your favorite flowers'
          });
        }
      }

      // Viewed bouquets similarity (collaborative filtering)
      if (viewedBouquets.includes(bouquet.id)) {
        score -= 10; // Reduce score for already viewed items
      } else if (viewedBouquets.length > 0) {
        const viewedCategories = getCatalog()
          .filter(b => viewedBouquets.includes(b.id))
          .map(b => b.category);
        
        if (viewedCategories.includes(bouquet.category)) {
          score += 15;
          reasons.push({
            type: 'preference',
            message: 'Similar to items you viewed'
          });
        }
      }

      // Trending score (seasonal/time-based)
      if (this.isTrending(bouquet)) {
        score += 10;
        reasons.push({
          type: 'trending',
          message: 'Trending this week'
        });
      }

      recommendations.push({
        ...bouquet,
        score,
        reasons
      });
    }

    // Sort by score and return top N
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get recommendations for a specific occasion
   */
  static getOccasionRecommendations(occasion: string, limit: number = 4): RecommendedBouquet[] {
    return getCatalog()
      .filter(b => b.occasion.includes(occasion))
      .map(bouquet => ({
        ...bouquet,
        score: bouquet.popularity,
        reasons: [
          {
            type: 'occasion',
            message: `Perfect for ${occasion}`
          },
          ...(bouquet.popularity > 90 ? [{
            type: 'popular' as const,
            message: 'Customer favorite'
          }] : [])
        ]
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get "Customers also bought" recommendations
   */
  static getSimilarBouquets(bouquetId: string, limit: number = 4): RecommendedBouquet[] {
    const bouquet = getCatalog().find(b => b.id === bouquetId);
    if (!bouquet) return [];

    return getCatalog()
      .filter(b => b.id !== bouquetId)
      .map(b => {
        let score = 0;
        const reasons: RecommendationReason[] = [];

        // Same category
        if (b.category === bouquet.category) {
          score += 30;
          reasons.push({
            type: 'preference',
            message: `Similar style to ${bouquet.name}`
          });
        }

        // Similar occasion
        const sharedOccasions = b.occasion.filter(o => bouquet.occasion.includes(o));
        if (sharedOccasions.length > 0) {
          score += sharedOccasions.length * 15;
          reasons.push({
            type: 'occasion',
            message: 'Suitable for same occasions'
          });
        }

        // Similar price range
        const priceDiff = Math.abs(b.price - bouquet.price);
        if (priceDiff < 20) {
          score += 20;
          reasons.push({
            type: 'price',
            message: 'Similar price range'
          });
        }

        // Popularity bonus
        score += (b.popularity / 100) * 20;

        return {
          ...b,
          score,
          reasons
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Determine if a bouquet is trending (mock implementation)
   */
  private static isTrending(bouquet: Bouquet): boolean {
    const currentMonth = new Date().getMonth();
    
    // Seasonal trending logic
    if (currentMonth >= 2 && currentMonth <= 4 && bouquet.category === 'Tulips') {
      return true; // Spring flowers
    }
    if (currentMonth === 1 && bouquet.category === 'Roses') {
      return true; // Valentine's Day
    }
    if (currentMonth === 4 && bouquet.occasion.includes("Mother's Day")) {
      return true; // Mother's Day
    }
    
    return bouquet.popularity > 92;
  }

  /**
   * Get smart search recommendations
   */
  static getSearchRecommendations(query: string): Bouquet[] {
    const lowerQuery = query.toLowerCase();
    
    return getCatalog().filter(bouquet => {
      return (
        bouquet.name.toLowerCase().includes(lowerQuery) ||
        bouquet.category.toLowerCase().includes(lowerQuery) ||
        bouquet.occasion.some(o => o.toLowerCase().includes(lowerQuery)) ||
        bouquet.flowers.some(f => f.toLowerCase().includes(lowerQuery)) ||
        bouquet.description.toLowerCase().includes(lowerQuery)
      );
    });
  }
}
