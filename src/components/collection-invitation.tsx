import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { packagingColors, packagingDesigns, productHref } from '@/lib/packaging';
import { PackagingPhoto } from './packaging-photo';

export function CollectionInvitation() {
  return <section className="collection-invitation" aria-label="MyWonderBox-ის სიურპრიზის ყუთები">
    <h2>სიურპრიზის ყუთები</h2>
    {packagingColors.map(color => {
      const { storedSlug, title } = packagingDesigns[color];
      return <Link href={productHref(storedSlug)} key={color}>
        <PackagingPhoto color={color} /><span>{title} <ArrowUpRight size={20} aria-hidden="true" /></span>
      </Link>;
    })}
  </section>;
}
