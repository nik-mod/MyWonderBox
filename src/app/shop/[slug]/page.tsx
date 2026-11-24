import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ShieldAlert, Truck } from 'lucide-react';
import { getProduct } from '@/lib/catalog';
import { storefrontMetadata } from '@/lib/metadata';
import { formatProductPrice } from '@/lib/money';
import { canPurchase, giftBag } from '@/lib/gift-bags';
import { AddToCart, PackagingLabel, ProductAvailability, ProductGallery } from '@/components/products';
import { plannedDelivery, previewContentCategories, previewSafetyNote } from '@/lib/preview-copy';
import { packagingColors, packagingDesigns, productHref } from '@/lib/packaging';
import '../shop.css';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) return { title: 'ყუთი ვერ მოიძებნა', robots: { index: false, follow: false } };
  const design = product.packaging ? packagingDesigns[product.packaging] : undefined;
  return storefrontMetadata(productHref(product.slug), product.name, product.short_description,
    product.image_url ? { url: product.image_url, alt: giftBag(product)?.alt ?? design?.alt ?? product.name } : undefined);
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
    offers: {
      '@type': 'Offer', url, priceCurrency: 'GEL', price: (product.price_minor / 100).toFixed(2),
      availability: `https://schema.org/${canPurchase(product) ? 'InStock' : 'OutOfStock'}`,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  }} />;
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const bag = giftBag(product);
  const available = canPurchase(product);
  const otherPackaging = product.packaging && packagingColors.find(color => color !== product.packaging);
  const design = product.packaging && packagingDesigns[product.packaging];
  const launchEdition = design && product.slug === design.storedSlug;
  const categories = launchEdition && product.categories.every(category => category === 'სიურპრიზის ყუთი')
    ? previewContentCategories : product.categories;

  return (
    <main className="page-shell container product-edition" id="main" data-format={bag ? 'bag' : 'box'} data-packaging={product.packaging || undefined}>
      <ProductStructuredData product={product} />
      <Link href="/shop" className="commerce-back product-back"><ChevronLeft size={16} aria-hidden="true" /> ყველა პროდუქტი</Link>
      <div className="product-detail">
        <div className="product-copy">
          <h1>{bag?.title ?? product.name}</h1>
          {!launchEdition && product.short_description && <p className="product-detail-subtitle">{product.short_description}</p>}
          <div className="product-edition-price">
            <span className="detail-price">{formatProductPrice(product)}</span>
            <ProductAvailability product={product} />
          </div>
        </div>
        <div className="product-media-column">
          <ProductGallery key={product.id} product={product} />
          {launchEdition && product.image_url === design.image && (
            <p className="product-preview-caption">შეფუთვის ილუსტრაცია</p>
          )}
          {otherPackaging && !bag && (
            <Link href={`/shop?packaging=${otherPackaging}`} className="product-other-edition">
              <span className={`shop-swatch shop-swatch--${otherPackaging}`} aria-hidden="true" />
              <span>{packagingDesigns[otherPackaging].title}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="product-info">
          {available && <div className="product-purchase"><AddToCart product={product} /><Link href="/cart" className="text-link">კალათის ნახვა <ArrowUpRight size={17} aria-hidden="true" /></Link></div>}
          {(launchEdition || bag) && product.safety_info && <p className="product-safety-note">
            <ShieldAlert size={18} aria-hidden="true" /><span>{bag ? previewSafetyNote.replace('ყუთი', 'პარკი') : previewSafetyNote}</span>
          </p>}
          <dl className="product-essential-facts">
            {categories.length > 0 && <div className="product-content-categories">
              <dt>შესაძლო შიგთავსი</dt>
              <dd>{categories.join(' · ')}</dd>
            </div>}
            {product.age_label && <div><dt>რეკომენდებული ასაკი</dt><dd>{product.age_label}</dd></div>}
            {product.dimensions && <div><dt>{bag ? 'სიგანე × სიმაღლე × ძირი' : 'ყუთის ზომა'}</dt><dd>{product.dimensions}</dd></div>}
            {bag ? <div className="product-content-categories"><dt>შეფუთვა</dt><dd>თეთრი კრაფტის ქაღალდი, თეთრი თოკის სახელურები. {bag.print} ერთფერიანი პრინტი მხოლოდ წინა მხარეს. {bag.artwork} შეფუთვის ნახატებია.</dd></div>
              : product.packaging && <div><dt>შეფუთვის ფერი</dt><dd><PackagingLabel packaging={product.packaging} /></dd></div>}
          </dl>
          <div className="notice product-launch-note">
            <p><Truck size={18} aria-hidden="true" /><span>{plannedDelivery}</span></p>
          </div>
          <div className="faq-list product-disclosures">
            <details><summary>{bag ? 'რა დაგხვდება პარკში?' : 'რა დაგხვდება ყუთში?'}</summary><div className="disclosure-body"><p>{product.description}</p></div></details>
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
