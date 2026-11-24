import type { Product } from './types';

const media = '/brand/mywonderbox';

export const bagDesigns = {
  'mywonderbox-bag-blue': {
    title: 'ბიჭის სიურპრიზ-პარკი',
    subtitle: 'აღმოაჩინე, რა იმალება შიგნით!',
    print: 'ლურჯი',
    artwork: 'რაკეტა, თამაშის პულტი და რუბიკის კუბი',
    alt: 'MyWonderBox-ის თეთრი სასაჩუქრე პარკი ლურჯი პრინტითა და თეთრი თოკის სახელურებით',
    image: `${media}/bag-blue.webp`,
    compact: `${media}/bag-blue-compact.webp`,
    detail: `${media}/bag-blue-detail.webp`,
    detailCompact: `${media}/bag-blue-detail-compact.webp`,
    detailHeight: 1296,
  },
  'mywonderbox-bag-pink': {
    title: 'გოგოს სიურპრიზ-პარკი',
    subtitle: 'პატარა სიურპრიზი, დიდი სიხარული!',
    print: 'ვარდისფერი',
    artwork: 'პეპელა, სასახლე და ჯადოსნური ჯოხი',
    alt: 'MyWonderBox-ის თეთრი სასაჩუქრე პარკი ვარდისფერი პრინტითა და თეთრი თოკის სახელურებით',
    image: `${media}/bag-pink.webp`,
    compact: `${media}/bag-pink-compact.webp`,
    detail: `${media}/bag-pink-detail.webp`,
    detailCompact: `${media}/bag-pink-detail-compact.webp`,
    detailHeight: 1295,
  },
} as const;

export const bagSlugs = Object.keys(bagDesigns) as (keyof typeof bagDesigns)[];

export function giftBag(product: Pick<Product, 'slug'>) {
  return bagSlugs.includes(product.slug as keyof typeof bagDesigns)
    ? bagDesigns[product.slug as keyof typeof bagDesigns] : undefined;
}

export function canPurchase(product: Pick<Product, 'published' | 'stock'>) {
  return product.published && product.stock > 0;
}
