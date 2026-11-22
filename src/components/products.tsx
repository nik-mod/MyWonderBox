'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Maximize2, Package, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { packagingDesigns, productHref } from '@/lib/packaging';
import { BoxMark } from './brand';
import { PackagingPhoto } from './packaging-photo';
import { allowMotion, editorialEase, gsap, ScrollTrigger, useGSAP, wideMotion } from './motion';

export function ProductGrid({ products }: { products: Product[] }) {
  const grid = useRef<HTMLDivElement>(null);
  const listing = products.map(({ id }) => id).join(',');

  useGSAP(() => {
    const element = grid.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add(allowMotion, context => {
      const cards = Array.from(element.querySelectorAll('.product-item'));
      const revealCards = context.add('revealCards', (entries: Element[]) => {
        gsap.from(entries, {
          y: 18, opacity: .82, duration: .64, stagger: .09, ease: editorialEase,
          clearProps: 'transform,opacity',
        });
      });
      ScrollTrigger.batch(cards, {
        start: 'top 92%',
        once: true,
        interval: .08,
        batchMax: 3,
        onEnter: entries => revealCards(entries),
      });
    });
    media.add(wideMotion, () => {
      // Keep the scroll work bounded when the shop contains a large catalog.
      const images = Array.from(element.querySelectorAll('.product-image-media')).slice(0, 6);
      for (const image of images) {
        gsap.fromTo(image, { yPercent: -1 }, {
          yPercent: 1, ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: .35 },
        });
      }
    });
    return () => media.revert();
  }, { scope: grid, dependencies: [listing], revertOnUpdate: true });

  return (
    <div className="product-grid" ref={grid}>
      {products.map((product, index) => (
        <article className="product-item" key={product.id} data-packaging={product.packaging || undefined}>
          <Link href={productHref(product.slug)} className="product-image" aria-label={product.name}>
            {product.image_url ? (
              <span className="product-image-media">
                {product.packaging && product.image_url === packagingDesigns[product.packaging].image
                  ? <PackagingPhoto color={product.packaging} loading={index < 2 ? 'eager' : 'lazy'} />
                  : <img src={product.image_url} alt={product.name} width="600" height="400" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />}
              </span>
            ) : <BoxMark />}
          </Link>
          <div className="product-card-copy">
            <h3><Link href={productHref(product.slug)}>{product.name}</Link></h3>
            <div className="product-meta">
              {product.age_label && <span>{product.age_label}</span>}
              <span className="product-price">{formatMoney(product.price_minor)}</span>
            </div>
            <PackagingLabel packaging={product.packaging} />
            <Link className="button button-outline" href={productHref(product.slug)}>
              ყუთის ნახვა <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
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
  const officialPhoto = design && selected === design.image;
  useGSAP(() => {
    if (!inspecting || !window.matchMedia(allowMotion).matches) return;
    gsap.from('.product-photo-dialog-body', {
      y: 12, opacity: .72, duration: .36, ease: editorialEase, clearProps: 'transform,opacity',
    });
  }, { scope: dialog, dependencies: [inspecting], revertOnUpdate: true });

  return (
    <div className="product-gallery">
      {selected ? (
        <button className="main-product-image product-photo-zoom" type="button" aria-label="ფოტოს გადიდება" onClick={() => {
          dialog.current?.showModal();
          setInspecting(true);
        }}>
          {officialPhoto && product.packaging
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
              <img src={image === design?.image ? design.compact : image}
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
          {inspecting && selected && <img src={selected} alt={officialPhoto && design ? design.alt : product.name} decoding="async" />}
        </div>
      </dialog>
    </div>
  );
}
