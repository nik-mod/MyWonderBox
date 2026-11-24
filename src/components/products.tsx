'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Maximize2, Package, ShoppingBag, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatProductPrice } from '@/lib/money';
import { canPurchase, giftBag } from '@/lib/gift-bags';
import { packagingDesigns, productHref } from '@/lib/packaging';
import { BoxMark } from './brand';
import { GiftBagPhoto, PackagingPhoto } from './packaging-photo';
import { useCart } from './cart-context';
import './product-cards.css';

export function ProductAvailability({ product }: { product: Product }) {
  const available = canPurchase(product);
  return <span className="product-availability" data-available={available}>{available ? 'მარაგშია' : 'მალე გაყიდვაში'}</span>;
}

export function AddToCart({ product }: { product: Product }) {
  const { add, lines, ready } = useCart();
  const quantity = lines.find(line => line.product.id === product.id)?.quantity ?? 0;
  const atLimit = quantity >= Math.min(product.stock, 99);
  if (!canPurchase(product)) return null;
  return <button type="button" className="button button-navy add-to-cart" disabled={!ready || atLimit}
    onClick={() => add(product)}>
    <ShoppingBag size={18} aria-hidden="true" /> {atLimit ? 'ხელმისაწვდომი მარაგი კალათაშია' : 'კალათაში დამატება'}
  </button>;
}

export function ProductGrid({ products, eager = true }: { products: Product[]; eager?: boolean }) {
  return (
    <div className="product-grid">
      {products.map((product, index) => {
        const bag = giftBag(product);
        const loading = eager && index < 2 ? 'eager' : 'lazy';
        return <article className="product-item" key={product.id} data-packaging={product.packaging || undefined}
          data-format={bag ? 'bag' : 'box'}>
          <Link href={productHref(product.slug)} className="product-image" aria-label={product.name}>
            {product.image_url ? (
              <span className="product-image-media">
                {bag ? <GiftBagPhoto product={product} loading={loading} />
                  : product.packaging && product.image_url === packagingDesigns[product.packaging].image
                    ? <PackagingPhoto color={product.packaging} loading={loading} />
                    : <img src={product.image_url} alt={product.name} width="600" height="400" loading={loading} decoding="async" />}
              </span>
            ) : <BoxMark />}
          </Link>
          <div className="product-card-copy">
            <h3><Link href={productHref(product.slug)}>{bag?.title ?? product.name}</Link></h3>
            {bag && <p className="product-card-subtitle">{product.short_description}</p>}
            {!bag && product.age_label && <p className="product-card-subtitle">{product.age_label}</p>}
            <div className="product-meta">
              <span className="product-price">{formatProductPrice(product)}</span>
              <ProductAvailability product={product} />
            </div>
            <div className="product-card-actions">
              <AddToCart product={product} />
              <Link className="text-link product-detail-link" href={productHref(product.slug)}>
                {bag ? 'პარკის ნახვა' : 'ყუთის ნახვა'} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>;
      })}
    </div>
  );
}
export function PackagingLabel({ packaging }: { packaging: Product['packaging'] }) {
  if (!packaging) return null;
  return <span className={`packaging-label ${packaging === 'pink-berry' ? 'berry' : ''}`}>
    {packagingDesigns[packaging].label}
  </span>;
}

export function ProductGallery({ product }: { product: Product }) {
  const images = Array.from(new Set([product.image_url, ...product.images].filter(Boolean)));
  const [selection, setSelection] = useState(images[0]);
  const [inspecting, setInspecting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = images.includes(selection) ? selection : images[0];
  const design = product.packaging ? packagingDesigns[product.packaging] : undefined;
  const bag = giftBag(product);
  const officialPhoto = design && selected === design.image;
  return (
    <div className="product-gallery">
      {selected ? (
        <button className="main-product-image product-photo-zoom" type="button" aria-label="ფოტოს გადიდება" onClick={() => {
          dialog.current?.showModal();
          setInspecting(true);
        }}>
          {bag ? <GiftBagPhoto product={product} src={selected} loading="eager" /> : officialPhoto && product.packaging
            ? <PackagingPhoto color={product.packaging} loading="eager" />
            : <img key={selected} src={selected} alt={product.name} width="900" height="600" decoding="async" />}
          <span className="product-photo-zoom-icon"><Maximize2 size={20} aria-hidden="true" /></span>
        </button>
      ) : <div className="main-product-image"><Package size={90} aria-hidden="true" /></div>}
      {images.length > 1 && (
        <div className="product-thumbs">
          {images.map((image, index) => (
            <button type="button" key={image} className={selected === image ? 'selected' : ''}
              aria-label={`ფოტო ${index + 1}`} aria-pressed={selected === image} onClick={() => setSelection(image)}>
              <img src={bag && image === bag.image ? bag.compact : bag && image === bag.detail ? bag.detailCompact : image === design?.image ? design.compact : image}
                alt="" width="75" height="75" decoding="async" />
            </button>
          ))}
        </div>
      )}
      <dialog ref={dialog} className="product-photo-dialog" aria-label={product.name}
        onClose={() => setInspecting(false)} onClick={event => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
        <div className="product-photo-dialog-body">
          <button className="product-photo-close" type="button" aria-label="ფოტოს დახურვა" autoFocus
            onClick={() => dialog.current?.close()}><X size={24} aria-hidden="true" /></button>
          {inspecting && selected && <img src={selected} alt={bag?.alt ?? (officialPhoto && design ? design.alt : product.name)} decoding="async" />}
        </div>
      </dialog>
    </div>
  );
}
