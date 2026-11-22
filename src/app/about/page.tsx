import { storefrontMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { ArrowUpRight, Gift, ScanEye, ShieldCheck } from 'lucide-react';
import { EditionPreview } from '@/components/edition-preview';
import '@/components/editorial-pages.css';
export const metadata = storefrontMetadata('/about', 'ჩვენ შესახებ', 'გაიცანი MyWonderBox, ქართული სიურპრიზის ყუთების ბრენდი ბავშვებისთვის.');
export default function AboutPage() {
 return <main className="page-shell container about-edition" id="main">
  <section className="about-lead">
   <div className="about-lead-copy"><h1>ჩვენ შესახებ</h1><p>MyWonderBox ბავშვებისთვის განკუთვნილი სიურპრიზის ყუთია.</p><Link className="button button-yellow" href="/how-it-works">როგორ მუშაობს? <ArrowUpRight size={19} aria-hidden="true" /></Link></div>
   <EditionPreview />
  </section>
  <section className="about-principles">
   <article><Gift aria-hidden="true"/><h2>შიგთავსი</h2><p>ყუთის ზუსტი შიგთავსი გახსნამდე სიურპრიზად რჩება.</p></article>
   <article><ScanEye aria-hidden="true"/><h2>რეკომენდებული ასაკი</h2><p>4–10 წელი.</p></article>
   <article><ShieldCheck aria-hidden="true"/><h2>უსაფრთხოება</h2><p>თამაშამდე შეამოწმე თითოეული ნივთის ასაკობრივი ნიშნული.</p></article>
  </section>
  <section className="about-closing">
   <picture className="about-paired-photo">
    <source media="(max-width: 740px)" srcSet="/brand/mywonderbox/lifestyle-compact.webp" />
    <img src="/brand/mywonderbox/lifestyle.webp" width={1536} height={645} loading="lazy" decoding="async"
      alt="MyWonderBox-ის ლურჯი და ვარდისფერი ყუთები სათამაშოებით მოწყობილ ოთახში" />
   </picture>
   <div><Link className="text-link" href="/shop">ყუთების ნახვა <ArrowUpRight size={20} aria-hidden="true" /></Link></div>
  </section>
 </main>;
}
