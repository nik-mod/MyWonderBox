import { Suspense } from 'react';
import { connection } from 'next/server';
import { getProducts } from '@/lib/catalog';
import { ShopExperience } from '@/components/shop-experience';
import { MessengerOrderLink } from '@/components/messenger-order-link';
import { storefrontMetadata } from '@/lib/metadata';
import './shop.css';

export const metadata = storefrontMetadata(
  '/shop', 'სიურპრიზის ყუთები', 'დაათვალიერე MyWonderBox-ის კოლექცია და გაეცანი ფასებს, შეფუთვის ფერებსა და რეკომენდებულ ასაკს.',
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
        <h1>სიურპრიზის ყუთები</h1>
        <MessengerOrderLink />
      </header>
      <Suspense fallback={<ShopCatalogLoading />}><ShopCatalog /></Suspense>
    </main>
  );
}
