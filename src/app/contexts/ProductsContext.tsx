import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Bouquet } from '../types';
import { productApi } from '../api/client';
import { bouquets as seedBouquets } from '../data/bouquets';
import { setCatalog } from '../data/catalog';

export type ProductDraft = Omit<Bouquet, 'id'>;

interface ProductsContextType {
  bouquets: Bouquet[];
  isLoading: boolean;
  /** True when the API was unreachable and the bundled seed list is shown. */
  isOffline: boolean;
  refetch: () => Promise<void>;
  createProduct: (draft: ProductDraft) => Promise<Bouquet>;
  updateProduct: (id: string, draft: ProductDraft) => Promise<Bouquet>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

/** Only these keys are sent to the API — the Mongoose schema owns the rest. */
const PRODUCT_FIELDS = ['name', 'description', 'price', 'image', 'category', 'occasion', 'popularity', 'inStock', 'stock', 'flowers'] as const;

const toPayload = (draft: ProductDraft) => {
  const payload: Record<string, unknown> = {};
  PRODUCT_FIELDS.forEach(field => {
    const value = (draft as unknown as Record<string, unknown>)[field];
    if (value !== undefined) payload[field] = value;
  });
  payload.price = Number(payload.price) || 0;
  payload.popularity = Number(payload.popularity) || 0;
  // Whole, non-negative units only — the server validates again anyway.
  payload.stock = Math.max(0, Math.floor(Number(payload.stock) || 0));
  return payload;
};

/** API docs arrive as Mongo documents (`_id`, loose fields) — normalise to `Bouquet`. */
export function normalizeBouquet(raw: any): Bouquet {
  // Products created before quantity tracking (or served from the bundled
  // seed) may not carry `stock` — assume the schema default, or 0 when the
  // admin has explicitly marked the item out of stock.
  const stock = typeof raw?.stock === 'number' && Number.isFinite(raw.stock)
    ? Math.max(0, Math.floor(raw.stock))
    : (raw?.inStock === false ? 0 : 10);
  return {
    id: String(raw?.id || raw?._id || ''),
    name: String(raw?.name ?? ''),
    description: String(raw?.description ?? ''),
    price: Number(raw?.price) || 0,
    image: String(raw?.image ?? ''),
    category: String(raw?.category ?? 'Mixed'),
    occasion: Array.isArray(raw?.occasion) ? raw.occasion.map(String) : [],
    popularity: Number(raw?.popularity) || 0,
    // Availability = manual toggle AND units left, so everything downstream
    // (cards, buttons, AI rules) keeps reading one flag.
    inStock: raw?.inStock !== false && stock > 0,
    stock,
    flowers: Array.isArray(raw?.flowers) ? raw.flowers.map(String) : [],
  };
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [bouquets, setBouquets] = useState<Bouquet[]>(seedBouquets);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const applyList = useCallback((list: Bouquet[]) => {
    setBouquets(list);
    setCatalog(list); // keep the non-hook consumer (AI engine) in sync
  }, []);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      let data = (await productApi.getAll()) as any[];
      if (!Array.isArray(data)) data = [];

      // Fresh database: seed once from the bundled catalogue so the storefront,
      // admin and checkout (which looks products up by name) all agree.
      if (data.length === 0) {
        try {
          await productApi.seed();
          data = (await productApi.getAll()) as any[];
        } catch {
          data = [];
        }
      }

      if (data.length === 0) throw new Error('Product catalog is empty');

      applyList(data.map(normalizeBouquet));
      setIsOffline(false);
    } catch (err) {
      console.error('Failed to load products:', err);
      applyList(seedBouquets);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [applyList]);

  useEffect(() => {
    load();
  }, [load]);

  const createProduct = async (draft: ProductDraft) => {
    const created = (await productApi.create(toPayload(draft))) as any;
    const bouq = normalizeBouquet(created);
    applyList([bouq, ...bouquets]);
    return bouq;
  };

  const updateProduct = async (id: string, draft: ProductDraft) => {
    const updated = (await productApi.update(id, toPayload(draft))) as any;
    const bouq = normalizeBouquet(updated);
    applyList(bouquets.map(p => (p.id === id || p.id === bouq.id ? bouq : p)));
    return bouq;
  };

  const deleteProduct = async (id: string) => {
    await productApi.delete(id);
    applyList(bouquets.filter(p => p.id !== id));
  };

  return (
    <ProductsContext.Provider value={{ bouquets, isLoading, isOffline, refetch: load, createProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within a ProductsProvider');
  return ctx;
}
