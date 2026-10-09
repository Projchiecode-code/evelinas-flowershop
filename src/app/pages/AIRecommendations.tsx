import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, ChevronRight, RotateCcw, ShoppingCart, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BouquetCard } from '../components/BouquetCard';
import { getCatalog } from '../data/catalog';
import { useProducts } from '../contexts/ProductsContext';
import { Bouquet } from '../types';

interface Step {
  id: string;
  question: string;
  options: { label: string; value: string; emoji: string }[];
}

const STEPS: Step[] = [
  {
    id: 'occasion',
    question: 'What is the occasion?',
    options: [
      { label: 'Birthday', value: 'Birthday', emoji: '🎂' },
      { label: 'Anniversary', value: 'Anniversary', emoji: '💍' },
      { label: 'Romance', value: 'Romance', emoji: '❤️' },
      { label: 'Wedding', value: 'Wedding', emoji: '💒' },
      { label: "Mother's Day", value: "Mother's Day", emoji: '👩' },
      { label: 'Thank You', value: 'Thank You', emoji: '🙏' },
      { label: 'Congratulations', value: 'Congratulations', emoji: '🎉' },
      { label: 'Get Well', value: 'Get Well', emoji: '🏥' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your budget?',
    options: [
      { label: 'Under $75', value: 'low', emoji: '💚' },
      { label: '$75 – $99', value: 'medium', emoji: '💛' },
      { label: '$100 – $120', value: 'high', emoji: '🧡' },
      { label: 'No limit', value: 'any', emoji: '💜' },
    ],
  },
  {
    id: 'color',
    question: 'Preferred color palette?',
    options: [
      { label: 'Pinks & Reds', value: 'pink', emoji: '🌹' },
      { label: 'Purples & Lavender', value: 'purple', emoji: '💜' },
      { label: 'Whites & Creams', value: 'white', emoji: '🤍' },
      { label: 'Yellows & Oranges', value: 'yellow', emoji: '🌻' },
      { label: 'Mixed & Colorful', value: 'mixed', emoji: '🌈' },
    ],
  },
  {
    id: 'recipient',
    question: 'Who is it for?',
    options: [
      { label: 'Partner / Spouse', value: 'partner', emoji: '💑' },
      { label: 'Family Member', value: 'family', emoji: '👨‍👩‍👧' },
      { label: 'Friend', value: 'friend', emoji: '👫' },
      { label: 'Colleague', value: 'colleague', emoji: '👔' },
      { label: 'Myself', value: 'self', emoji: '🙋' },
    ],
  },
];

interface RecommendedBouquet extends Bouquet {
  score: number;
  reasons: string[];
}

function scoreRule(bouquet: Bouquet, answers: Record<string, string>): { score: number; reasons: string[] } {
  let score = (bouquet.popularity / 100) * 20;
  const reasons: string[] = [];

  // Occasion rule
  const occasion = answers['occasion'];
  if (occasion && bouquet.occasion.includes(occasion)) {
    score += 40;
    reasons.push(`Perfect for ${occasion}`);
  }

  // Budget rule
  const budget = answers['budget'];
  if (budget === 'low' && bouquet.price < 75) { score += 25; reasons.push('Within your budget'); }
  else if (budget === 'medium' && bouquet.price >= 75 && bouquet.price < 100) { score += 25; reasons.push('Great value in your range'); }
  else if (budget === 'high' && bouquet.price >= 100 && bouquet.price <= 120) { score += 25; reasons.push('Premium pick in your range'); }
  else if (budget === 'any') { score += 10; }

  // Color rule
  const color = answers['color'];
  const pinkFlowers = ['Rose', 'Peony', 'Carnation'];
  const purpleFlowers = ['Orchid', 'Tulip', 'Lavender'];
  const whiteFlowers = ['Lily', 'White'];
  const yellowFlowers = ['Sunflower', 'Daisy'];

  if (color === 'pink' && (bouquet.category === 'Roses' || bouquet.category === 'Peonies' || bouquet.flowers.some(f => pinkFlowers.some(p => f.includes(p))))) {
    score += 20; reasons.push('Matches your pink/red preference');
  } else if (color === 'purple' && (bouquet.category === 'Orchids' || bouquet.category === 'Tulips' || bouquet.flowers.some(f => purpleFlowers.some(p => f.includes(p))))) {
    score += 20; reasons.push('Matches your purple preference');
  } else if (color === 'white' && bouquet.flowers.some(f => whiteFlowers.some(w => f.includes(w)))) {
    score += 20; reasons.push('Matches your white/cream preference');
  } else if (color === 'yellow' && (bouquet.category === 'Sunflowers' || bouquet.flowers.some(f => yellowFlowers.some(y => f.includes(y))))) {
    score += 20; reasons.push('Matches your yellow/orange preference');
  } else if (color === 'mixed' && bouquet.category === 'Mixed') {
    score += 20; reasons.push('Colorful mixed arrangement');
  }

  // Recipient rule
  const recipient = answers['recipient'];
  if (recipient === 'partner' && bouquet.occasion.some(o => ['Romance', 'Anniversary', "Valentine's Day"].includes(o))) {
    score += 15; reasons.push('Romantic choice for your partner');
  } else if (recipient === 'family' && bouquet.occasion.some(o => ["Mother's Day", 'Birthday', 'Get Well'].includes(o))) {
    score += 15; reasons.push('Thoughtful choice for family');
  } else if (recipient === 'friend' && bouquet.occasion.some(o => ['Birthday', 'Thank You', 'Congratulations'].includes(o))) {
    score += 15; reasons.push('Great gift for a friend');
  } else if (recipient === 'colleague' && (bouquet.category === 'Orchids' || bouquet.occasion.includes('Corporate'))) {
    score += 15; reasons.push('Professional and elegant');
  } else if (recipient === 'self') {
    score += 8;
  }

  if (bouquet.popularity > 92) reasons.push('Customer favorite ⭐');

  return { score, reasons: reasons.slice(0, 3) };
}

function getRecommendations(answers: Record<string, string>): RecommendedBouquet[] {
  return getCatalog()
    .map(b => {
      const { score, reasons } = scoreRule(b, answers);
      return { ...b, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function AIRecommendations() {
  // Subscribes to the live catalog so results refresh if it is still loading.
  useProducts();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<RecommendedBouquet[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (stepId: string, value: string) => {
    const newAnswers = { ...answers, [stepId]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        setResults(getRecommendations(newAnswers));
        setLoading(false);
      }, 1200);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
    setLoading(false);
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-rose-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-yellow-300" />
          <h1 className="text-4xl font-bold mb-2">AI Bouquet Advisor</h1>
          <p className="text-purple-100">Answer a few questions — we'll find your perfect match</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {!results && !loading && (
          <div className="bg-white rounded-3xl shadow-lg border border-pink-100 overflow-hidden">
            {/* Progress */}
            <div className="h-2 bg-rose-100">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  Step {currentStep + 1} of {STEPS.length}
                </Badge>
                {currentStep > 0 && (
                  <button onClick={() => setCurrentStep(p => p - 1)} className="text-sm text-gray-400 hover:text-rose-600 transition-colors">
                    ← Back
                  </button>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-8 mt-4">{step.question}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {step.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(step.id, opt.value)}
                    className={`p-4 rounded-2xl border-2 text-center hover:border-rose-400 hover:bg-rose-50 transition-all group ${
                      answers[step.id] === opt.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-rose-700">{opt.label}</p>
                  </button>
                ))}
              </div>

              {/* Selected answers recap */}
              {Object.keys(answers).length > 0 && (
                <div className="mt-8 pt-6 border-t border-rose-100">
                  <p className="text-xs text-gray-500 mb-2">Your choices so far:</p>
                  <div className="flex flex-wrap gap-2">
                    {STEPS.filter((_, i) => i < currentStep).map(s => (
                      answers[s.id] && (
                        <Badge key={s.id} className="bg-purple-100 text-purple-700 border-purple-200">
                          {s.options.find(o => o.value === answers[s.id])?.emoji} {s.options.find(o => o.value === answers[s.id])?.label}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-16 text-center">
            <div className="animate-spin text-6xl mb-6">🌸</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Finding your perfect bouquet…</h3>
            <p className="text-gray-500">Our AI is analyzing your preferences</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div className="text-center mb-10">
              <div className="text-5xl mb-3">✨</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Perfect Picks</h2>
              <p className="text-gray-500 mb-6">Based on your preferences, we recommend these bouquets</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {STEPS.map(s => (
                  answers[s.id] && (
                    <Badge key={s.id} className="bg-rose-100 text-rose-700 border-rose-200 px-3 py-1">
                      {s.options.find(o => o.value === answers[s.id])?.emoji} {s.options.find(o => o.value === answers[s.id])?.label}
                    </Badge>
                  )
                ))}
              </div>
              <Button onClick={reset} variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {results.map((b, i) => (
                <div key={b.id} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {i === 0 && (
                    <div className="bg-gradient-to-r from-rose-500 to-purple-500 text-white text-center py-1.5 text-xs font-bold">
                      ⭐ Best Match
                    </div>
                  )}
                  <img src={b.image} alt={b.name} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{b.name}</h3>
                      <span className="font-bold text-rose-600">${b.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{b.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {b.reasons.map((r, ri) => (
                        <Badge key={ri} className="bg-purple-50 text-purple-700 border-purple-100 text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                    <Link to={`/bouquet/${b.id}`}>
                      <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" /> View & Add to Cart
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Want to explore more options?</p>
              <Link to="/catalog">
                <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">
                  Browse Full Catalog <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
