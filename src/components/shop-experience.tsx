'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowDownUp, ArrowUpRight, Check, ChevronDown, Clock3, Package, Search, SlidersHorizontal, X } from 'lucide-react';
import { packagingColors, packagingDesigns, readPackaging } from '@/lib/packaging';
import type { Packaging, Product } from '@/lib/types';
import { BoxMark } from './brand';
import { PackagingPhoto } from './packaging-photo';
import { ProductGrid } from './products';

const sortOptions = [
  { value: '', label: 'რეკომენდებული' },
  { value: 'price-up', label: 'ფასი ზრდადობით' },
  { value: 'price-down', label: 'ფასი კლებადობით' },
];
const reset = { packaging: '', age: '', sort: '', q: '' };
type FilterKey = keyof typeof reset;

function updateQuery(values: Partial<typeof reset>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.search !== window.location.search) window.history.pushState(null, '', url);
}

function Swatch({ color }: { color: Packaging }) {
  return <span className={`shop-swatch shop-swatch--${color}`} aria-hidden="true" />;
}

function PreviewInfo({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="shop-info" data-open={open}>
      <h3><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {title}<ChevronDown size={17} aria-hidden="true" />
      </button></h3>
      <div className="shop-info-reveal" id={id} inert={!open}>
        <div className="shop-info-clip"><div className="shop-info-content">{children}</div></div>
      </div>
    </div>
  );
}

function PackagingPreview({ color }: { color: Packaging }) {
  const design = packagingDesigns[color];
  return (
    <section className="shop-preview" aria-labelledby="preview-title">
      <div className="shop-preview-controls">
        <span id="shop-preview-filter" className="shop-control-label"><SlidersHorizontal size={16} aria-hidden="true" /> აირჩიე ყუთი</span>
        <div className="shop-color-picker" role="group" aria-labelledby="shop-preview-filter">
          {packagingColors.map(option => (
            <button type="button" key={option} aria-pressed={color === option} onClick={() => updateQuery({ packaging: option })}>
              <Swatch color={option} />{packagingDesigns[option].title}
              <Check size={16} className="shop-choice-check" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="shop-preview-stage" data-packaging={color}>
        <div className="shop-preview-media">
          {packagingColors.map(option => (
            <div className="shop-preview-frame" data-selected={color === option} aria-hidden={color !== option} key={option}>
              <PackagingPhoto color={option} loading="eager" />
            </div>
          ))}
        </div>
        <div className="shop-preview-copy">
          <div className="shop-preview-selection" role="status">
            <div className="shop-preview-identity" key={color}>
              <h2 id="preview-title">{design.title}</h2>
              <p>{design.label}</p>
            </div>
          </div>
          <div className="shop-preview-notice">
            <Clock3 size={19} aria-hidden="true" />
            <p>ფასები და რეკომენდებული ასაკი კოლექციის გამოქვეყნებისას გამოჩნდება.</p>
          </div>
          <div className="shop-preview-info">
            <PreviewInfo title="შეფუთვის შესახებ">
              <dl><dt>ზომა</dt><dd>22 × 20 × 9 სმ</dd><dt>მასალა</dt><dd>მუყაო</dd></dl>
            </PreviewInfo>
            <PreviewInfo title="როგორ მუშაობს MyWonderBox?">
              <p>აირჩიე ყუთი ასაკისა და ინტერესების მიხედვით. ზუსტი შიგთავსი გახსნამდე სიურპრიზად რჩება.</p>
              <Link href="/how-it-works" className="shop-inline-link">გაიგე მეტი <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </PreviewInfo>
          </div>
        </div>
      </div>
    </section>
  );
}

type MenuName = 'filters' | 'sort';

function ShopMenu({ name, open, label, indicator, onToggle, children }: {
  name: MenuName; open: boolean; label: string; indicator?: number; onToggle: () => void; children: ReactNode;
}) {
  const id = useId();
  const Icon = name === 'filters' ? SlidersHorizontal : ArrowDownUp;
  return (
    <div className="shop-menu" data-menu={name}>
      <button type="button" className="shop-menu-trigger" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span>
        {Boolean(indicator) && <span className="shop-filter-count">{indicator}</span>}
        <ChevronDown size={16} className="shop-menu-chevron" aria-hidden="true" />
      </button>
      <div className={`shop-menu-panel shop-menu-panel--${name}`} id={id} data-open={open} inert={!open}>
        {children}
      </div>
    </div>
  );
}

function Catalog({ products, params }: { products: Product[]; params: Pick<URLSearchParams, 'get'> }) {
  const query = (params.get('q') ?? '').trim().slice(0, 80);
  const packaging = readPackaging(params.get('packaging'));
  const sort = sortOptions.find(option => option.value === params.get('sort')) ?? sortOptions[0];
  const ages = Array.from(new Set(products.map(({ age_label }) => age_label.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'ka', { numeric: true }));
  const age = (params.get('age') ?? '').slice(0, 80);
  const visibleAges = age && !ages.includes(age) ? [...ages, age] : ages;
  const colors = packagingColors.filter(color => color === packaging || products.some(product => product.packaging === color));
  const [draft, setDraft] = useState(query);
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(query); }, [query]);

  useEffect(() => {
    if (!openMenu) return;
    const menu = controls.current?.querySelector(`[data-menu="${openMenu}"]`);
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !menu?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      menu?.querySelector<HTMLButtonElement>('button')?.focus();
      setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  const terms = query.toLocaleLowerCase('ka').split(/\s+/).filter(Boolean);
  const displayed = products.filter(product => {
    if ((packaging && product.packaging !== packaging) || (age && product.age_label.trim() !== age)) return false;
    if (!terms.length) return true;
    const searchable = [product.name, product.short_description, ...product.categories].join(' ').toLocaleLowerCase('ka');
    return terms.every(term => searchable.includes(term));
  });
  if (sort.value === 'price-up') displayed.sort((a, b) => a.price_minor - b.price_minor);
  if (sort.value === 'price-down') displayed.sort((a, b) => b.price_minor - a.price_minor);

  const chips: { key: FilterKey; label: string }[] = [];
  if (query) chips.push({ key: 'q', label: `„${query}“` });
  if (packaging) chips.push({ key: 'packaging', label: packagingDesigns[packaging].title });
  if (age) chips.push({ key: 'age', label: age });
  const facetCount = Number(Boolean(packaging)) + Number(Boolean(age));
  const clear = () => {
    setDraft('');
    updateQuery(reset);
    search.current?.focus({ preventScroll: true });
  };

  return (
    <section className="shop-catalog" aria-label="ყუთების კატალოგი">
      <div className="shop-quick-filters" role="group" aria-label="აირჩიე ყუთის ტიპი">
        <button type="button" aria-pressed={!packaging} onClick={() => updateQuery({ packaging: '' })}>ყველა</button>
        {colors.map(color => <button type="button" key={color} aria-pressed={packaging === color} onClick={() => updateQuery({ packaging: color })}>
          <Swatch color={color} />{packagingDesigns[color].title.replace('ყუთი ', '')}
        </button>)}
      </div>
      <div className="shop-catalog-controls" ref={controls}>
        <form className="shop-search" role="search" onSubmit={event => {
          event.preventDefault();
          updateQuery({ q: draft.trim().slice(0, 80) });
        }}>
          <Search size={19} aria-hidden="true" />
          <input ref={search} type="search" aria-label="ყუთების ძიება" placeholder="მოძებნე ყუთი" value={draft}
            maxLength={80} onChange={event => setDraft(event.target.value)} autoComplete="off" />
          <button type="submit">ძიება</button>
        </form>
        <ShopMenu name="filters" open={openMenu === 'filters'} label="ფილტრები" indicator={facetCount}
          onToggle={() => setOpenMenu(openMenu === 'filters' ? null : 'filters')}>
          {colors.length > 0 && <fieldset>
            <legend>ყუთის ტიპი</legend>
            <label className="shop-option"><input type="radio" name="shop-color" checked={!packaging} onChange={() => updateQuery({ packaging: '' })} /> ყველა ყუთი</label>
            {colors.map(color => <label className="shop-option" key={color}>
              <input type="radio" name="shop-color" checked={color === packaging} onChange={() => updateQuery({ packaging: color })} />
              <Swatch color={color} /> {packagingDesigns[color].title}
            </label>)}
          </fieldset>}
          {visibleAges.length > 0 && <fieldset>
            <legend>რეკომენდებული ასაკი</legend>
            <label className="shop-option"><input type="radio" name="shop-age" checked={!age} onChange={() => updateQuery({ age: '' })} /> ნებისმიერი ასაკი</label>
            {visibleAges.map(option => <label className="shop-option" key={option}>
              <input type="radio" name="shop-age" checked={option === age} onChange={() => updateQuery({ age: option })} /> {option}
            </label>)}
          </fieldset>}
        </ShopMenu>
        <ShopMenu name="sort" open={openMenu === 'sort'} label={sort.value ? sort.label : 'დალაგება'}
          onToggle={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}>
          <fieldset>
            <legend>ყუთების დალაგება</legend>
            {sortOptions.map(option => <label className="shop-option" key={option.value}>
              <input type="radio" name="shop-sort" checked={option.value === sort.value} onChange={() => updateQuery({ sort: option.value })} /> {option.label}
            </label>)}
          </fieldset>
        </ShopMenu>
      </div>
      <div className="shop-results-bar">
        <p className="shop-results-count" role="status">{displayed.length} ყუთი</p>
        {chips.length > 0 && <ul className="shop-active-filters" aria-label="არჩეული ფილტრები">
          {chips.map(({ key, label }) => <li key={key}>
            <button type="button" aria-label={`${label} — ფილტრის მოხსნა`} onClick={() => {
              updateQuery({ [key]: '' });
              search.current?.focus({ preventScroll: true });
            }}>{label}<X size={14} aria-hidden="true" /></button>
          </li>)}
        </ul>}
        {(chips.length > 0 || sort.value) && <button type="button" className="shop-clear" onClick={clear}>გასუფთავება</button>}
      </div>
      <div className="shop-results">
        {displayed.length ? <ProductGrid products={displayed} /> : (
          <div className="shop-no-results">
            <BoxMark />
            <div><h2>ამ ფილტრებით ყუთი ვერ მოიძებნა</h2><p>შეცვალე საძიებო სიტყვა ან მოხსენი ფილტრები.</p></div>
            <button type="button" className="button button-navy" onClick={clear}><Package size={17} aria-hidden="true" /> ყველა ყუთის ნახვა</button>
          </div>
        )}
      </div>
    </section>
  );
}

export function ShopExperience({ products }: { products: Product[] }) {
  const params = useSearchParams();
  return products.length ? <Catalog products={products} params={params} /> : <PackagingPreview color={readPackaging(params.get('packaging')) || 'navy-yellow'} />;
}
