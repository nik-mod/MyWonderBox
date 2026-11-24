'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { catalogProduct } from '@/lib/packaging';
import { canPurchase } from '@/lib/gift-bags';

type Line = { product: Product; quantity: number };
type CartValue = { lines: Line[]; count: number; ready: boolean; add: (product: Product, quantity?: number) => void; update: (id: string, quantity: number) => void; remove: (id: string) => void; clear: () => void; notice: string; applyCatalog: (products: Product[]) => void };
const CartContext = createContext<CartValue | null>(null);
// Keep carts written before the rename available on the same domain.
const storageKey = 'joybox-cart-v1';
export async function fetchCartCatalog(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch('/api/products', { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Catalog unavailable');
  return (await response.json()).products;
}

export function currentCartLines(lines: Line[], products: Product[]) {
  const inventory = new Map(products.map(product => [product.id, product]));
  return lines.flatMap(line => {
    const product = inventory.get(line.product.id);
    return product && canPurchase(product) ? [{ product, quantity: Math.min(line.quantity, product.stock) }] : [];
  });
}

function isStoredLine(value: unknown): value is Line {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Line>; const product = item.product;
  return Boolean(product && typeof product.id === 'string' && product.id.length <= 100 && typeof product.slug === 'string' && /^[a-z0-9-]+$/.test(product.slug) && typeof product.name === 'string' && product.name.length <= 200 && typeof product.image_url === 'string' && (!product.image_url || product.image_url.startsWith('/') || product.image_url.startsWith('https://')) && Number.isSafeInteger(product.stock) && product.stock >= 0 && Number.isSafeInteger(product.price_minor) && product.price_minor >= 0 && product.price_minor <= 100_000_000 && Number.isSafeInteger(item.quantity) && item.quantity! > 0 && item.quantity! <= 99);
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]); const [ready, setReady] = useState(false); const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let saved: Line[] = [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(parsed)) {
        const unique = new Map<string, Line>();
        for (const line of parsed.filter(isStoredLine).slice(0, 100)) {
          unique.set(line.product.id, { ...line, product: catalogProduct(line.product) });
        }
        saved = [...unique.values()];
      }
    } catch { /* Corrupted or unavailable storage starts with a clean cart. */ }
    if (!saved.length) setReady(true);
    else fetchCartCatalog(controller.signal).then(products => {
      const current = currentCartLines(saved, products);
      if (!controller.signal.aborted) {
        setLines(current);
        if (current.length !== saved.length || current.some((line, i) => line.quantity !== saved[i].quantity)) {
          setNotice('კალათა განახლდა მიმდინარე მარაგის მიხედვით.');
        }
      }
    }).catch(() => {
      // Keep the saved selection through a network failure. The order handoff rechecks stock.
      if (!controller.signal.aborted) setLines(saved);
    }).finally(() => { if (!controller.signal.aborted) setReady(true); });
    return () => controller.abort();
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* Cart remains available for this visit. */ } } }, [lines, ready]);
  function add(product: Product, quantity = 1) {
    if (!canPurchase(product) || !Number.isSafeInteger(quantity) || quantity < 1) return;
    setLines(current => {
      const old = current.find(line => line.product.id === product.id);
      const next = { product, quantity: Math.min(product.stock, 99, (old?.quantity ?? 0) + quantity) };
      return old ? current.map(line => line === old ? next : line) : [...current, next];
    });
    setNotice(`${product.name} დაემატა კალათაში`);
  }
  function update(id: string, quantity: number) {
    if (!Number.isSafeInteger(quantity)) return;
    setLines(current => quantity < 1 ? current.filter(line => line.product.id !== id) : current.map(line =>
      line.product.id === id && canPurchase(line.product) ? { ...line, quantity: Math.min(99, line.product.stock, quantity) } : line,
    ));
  }
  function applyCatalog(products: Product[]) {
    setLines(current => currentCartLines(current, products));
  }
  return <CartContext.Provider value={{ lines, ready, count: lines.reduce((sum, line) => sum + line.quantity, 0), add, update, remove: id => setLines(current => current.filter(line => line.product.id !== id)), clear: () => setLines([]), notice, applyCatalog }}>{children}<span className="sr-only" role="status" aria-live="polite">{notice}</span></CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('CartProvider required'); return context; }
