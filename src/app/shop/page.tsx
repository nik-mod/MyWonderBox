import { Suspense } from 'react';
import { connection } from 'next/server';
import { getProducts } from '@/lib/catalog';
import { ShopExperience } from '@/components/shop-experience';
import { storefrontMetadata } from '@/lib/metadata';
import './shop.css';

export const metadata = storefrontMetadata(
  '/shop', 'სიურპრიზ-პარკები და ყუთები', 'დაათვალიერე MyWonderBox-ის სიურპრიზ-პარკები და ყუთები. ნახე ფასი, შეფუთვა და ხელმისაწვდომობა.',
);
async function ShopCatalog() {
  await connection();
  return <ShopExperience products={await getProducts()} />;
}

function ShopCatalogLoading() {
  return (
    <div className="shop-loading" role="status">
      <span className="sr-only">კატალოგი იტვირთება…</span>
      <div className="shop-loading-controls" aria-hidden="true" />
      <div className="shop-loading-grid" aria-hidden="true"><div /><div /></div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <main className="page-shell container shop-editions" id="main">
      <header className="commerce-heading">
        <h1>სიურპრიზ-პარკები და ყუთები</h1>
      </header>
      <Suspense fallback={<ShopCatalogLoading />}><ShopCatalog /></Suspense>
    </main>
  );
}
