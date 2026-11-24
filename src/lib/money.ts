import { giftBag } from './gift-bags';
import type { Product } from './types';

export function formatMoney(minor: number, decimal = ','): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid monetary amount');
  // Chromium builds without Georgian ICU data would otherwise render a different price on hydration.
  const tetri = minor % 100;
  const digits = String((minor - tetri) / 100);
  const lari = digits.length > 4 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : digits;
  const fraction = tetri ? decimal + String(tetri).padStart(2, '0') : '';
  return lari + fraction + '\u00a0₾';
}

export function formatProductPrice(product: Pick<Product, 'slug' | 'price_minor'>): string {
  return formatMoney(product.price_minor, giftBag(product) ? '.' : ',');
}
export function calculateTotal(items: {price_minor: number; quantity: number}[], deliveryMinor: number) {
  if (!Number.isSafeInteger(deliveryMinor) || deliveryMinor < 0) throw new Error('Invalid delivery amount');
  let total = deliveryMinor;
  for (const item of items) {
    if (!Number.isSafeInteger(item.price_minor) || item.price_minor < 0 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Invalid line item');
    total += item.price_minor * item.quantity;
  }
  if (!Number.isSafeInteger(total)) throw new Error('Total exceeds supported range');
  return total;
}
