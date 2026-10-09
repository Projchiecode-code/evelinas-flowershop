import { Bouquet, UserPreferences, Review, Order } from '../types';
import { getCatalog } from '../data/catalog';

export interface RecommendationReason {
  type: 'occasion' | 'preference' | 'popular' | 'price' | 'trending';
  message: string;
}

export interface RecommendedBouquet extends Bouquet {
  score: number;
  reasons: RecommendationReason[];
}

/** Live average star rating for a bouquet, straight from approved reviews. */
export interface BouquetRating {
  avg: number;
  count: number;
}

/**
 * Real-world inputs that replace guessing from the static mock fields:
 * actual star ratings, actual page views, and the shopper's actual orders.
 */
export interface RecommendationSignals {
  /** bouquetId -> average star rating from approved reviews */
  ratings: Record<string, BouquetRating>;
  /** recently viewed bouquet ids, newest first */
  viewed: string[];
  /** ids the shopper has ordered (cancelled orders ignored) */
  purchased: string[];
  /** categories present in the shopper's order history */
  purchasedCategories: string[];
  /** categories the shopper has favourited */
  favoriteCategories: string[];
}

const EMPTY_SIGNALS: RecommendationSignals = {
  ratings: {},
  viewed: [],
  purchased: [],
  purchasedCategories: [],
  favoriteCategories: [],
};

/**
 * Turn live context data (reviews, orders, favourites, view history) into
 * engine signals. Everything is optional — missing data just means the
 * corresponding signal stays silent.
 */
export function buildSignals(input: {
  reviews?: Review[];
  viewedIds?: string[];
  orders?: Order[];
  favoriteCategories?: string[];
}): RecommendationSignals {
  // Real star ratings, averaged per bouquet.
  const ratings: Record<string, BouquetRating> = {};
  for (const review of input.reviews ?? []) {
    if (!review.approved || !review.bouquetId) continue;
    const entry = (ratings[review.bouquetId] ??= { avg: 0, count: 0 });
    entry.avg += review.rating;
    entry.count += 1;
  }
  for (const id of Object.keys(ratings)) {
    ratings[id].avg = Math.round((ratings[id].avg / ratings[id].count) * 10) / 10;
  }

  // What this shopper has actually bought — cancelled orders don't count.
  const purchased: string[] = [];
  const purchasedCategories = new Set<string>();
  for (const order of input.orders ?? []) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items ?? []) {
      const id = item.bouquet?.id;
      if (!id || purchased.includes(id)) continue;
      purchased.push(id);
      const inCatalog = getCatalog().find(b => b.id === id);
      if (inCatalog) purchasedCategories.add(inCatalog.category);
    }
  }

  return {
    ratings,
    viewed: (input.viewedIds ?? []).filter(Boolean),
    purchased,
    purchasedCategories: [...purchasedCategories],
    favoriteCategories: input.favoriteCategories ?? [],
  };
}

export interface SignalAdjustment {
  /** true when the bouquet must not be recommended at all */
  excluded: boolean;
  bonus: number;
  reasons: string[];
}

/**
 * Layer real behaviour on top of a rule score. Out-of-stock bouquets are
 * never recommended — the old engine ignored `inStock` entirely.
 */
export function applySignals(
  bouquet: Bouquet,
  signals: RecommendationSignals = EMPTY_SIGNALS
): SignalAdjustment {
  if (!bouquet.inStock) {
    return { excluded: true, bonus: 0, reasons: ['Out of stock'] };
  }

  let bonus = 0;

  // Real customer ratings, not the static popularity field.
  const rating = signals.ratings[bouquet.id];
  if (rating && rating.count > 0) {
    bonus += Math.round(rating.avg * 5); // 25 points at 5★
    if (rating.count >= 3) bonus += 3;   // confidence in a well-reviewed average
  }

  // Browsing history — the long-dormant view signal, now fed by recordView().
  const justViewed = signals.viewed.includes(bouquet.id);
  const browsedCategory =
    !justViewed &&
    signals.viewed.some(id => getCatalog().find(b => b.id === id)?.category === bouquet.category);
  if (justViewed) bonus += 6;
  else if (browsedCategory) bonus += 8;

  // The shopper's real orders: skip what they own, nudge toward what they buy.
  const alreadyOrdered = signals.purchased.includes(bouquet.id);
  const orderedCategory =
    !alreadyOrdered && signals.purchasedCategories.includes(bouquet.category);
  if (alreadyOrdered) bonus -= 60; // only resurfaces when every fresh option is used up
  else if (orderedCategory) bonus += 10;

  // Styles they've favourited.
  const favoriteMatch = signals.favoriteCategories.includes(bouquet.category);
  if (favoriteMatch) bonus += 8;

  // Reasons are capped at two, so list them by importance — "you already own
  // this" must never be the one that gets truncated away.
  const reasons: string[] = [];
  if (alreadyOrdered) reasons.push('You ordered this before');
  if (rating && rating.count > 0) {
    reasons.push(`Rated ${rating.avg.toFixed(1)}★ by ${rating.count} customer${rating.count === 1 ? '' : 's'}`);
  }
  if (justViewed) reasons.push('You viewed this recently');
  else if (browsedCategory) reasons.push('Similar to what you browsed');
  if (orderedCategory) reasons.push(`You've ordered ${bouquet.category} before`);
  if (favoriteMatch) reasons.push('Matches your favorites');

  return { excluded: false, bonus, reasons: reasons.slice(0, 2) };
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
      // Never recommend something the shopper can't buy.
      if (!bouquet.inStock) continue;

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
            type: 'occasion' as const,
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
  static getSimilarBouquets(bouquetId: string, limit: number = 4, signals?: RecommendationSignals): RecommendedBouquet[] {
    const bouquet = getCatalog().find(b => b.id === bouquetId);
    if (!bouquet) return [];

    return getCatalog()
      .filter(b => b.id !== bouquetId && b.inStock)
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

        // Real behaviour: ratings, browsing history, the shopper's orders.
        if (signals) {
          const signal = applySignals(b, signals);
          score += signal.bonus;
          reasons.push(
            ...signal.reasons.map(message => ({ type: 'preference' as const, message }))
          );
        }

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
