import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ShieldAlert, Truck } from 'lucide-react';
import { getProduct } from '@/lib/catalog';
import { storefrontMetadata } from '@/lib/metadata';
import { formatMoney } from '@/lib/money';
import { PackagingLabel, ProductGallery } from '@/components/products';
import { MessengerOrderLink } from '@/components/messenger-order-link';
import { plannedDelivery, previewContentCategories, previewSafetyNote } from '@/lib/preview-copy';
import { packagingColors, packagingDesigns, productHref } from '@/lib/packaging';
import '../shop.css';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) return { title: 'ყუთი ვერ მოიძებნა', robots: { index: false, follow: false } };
  const design = product.packaging ? packagingDesigns[product.packaging] : undefined;
  return storefrontMetadata(productHref(product.slug), product.name, product.short_description,
    product.image_url ? { url: product.image_url, alt: design?.alt ?? product.name } : undefined);
}

async function ProductStructuredData({ product }: { product: NonNullable<Awaited<ReturnType<typeof getProduct>>> }) {
  const domain = process.env.NEXT_PUBLIC_SITE_URL;
  if (!domain) return null;
  const url = new URL(productHref(product.slug), domain).href;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    ...(product.image_url && { image: new URL(product.image_url, domain).href }),
    url,
    brand: { '@type': 'Brand', name: 'MyWonderBox' },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  }} />;
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const otherPackaging = product.packaging && packagingColors.find(color => color !== product.packaging);
  const design = product.packaging && packagingDesigns[product.packaging];
  const launchEdition = design && product.slug === design.storedSlug;
  const categories = launchEdition && product.categories.every(category => category === 'სიურპრიზის ყუთი')
    ? previewContentCategories : product.categories;

  return (
    <main className="page-shell container product-edition" id="main">
      <ProductStructuredData product={product} />
      <Link href="/shop" className="commerce-back product-back"><ChevronLeft size={16} aria-hidden="true" /> ყველა ყუთი</Link>
      <div className="product-detail">
        <div className="product-media-column">
          <ProductGallery key={product.id} product={product} />
          {launchEdition && product.image_url === design.image && (
            <p className="product-preview-caption">შეფუთვის ილუსტრაცია</p>
          )}
          {otherPackaging && (
            <Link href={`/shop?packaging=${otherPackaging}`} className="product-other-edition">
              <span className={`shop-swatch shop-swatch--${otherPackaging}`} aria-hidden="true" />
              <span>{packagingDesigns[otherPackaging].title}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="product-copy">
          <h1>{product.name}</h1>
          <div className="product-edition-price">
            <span className="detail-price">{formatMoney(product.price_minor)}</span>
            <MessengerOrderLink />
          </div>
          {launchEdition && product.safety_info && <p className="product-safety-note">
            <ShieldAlert size={18} aria-hidden="true" /><span>{previewSafetyNote}</span>
          </p>}
          {!launchEdition && product.short_description && <p>{product.short_description}</p>}
          <dl className="product-essential-facts">
            {categories.length > 0 && <div className="product-content-categories">
              <dt>შესაძლო შიგთავსი</dt>
              <dd>{categories.join(' · ')}</dd>
            </div>}
            {product.age_label && <div><dt>რეკომენდებული ასაკი</dt><dd>{product.age_label}</dd></div>}
            {product.dimensions && <div><dt>ყუთის ზომა</dt><dd>{product.dimensions}</dd></div>}
            {product.packaging && <div><dt>შეფუთვის ფერი</dt><dd><PackagingLabel packaging={product.packaging} /></dd></div>}
          </dl>
          <div className="notice product-launch-note">
            <p><Truck size={18} aria-hidden="true" /><span>{plannedDelivery}</span></p>
          </div>
          <div className="faq-list product-disclosures">
            <details><summary>რა დაგხვდება ყუთში?</summary><div className="disclosure-body"><p>{product.description}</p></div></details>
            {product.safety_info && <details><summary>უსაფრთხოება და გამოყენება</summary><div className="disclosure-body"><p>{product.safety_info}</p></div></details>}
          </div>
          <nav className="product-policy-links" aria-label="შეკვეთის პირობები">
            <Link className="text-link" href="/delivery">მიწოდების პირობები</Link>
            <Link className="text-link" href="/returns">დაბრუნების პირობები</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
