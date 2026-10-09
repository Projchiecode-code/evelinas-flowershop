import { AIRule } from '../types';

export const defaultAIRules: AIRule[] = [
  { id: 'rule-1', name: 'Occasion Match Boost', description: 'Boost score by 40 when bouquet matches the selected occasion', conditions: [{ field: 'occasion', operator: 'includes', value: 'selected_occasion' }], action: { type: 'boost', value: 40 }, active: true, priority: 1 },
  { id: 'rule-2', name: 'Budget Range Filter', description: 'Give +25 score when bouquet price falls within user budget range', conditions: [{ field: 'price', operator: 'in_range', value: 'user_budget' }], action: { type: 'boost', value: 25 }, active: true, priority: 2 },
  { id: 'rule-3', name: 'Color Preference Match', description: 'Add +20 when bouquet color palette matches user color preference', conditions: [{ field: 'flowers', operator: 'color_match', value: 'user_color' }], action: { type: 'boost', value: 20 }, active: true, priority: 3 },
  { id: 'rule-4', name: 'Recipient Type Boost', description: 'Add +15 when bouquet is commonly chosen for the recipient type', conditions: [{ field: 'occasion', operator: 'recipient_match', value: 'user_recipient' }], action: { type: 'boost', value: 15 }, active: true, priority: 4 },
  { id: 'rule-5', name: 'Popularity Baseline', description: 'Add up to 20 points based on bouquet popularity score (max 100)', conditions: [{ field: 'popularity', operator: 'gte', value: '0' }], action: { type: 'boost', value: 20 }, active: true, priority: 5 },
  { id: 'rule-6', name: 'Valentine Season Boost', description: 'Boost roses and romantic bouquets +10 during February', conditions: [{ field: 'category', operator: 'equals', value: 'Roses' }, { field: 'month', operator: 'equals', value: '2' }], action: { type: 'boost', value: 10 }, active: true, priority: 6 },
  { id: 'rule-7', name: "Spring Tulip Feature", description: 'Feature tulips prominently from March to May', conditions: [{ field: 'category', operator: 'equals', value: 'Tulips' }, { field: 'month', operator: 'between', value: '3,5' }], action: { type: 'tag', value: 'seasonal_pick' }, active: true, priority: 7 },
  { id: 'rule-8', name: 'Out of Stock Filter', description: 'Remove bouquets that are out of stock from recommendations', conditions: [{ field: 'inStock', operator: 'equals', value: 'false' }], action: { type: 'filter', value: 'exclude' }, active: true, priority: 8 },
];
