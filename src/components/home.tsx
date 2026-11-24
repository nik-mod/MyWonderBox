'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight, PackageCheck, Gift, Truck } from 'lucide-react';
import type { Product } from '@/lib/types';
import { HowFilm } from './how-film';
import { PackagingShowcase } from './packaging-showcase';
import { StoryPlayroom } from './story-playroom';
import { useHomeMotion } from './home-motion';
import { messengerOrdering, plannedDelivery } from '@/lib/preview-copy';
import { giftBag } from '@/lib/gift-bags';
import { ProductGrid } from './products';
import './home-cinema.css';

export function Home({ products }: { products: Product[] }) {
  const root = useRef<HTMLElement>(null);
  useHomeMotion(root);
  const bags = products.filter(product => giftBag(product));

  return (
    <main id="main" ref={root} className="home-v2">
      <div className="hero-bear-track">
      <section className="hero hero-cinema">
        <div className="hero-lens" aria-hidden="true">
          <div className="hero-photo">
            <picture>
              <source media="(max-width: 850px)" srcSet="/brand/hero-teddy/opening-compact.webp" />
              <img src="/brand/hero-teddy/opening.webp" width={1672} height={941} alt="" fetchPriority="high" />
            </picture>
            <canvas className="hero-bear" width={1} height={1} />
          </div>
        </div>
        <div className="hero-exposure" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content container">
          <div className="hero-copy">
            <h1 className="hero-title">
              <span className="hero-title-line"><span className="hero-title-reveal">პატარა ყუთი.</span></span>{' '}
              <span className="hero-title-line"><span className="hero-title-reveal">დიდი <em>სიხარული.</em></span></span>
            </h1>
            <p>სიურპრიზ-პარკები და ყუთები ბავშვებისთვის.</p>
            <div className="hero-action">
              <Link className="button button-yellow" href="/shop">კოლექციის ნახვა <ArrowRight size={22} /></Link>
              <Link className="hero-chapter-link" href="/how-it-works" prefetch={false}><ArrowUpRight size={16} aria-hidden="true" /> როგორ მუშაობს?</Link>
            </div>
          </div>
        </div>
        <div className="hero-shutter" aria-hidden="true" />
      </section>
      </div>

      {bags.length > 0 && <section className="bag-collection" aria-labelledby="bag-collection-title">
        <div className="container">
          <div className="collection-intro">
            <h2 id="bag-collection-title">სიურპრიზ-პარკები</h2>
            <Link href="/shop" className="text-link">ყველა პროდუქტი <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <ProductGrid products={bags} eager={false} />
        </div>
      </section>}

      <HowFilm />

      <PackagingShowcase products={products} />

      <StoryPlayroom />

      <section className="why-section why-edition container" aria-labelledby="why-mywonderbox">
        <div className="section-heading"><Gift size={46} strokeWidth={1.25} aria-hidden="true" /><h2 id="why-mywonderbox">ყუთის არჩევამდე</h2></div>
        <ul>
          <li><PackageCheck aria-hidden="true" /><div><h3>ასაკი და უსაფრთხოება</h3><p>ყუთები რეკომენდებულია 4–10 წლის ბავშვებისთვის. უსაფრთხოების მითითებები ყუთის გვერდზე ნახე.</p><Link href="/shop" className="benefit-link">ყუთების ნახვა <ArrowUpRight size={18} aria-hidden="true" /></Link></div></li>
          <li><Truck aria-hidden="true" /><div><h3>მიწოდება</h3><p>{plannedDelivery}</p><Link href="/delivery" className="benefit-link">მიწოდების პირობები <ArrowUpRight size={18} aria-hidden="true" /></Link></div></li>
        </ul>
      </section>

      <section className="faq-home faq-edition container">
        <div className="section-heading">
          <h2>ხშირად დასმული კითხვები</h2>
          <Link href="/faq" className="text-link">ყველა კითხვა <ArrowRight size={19} /></Link>
        </div>
        <div className="faq-list">
          <details><summary>რა არის MyWonderBox?</summary><p>ჩემი ვანდერბოქსი ბავშვებისთვის განკუთვნილი სიურპრიზის ყუთია, რომელშიც სათამაშოები, თამაშები და შემოქმედებითი ნივთები დაგხვდება.</p></details>
          <details><summary>წინასწარ მეცოდინება, რა არის ყუთში?</summary><p>ზუსტი შიგთავსი სიურპრიზად რჩება. ყუთის აღწერაში ნახავ ნივთების კატეგორიებს, ასაკობრივ რეკომენდაციასა და უსაფრთხოების ინფორმაციას.</p></details>
          <details><summary>როგორ შევუკვეთო?</summary><p>{messengerOrdering}</p></details>
        </div>
      </section>

      <section className="home-final final-edition">
        <div className="container final-composition">
          <Link className="button button-yellow" href="/shop">ყუთების ნახვა <ArrowRight size={20} aria-hidden="true" /></Link>
          <img src="/brand/mywonderbox/duo.webp" className="final-brand-art" width={1774} height={887}
            srcSet="/brand/mywonderbox/duo-compact.webp 720w, /brand/mywonderbox/duo.webp 1774w"
            sizes="(max-width: 630px) 90vw, (max-width: 1500px) 52vw, 720px"
            alt="MyWonderBox-ის ლურჯი და ვარდისფერი სიურპრიზის ყუთები" loading="lazy" decoding="async" />
        </div>
      </section>
    </main>
  );
}
