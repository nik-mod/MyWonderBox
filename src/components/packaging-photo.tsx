import { packagingDesigns } from '@/lib/packaging';
import { giftBag } from '@/lib/gift-bags';
import type { Packaging, Product } from '@/lib/types';

export function PackagingPhoto({ color, loading = 'lazy' }: {
  color: Packaging; loading?: 'lazy' | 'eager';
}) {
  const design = packagingDesigns[color];
  return (
    <picture>
      <source media="(max-width: 740px)" srcSet={design.compact} />
      <img src={design.image} alt={design.alt} width={1440} height={960} loading={loading} decoding="async" />
    </picture>
  );
}

export function ProductThumbnail({ product, decorative = false }: { product: Product; decorative?: boolean }) {
  const bag = giftBag(product);
  if (bag && product.image_url === bag.image) {
    return <img src={bag.compact} alt={decorative ? '' : bag.alt} width={100} height={100} loading="lazy" decoding="async" />;
  }
  const design = product.packaging ? packagingDesigns[product.packaging] : undefined;
  const official = design?.image === product.image_url;
  return <img src={official ? design.compact : product.image_url}
    alt={decorative ? '' : official ? design.alt : product.name} width={100} height={67} loading="lazy" decoding="async" />;
}

export function GiftBagPhoto({ product, src = product.image_url, loading = 'lazy' }: {
  product: Product; src?: string; loading?: 'lazy' | 'eager';
}) {
  const bag = giftBag(product);
  const detail = !!bag && src === bag.detail;
  const approved = !!bag && (src === bag.image || detail);
  return <picture>
    {approved && <source media="(max-width: 740px)" srcSet={detail ? bag.detailCompact : bag.compact} />}
    <img src={src} alt={approved ? bag.alt : product.name} width={detail ? 1213 : 1254}
      height={detail ? bag.detailHeight : 1254} loading={loading} decoding="async" />
  </picture>;
}
