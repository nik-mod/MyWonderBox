import { brandCopy } from './brand-copy';
import type { Packaging, Product } from './types';

export const packagingDesigns = {
  'navy-yellow': {
    title: 'ყუთი ბიჭებისთვის',
    productName: 'MyWonderBox — ბიჭებისთვის',
    label: 'მუქი ლურჯი და ყვითელი',
    alt: 'MyWonderBox-ის მუქი ლურჯი სიურპრიზის ყუთი ყვითელი ლენტითა და რაკეტის ნახატით',
    storedSlug: 'joybox-navy',
    slug: 'mywonderbox-blue',
    image: '/brand/mywonderbox/box-blue.webp',
    compact: '/brand/mywonderbox/box-blue-compact.webp',
    detail: '/brand/mywonderbox/box-blue-detail.webp',
    detailCompact: '/brand/mywonderbox/box-blue-detail-compact.webp',
    detailSize: [1254, 1254],
  },
  'pink-berry': {
    title: 'ყუთი გოგონებისთვის',
    productName: 'MyWonderBox — გოგოებისთვის',
    label: 'ვარდისფერი და მუქი ვარდისფერი',
    alt: 'MyWonderBox-ის ვარდისფერი სიურპრიზის ყუთი მუქი ვარდისფერი ლენტით, პეპლისა და სასახლის ნახატებით',
    storedSlug: 'joybox-berry',
    slug: 'mywonderbox-pink',
    image: '/brand/mywonderbox/box-pink.webp',
    compact: '/brand/mywonderbox/box-pink-compact.webp',
    detail: '/brand/mywonderbox/box-pink-detail.webp',
    detailCompact: '/brand/mywonderbox/box-pink-detail-compact.webp',
    detailSize: [1440, 960],
  },
} as const satisfies Record<Packaging, object>;

export const packagingColors = Object.keys(packagingDesigns) as Packaging[];
const editions = Object.values(packagingDesigns);

export function storedProductSlug(slug: string) {
  return editions.find(edition => edition.slug === slug)?.storedSlug ?? slug;
}

export function productHref(slug: string) {
  return `/shop/${editions.find(edition => edition.storedSlug === slug)?.slug ?? slug}`;
}

export function catalogProduct(product: Product): Product {
  const color = packagingColors.find(key => packagingDesigns[key].storedSlug === product.slug);
  const edition = color && (!product.packaging || color === product.packaging) ? packagingDesigns[color] : undefined;
  return {
    ...product,
    name: edition?.productName ?? brandCopy(product.name),
    description: brandCopy(product.description ?? ''),
    short_description: brandCopy(product.short_description ?? ''),
    ...(edition && { packaging: color, image_url: edition.image, images: [edition.detail] }),
  };
}

export function readPackaging(value: unknown): Packaging | '' {
  return value === 'navy-yellow' || value === 'pink-berry' ? value : '';
}
