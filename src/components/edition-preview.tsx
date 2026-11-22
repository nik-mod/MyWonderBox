'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { packagingDesigns, productHref } from '@/lib/packaging';
import { PackagingPhoto } from './packaging-photo';

const editions = [
  { color: 'navy-yellow' as const, name: 'ბიჭებისთვის' },
  { color: 'pink-berry' as const, name: 'გოგონებისთვის' },
];

/** A real product choice, with the photography and destination kept in sync. */
export function EditionPreview() {
  const [selected, setSelected] = useState(0);
  const active = editions[selected];
  const href = productHref(packagingDesigns[active.color].storedSlug);
  return <div className="edition-preview" data-edition={selected}>
    <div className="edition-preview-tabs" role="group" aria-label="ყუთის არჩევა">
      {editions.map((edition, index) => <button key={edition.color} type="button" aria-pressed={selected === index}
        onClick={() => setSelected(index)}><span className={`edition-dot edition-dot-${index}`} aria-hidden="true" />{edition.name}</button>)}
    </div>
    <Link className="edition-preview-photo" href={href} aria-label={`ყუთი ${active.name}`}>
      {editions.map((edition, index) => <span key={edition.color} aria-hidden={index !== selected}>
        <PackagingPhoto color={edition.color} loading={index === 0 ? 'eager' : 'lazy'} />
      </span>)}
    </Link>
    <div className="edition-preview-caption"><Link href={href}>ყუთის ნახვა <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
  </div>;
}
