import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { BouquetCard } from '../components/BouquetCard';
import { useProducts } from '../contexts/ProductsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bouquets } = useProducts();
  const categories = useMemo(() => Array.from(new Set(bouquets.map(b => b.category))), [bouquets]);
  const occasions = useMemo(() => Array.from(new Set(bouquets.flatMap(b => b.occasion))), [bouquets]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    (searchParams.get('category') || '').split(',').filter(Boolean)
  );
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    (searchParams.get('occasion') || '').split(',').filter(Boolean)
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150]);
  const [sortBy, setSortBy] = useState('popularity');

  // Write the active filters into the query string (replace, not push, so
  // typing doesn't spam history) — a filtered catalog becomes shareable and
  // survives refresh.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (selectedCategories.length) next.set('category', selectedCategories.join(','));
    if (selectedOccasions.length) next.set('occasion', selectedOccasions.join(','));
    setSearchParams(next, { replace: true });
  }, [search, selectedCategories, selectedOccasions, setSearchParams]);

  // And read external changes back in (e.g. the header search box navigating
  // to /catalog?search=… while this component stays mounted). Only state that
  // differs is touched, so this settles instead of looping with the effect
  // above.
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategories = (searchParams.get('category') || '').split(',').filter(Boolean);
    const urlOccasions = (searchParams.get('occasion') || '').split(',').filter(Boolean);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlCategories.join(',') !== selectedCategories.join(',')) setSelectedCategories(urlCategories);
    if (urlOccasions.join(',') !== selectedOccasions.join(',')) setSelectedOccasions(urlOccasions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...bouquets];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.flowers.some(f => f.toLowerCase().includes(q))
      );
    }
    if (selectedCategories.length) list = list.filter(b => selectedCategories.includes(b.category));
    if (selectedOccasions.length) list = list.filter(b => b.occasion.some(o => selectedOccasions.includes(o)));
    list = list.filter(b => b.price >= priceRange[0] && b.price <= priceRange[1]);
    list.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.popularity - a.popularity;
    });
    return list;
  }, [bouquets, search, selectedCategories, selectedOccasions, priceRange, sortBy]);

  const toggle = <T,>(arr: T[], val: T, set: (v: T[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const activeFilters = [...selectedCategories, ...selectedOccasions];
  const clearAll = () => { setSelectedCategories([]); setSelectedOccasions([]); setPriceRange([0, 150]); setSearch(''); };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggle(selectedCategories, cat, setSelectedCategories)}
                className="border-pink-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-rose-600">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Occasion</h3>
        <div className="space-y-2">
          {occasions.map(occ => (
            <label key={occ} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={selectedOccasions.includes(occ)}
                onCheckedChange={() => toggle(selectedOccasions, occ, setSelectedOccasions)}
                className="border-pink-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-rose-600">{occ}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Price: <span className="text-rose-600">₱{priceRange[0]} – ₱{priceRange[1]}</span>
        </h3>
        <Slider min={0} max={150} step={5} value={priceRange} onValueChange={v => setPriceRange(v as [number, number])} className="[&_[role=slider]]:bg-rose-500 [&_[role=slider]]:border-rose-500" />
      </div>
      <Button onClick={clearAll} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Bouquet Catalog</h1>
          <p className="text-rose-100">Handcrafted with love — {bouquets.length} beautiful arrangements</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bouquets, flowers, occasions..."
              className="pl-10 border-pink-200 focus:border-rose-400"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden border-rose-200 text-rose-600">
                <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
                {activeFilters.length > 0 && (
                  <Badge className="ml-2 bg-rose-500 text-white text-xs h-5 px-1">{activeFilters.length}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-rose-600 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 border-pink-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map(f => (
              <Badge key={f} className="bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 cursor-pointer" onClick={() => {
                setSelectedCategories(selectedCategories.filter(c => c !== f));
                setSelectedOccasions(selectedOccasions.filter(o => o !== f));
              }}>
                {f} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-rose-600 underline">Clear all</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-pink-100 p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-500" /> Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-rose-600">{filtered.length}</span> of {bouquets.length} bouquets
            </p>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-16 text-center">
                <div className="text-6xl mb-4">🌸</div>
                <p className="text-gray-500 text-lg mb-4">No bouquets match your filters.</p>
                <Button onClick={clearAll} className="bg-rose-500 hover:bg-rose-600 text-white">Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(b => (
                  <BouquetCard key={b.id} bouquet={b} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
