import { Fragment, useEffect, useState, useRef, type ChangeEvent } from 'react';
import { Plus, Edit2, Trash2, Search, Package, X, Check, Loader2, WifiOff } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useProducts } from '../../contexts/ProductsContext';
import { Bouquet } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { classifyStock, unitsLeft, LOW_STOCK_THRESHOLD } from '../../utils/inventory';

const EMPTY: Omit<Bouquet, 'id'> = {
  name: '', description: '', price: 0, image: '', category: 'Roses',
  occasion: [], popularity: 80, inStock: true, stock: 10, flowers: [],
};

const CATEGORIES = ['Roses', 'Lilies', 'Tulips', 'Sunflowers', 'Orchids', 'Peonies', 'Mixed'];

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DATA_URL_LENGTH = 2_000_000;

async function compressProductImage(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please select a JPG, PNG, or WebP image.');
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('Image must not exceed 5 MB.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not load image.'));

      image.src = objectUrl;
    });

    const MAX_DIMENSION = 1200;

    const scale = Math.min(
      1,
      MAX_DIMENSION / img.width,
      MAX_DIMENSION / img.height
    );

    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Image processing is unavailable.');
    }

    // White background for transparent PNG images.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Compress until the resulting data URL fits our limit.
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    throw new Error('Image is too large after compression. Choose another image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProductManagement() {
  const { bouquets, isLoading, isOffline, createProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Bouquet | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Bouquet, 'id'>>({
    ...EMPTY,
  });
  const [priceInput, setPriceInput] = useState('0');
  const [processingImage, setProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Phase 5: quick inventory filters ("Low stock (2)") above the table.
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Phase 5: deep link from the dashboard Inventory Watch / bell alerts —
  // /admin/products?edit=<id> opens that product's edit form (one-shot).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || isLoading) return;
    const target = bouquets.find(b => b.id === editId);
    if (target) startEdit(target);
    setSearchParams({}, { replace: true });
  }, [searchParams, bouquets, isLoading]);

  const stockCounts = bouquets.reduce(
    (acc, b) => { acc[classifyStock(b)] += 1; return acc; },
    { out: 0, low: 0, ok: 0 } as Record<'out' | 'low' | 'ok', number>,
  );

  const filtered = bouquets.filter(p => {
    const status = classifyStock(p);
    if (stockFilter === 'low' && status !== 'low') return false;
    if (stockFilter === 'out' && status !== 'out') return false;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const startAdd = () => {
    setAdding(true);
    setEditing(null);
    setForm(EMPTY);
    setPriceInput('');
  };

  const startEdit = (p: Bouquet) => {
    const { id, ...rest } = p;
    setEditing(p);
    setAdding(false);
    setForm(rest);
    setPriceInput(String(p.price));
  };

  const cancelForm = () => {
    setAdding(false);
    setEditing(null);
    setPriceInput('');
  };

  const handleImageChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setProcessingImage(true);

    try {
      const compressedImage = await compressProductImage(file);

      setForm(prev => ({
        ...prev,
        image: compressedImage,
      }));

      toast.success('Product image selected successfully.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process image.'
      );
    } finally {
      setProcessingImage(false);
      e.target.value = '';
    }
  };

  // Every mutation writes to the API first, then ProductsContext refreshes the
  // shared list — so edits show up on the storefront immediately.
  const saveProduct = async () => {
    if (!form.name.trim()) {
      toast.error('Product name is required.');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Product description is required.');
      return;
    }

    const enteredPrice = Number(priceInput);

    const productData = {
    ...form,
    price: enteredPrice,
  };

    if (
      priceInput.trim() === '' ||
      !Number.isFinite(enteredPrice) ||
      enteredPrice <= 0
    ) {
      toast.error('Product price must be greater than ₱0.');
      return;
    }

    if (!form.image) {
      toast.error('Please select a product image.');
      return;
    }

    if (processingImage) {
      toast.error('Please wait for the image to finish processing.');
      return;
    }
    setSaving(true);
    try {
      if (adding) {
        await createProduct(productData);
        toast.success(`"${form.name}" added to the catalog.`);
      } else if (editing) {
        await updateProduct(editing.id, productData);
        toast.success('Product updated.');
      }
      cancelForm();
    } catch (err) {
      console.error('Save product failed:', err);
      toast.error('Could not save the product — the API did not respond.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      setDeleteId(null);
      toast.success(`"${name}" removed from the catalog.`);
    } catch (err) {
      console.error('Delete product failed:', err);
      toast.error('Could not delete the product.');
    }
  };

  const toggleStock = async (id: string) => {
    const product = bouquets.find(p => p.id === id);
    if (!product) return;
    try {
      await updateProduct(id, { ...product, inStock: !product.inStock });
    } catch (err) {
      console.error('Toggle stock failed:', err);
      toast.error('Could not update stock status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-500 text-sm">
            {bouquets.length} products in catalog
            {isLoading && <span className="text-rose-500"> · syncing with database…</span>}
          </p>
        </div>
        <Button onClick={startAdd} className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {isOffline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <WifiOff className="w-4 h-4 shrink-0" />
          Can&apos;t reach the API — showing the bundled catalog. Saving will fail until the connection is restored.
        </div>
      )}

      {/* Add/Edit Form */}
      {adding && (
        <div className="bg-white rounded-2xl border border-pink-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">{adding ? 'Add New Product' : 'Edit Product'}</h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bouquet name" className="border-pink-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Price (₱)</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                placeholder="Enter product price"
                className="border-pink-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Stock (units)</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                className="border-pink-200"
              />
            </div>
            
            {/* PRODUCT IMAGE UPLOAD */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Product Image *
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-start">

                {/* Image Preview */}
                <div className="w-full sm:w-40 h-40 rounded-xl border-2 border-dashed border-pink-200 bg-pink-50 overflow-hidden flex items-center justify-center">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Package className="w-9 h-9 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No image selected</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-pink-200 text-rose-600 hover:bg-pink-50"
                  >
                    {processingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}

                    {processingImage ? 'Processing Image...' : 'Choose Image'}
                  </Button>

                  {form.image && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={processingImage}
                      onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      className="border-red-200 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  )}

                  <p className="text-xs text-gray-400">
                    JPG, PNG, or WebP · Maximum 5 MB
                  </p>

                  <p className="text-xs text-gray-400">
                    Image will automatically be resized and compressed.
                  </p>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Product description..." className="w-full border border-pink-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-rose-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Flowers (comma-separated)</label>
              <Input value={form.flowers.join(', ')} onChange={e => setForm(f => ({ ...f, flowers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="Red Roses, Baby's Breath" className="border-pink-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Occasions (comma-separated)</label>
              <Input value={form.occasion.join(', ')} onChange={e => setForm(f => ({ ...f, occasion: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="Birthday, Anniversary" className="border-pink-200" />
            </div>
          </div>
          {/* Footer — wraps to two rows on phones so Save Changes never overflows the card */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} className="accent-rose-500 w-4 h-4" />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <div className="hidden sm:block flex-1" />
            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
              <Button variant="outline" onClick={cancelForm} className="border-gray-200" disabled={saving}>Cancel</Button>
              <Button onClick={saveProduct} disabled={saving || processingImage} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {saving ? 'Saving…' : adding ? 'Add Product' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 5 — inventory filter chips */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'All products', count: bouquets.length, tone: '' },
          { key: 'low', label: `Low stock (≤${LOW_STOCK_THRESHOLD})`, count: stockCounts.low, tone: stockCounts.low > 0 ? 'text-amber-600' : 'text-gray-400' },
          { key: 'out', label: 'Out of stock', count: stockCounts.out, tone: stockCounts.out > 0 ? 'text-red-500' : 'text-gray-400' },
        ] as const).map(chip => (
          <button
            key={chip.key}
            onClick={() => setStockFilter(chip.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              stockFilter === chip.key
                ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white border-transparent shadow-sm'
                : 'bg-white text-gray-600 border-pink-200 hover:border-rose-300'
            }`}
          >
            {chip.label} <span className={stockFilter === chip.key ? '' : chip.tone}>({chip.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-10 border-pink-200" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rose-50 border-b border-rose-100">
              <tr>
                <th className="text-left p-4 text-gray-600 font-semibold">Product</th>
                <th className="text-left p-4 text-gray-600 font-semibold hidden sm:table-cell">Category</th>
                <th className="text-right p-4 text-gray-600 font-semibold">Price</th>
                <th className="text-center p-4 text-gray-600 font-semibold hidden md:table-cell">Stock</th>
                <th className="text-right p-4 text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
                {filtered.map(p => (
                  <Fragment key={p.id}>
                    <tr className="border-b border-rose-50 hover:bg-rose-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 hidden sm:block">{p.flowers.slice(0, 2).join(', ')}</p>
                        {/* Stock stays visible on phones — its table column is hidden below md. */}
                        <p className={`text-xs mt-0.5 md:hidden font-medium ${classifyStock(p) === 'out' ? 'text-rose-500' : classifyStock(p) === 'low' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                          {classifyStock(p) === 'out' ? 'Out of stock' : unitsLeft(p.stock)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">{p.category}</Badge>
                  </td>
                  <td className="p-4 text-right font-bold text-rose-600">{formatCurrency(p.price)}</td>
                  <td className="p-4 text-center hidden md:table-cell">
                    <button onClick={() => toggleStock(p.id)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${p.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <p className={`text-xs mt-1 ${p.stock <= 5 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                      {p.stock} unit{p.stock === 1 ? '' : 's'} left
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => confirmDelete(p.id, p.name)} className="p-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">Delete?</button>
                          <button onClick={() => setDeleteId(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
              </tr>

              {/* INLINE EDIT FORM */}
                {editing?.id === p.id && (
                  <tr>
                    <td colSpan={5} className="p-4 bg-rose-50/50">
                      <div className="bg-white rounded-2xl border border-pink-200 shadow-sm p-5">

                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h2 className="font-bold text-gray-800">
                              Edit Product
                            </h2>
                            <p className="text-xs text-gray-400">
                              Updating: {editing.name}
                            </p>
                          </div>

                          <button
                            onClick={cancelForm}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* PRODUCT FIELDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Name *
                            </label>
                            <Input
                              value={form.name}
                              onChange={e => setForm(f => ({
                                ...f,
                                name: e.target.value
                              }))}
                              className="border-pink-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Category
                            </label>
                            <select
                              value={form.category}
                              onChange={e => setForm(f => ({
                                ...f,
                                category: e.target.value
                              }))}
                              className="w-full border border-pink-200 rounded-lg px-3 py-2 text-sm"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Price (₱)
                            </label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={priceInput}
                              onChange={e => setPriceInput(e.target.value)}
                              className="border-pink-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Stock (units)
                            </label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={form.stock}
                              onChange={e => setForm(f => ({
                                ...f,
                                stock: Math.max(0, Math.floor(Number(e.target.value) || 0))
                              }))}
                              className="border-pink-200"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                              Product Image
                            </label>

                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-full sm:w-40 h-40 rounded-xl border border-pink-200 overflow-hidden flex items-center justify-center">
                                {form.image ? (
                                  <img
                                    src={form.image}
                                    alt="Product preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-9 h-9 text-gray-300" />
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handleImageChange}
                                  className="hidden"
                                />

                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={processingImage}
                                  onClick={() => fileInputRef.current?.click()}
                                  className="border-pink-200 text-rose-600 hover:bg-pink-50"
                                >
                                  {processingImage ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                  )}

                                  {processingImage ? 'Processing...' : 'Choose Image'}
                                </Button>

                                {form.image && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processingImage}
                                    onClick={() => setForm(f => ({
                                      ...f,
                                      image: ''
                                    }))}
                                    className="border-red-200 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                      Remove Image
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Description *
                            </label>
                            <textarea
                              value={form.description}
                              onChange={e => setForm(f => ({
                                ...f,
                                description: e.target.value
                              }))}
                              rows={3}
                              className="w-full border border-pink-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Flowers
                            </label>
                            <Input
                              value={form.flowers.join(', ')}
                              onChange={e => setForm(f => ({
                                ...f,
                                flowers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              }))}
                              className="border-pink-200"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Occasions
                            </label>
                            <Input
                              value={form.occasion.join(', ')}
                              onChange={e => setForm(f => ({
                                ...f,
                                occasion: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              }))}
                              className="border-pink-200"
                            />
                          </div>

                        </div>

                        {/* FORM ACTIONS */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.inStock}
                              onChange={e => setForm(f => ({
                                ...f,
                                inStock: e.target.checked
                              }))}
                              className="accent-rose-500 w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">
                              In Stock
                            </span>
                          </label>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={cancelForm}
                              disabled={saving}
                            >
                              Cancel
                            </Button>

                            <Button
                              onClick={saveProduct}
                              disabled={saving || processingImage}
                              className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-2" />
                              )}
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}

              </Fragment>
            ))}
          </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No products found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
