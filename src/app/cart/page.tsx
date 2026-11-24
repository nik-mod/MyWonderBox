import { Cart } from '@/components/cart';
import { getSettings } from '@/lib/catalog';
import { connection } from 'next/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'კალათა', robots: { index: false } };

export default async function CartPage() {
  await connection();
  const { delivery_zones } = await getSettings();
  const freeDelivery = delivery_zones.length > 0 && delivery_zones.every(zone => zone.price_minor === 0);
  return <main id="main" className="page-shell container cart-edition">
    <header className="commerce-heading"><h1>ჩემი კალათა</h1></header>
    <Cart freeDelivery={freeDelivery} />
  </main>;
}
