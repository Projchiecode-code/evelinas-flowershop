import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { BouquetCard } from '../components/BouquetCard';
import { useProducts } from '../contexts/ProductsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function Shop() {
  const { bouquets } = useProducts();
  const [searchParams] = useSearchParams();
  const initialOccasion = searchParams.get('occasion') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialOccasion ? [initialOccasion] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150]);
  const [sortBy, setSortBy] = useState<string>('popularity');

  const categories = Array.from(new Set(bouquets.map(b => b.category)));
  const occasions = Array.from(new Set(bouquets.flatMap(b => b.occasion)));

  const filteredBouquets = useMemo(() => {
    let filtered = [...bouquets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.flowers.some(f => f.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(b => selectedCategories.includes(b.category));
    }

    // Occasion filter
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(b =>
        b.occasion.some(o => selectedOccasions.includes(o))
      );
    }

    // Price filter
    filtered = filtered.filter(
      b => b.price >= priceRange[0] && b.price <= priceRange[1]
    );

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
        default:
          return b.popularity - a.popularity;
      }
    });

    return filtered;
  }, [bouquets, searchQuery, selectedCategories, selectedOccasions, priceRange, sortBy]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion)
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedOccasions([]);
    setPriceRange([0, 150]);
    setSearchQuery('');
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Search</h3>
        <Input
          placeholder="Search bouquets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category} className="flex items-center">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="ml-2 text-sm cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Occasion</h3>
        <div className="space-y-2">
          {occasions.map(occasion => (
            <div key={occasion} className="flex items-center">
              <Checkbox
                id={`occasion-${occasion}`}
                checked={selectedOccasions.includes(occasion)}
                onCheckedChange={() => toggleOccasion(occasion)}
              />
              <Label
                htmlFor={`occasion-${occasion}`}
                className="ml-2 text-sm cursor-pointer"
              >
                {occasion}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </h3>
        <Slider
          min={0}
          max={150}
          step={10}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mt-2"
        />
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shop All Bouquets</h1>
          <p className="text-gray-600">
            Showing {filteredBouquets.length} of {bouquets.length} bouquets
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Filters</h2>
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters & Sort */}
            <div className="flex items-center justify-between mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search to find the perfect bouquet
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bouquets Grid */}
            {filteredBouquets.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No bouquets found matching your criteria.
                </p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBouquets.map(bouquet => (
                  <BouquetCard key={bouquet.id} bouquet={bouquet} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
