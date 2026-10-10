import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Package, X, Check, Loader2, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useProducts } from '../../contexts/ProductsContext';
import { Bouquet } from '../../types';
import { formatCurrency } from '../../utils/currency';

const EMPTY: Omit<Bouquet, 'id'> = {
  name: '', description: '', price: 0, image: '', category: 'Roses',
  occasion: [], popularity: 80, inStock: true, stock: 10, flowers: [],
};

const CATEGORIES = ['Roses', 'Lilies', 'Tulips', 'Sunflowers', 'Orchids', 'Peonies', 'Mixed'];

export function ProductManagement() {
  const { bouquets, isLoading, isOffline, createProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Bouquet | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Bouquet, 'id'>>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = bouquets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY); };
  const startEdit = (p: Bouquet) => {
    const { id, ...rest } = p;
    setEditing(p); setAdding(false); setForm(rest);
  };
  const cancelForm = () => { setAdding(false); setEditing(null); };

  // Every mutation writes to the API first, then ProductsContext refreshes the
  // shared list — so edits show up on the storefront immediately.
  const saveProduct = async () => {
    if (!form.name.trim()) {
      toast.error('Product name is required.');
      return;
    }
    setSaving(true);
    try {
      if (adding) {
        await createProduct(form);
        toast.success(`"${form.name}" added to the catalog.`);
      } else if (editing) {
        await updateProduct(editing.id, form);
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
      {(adding || editing) && (
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
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="border-pink-200" />
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
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Image URL</label>
              <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." className="border-pink-200" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
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
          <div className="flex items-center gap-4 mt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} className="accent-rose-500 w-4 h-4" />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <div className="flex-1" />
            <Button variant="outline" onClick={cancelForm} className="border-gray-200" disabled={saving}>Cancel</Button>
            <Button onClick={saveProduct} disabled={saving} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {saving ? 'Saving…' : adding ? 'Add Product' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

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
                <tr key={p.id} className="border-b border-rose-50 hover:bg-rose-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 hidden sm:block">{p.flowers.slice(0, 2).join(', ')}</p>
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
