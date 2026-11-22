import { packagingDesigns } from '@/lib/packaging';
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
  const design = product.packaging ? packagingDesigns[product.packaging] : undefined;
  const official = design?.image === product.image_url;
  return <img src={official ? design.compact : product.image_url}
    alt={decorative ? '' : official ? design.alt : product.name} width={100} height={67} loading="lazy" decoding="async" />;
}
