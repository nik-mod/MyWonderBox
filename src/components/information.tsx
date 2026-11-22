import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Truck, RotateCcw, LockKeyhole, BookOpen } from 'lucide-react';
import { getSettings } from '@/lib/catalog';
import { CollectionInvitation } from './collection-invitation';
import { plannedDelivery, previewReturnsStatus } from '@/lib/preview-copy';
import './editorial-pages.css';

const policies = {
  delivery: {
    label: 'მიწოდება', icon: Truck, heading: null, question: 'faq-delivery',
    preview: [plannedDelivery],
  },
  returns: {
    label: 'დაბრუნება', icon: RotateCcw, heading: 'დაბრუნების პირობები', question: 'faq-returns',
    preview: [previewReturnsStatus],
  },
  privacy: {
    label: 'კონფიდენციალურობა', icon: LockKeyhole, heading: 'მონაცემები კატალოგის დათვალიერებისას', question: 'faq-account',
    preview: [
      'კატალოგის დათვალიერება ანგარიშის გარეშე შეგიძლია. შეკვეთებს Messenger-ში ვიღებთ.',
      'თუ დაგვირეკავ ან მოგვწერ, საკონტაქტო ინფორმაციას და შეკითხვის დეტალებს პასუხის გასაცემად გამოვიყენებთ. გაგვიზიარე მხოლოდ ის მონაცემები, რომლებიც პასუხისთვის გვჭირდება.',
      'ვებგვერდის მუშაობისა და უსაფრთხოებისთვის ჰოსტინგის სერვისმა შეიძლება დაამუშაოს ტექნიკური მონაცემები, მაგალითად IP მისამართი და მოთხოვნის დრო.',
      'შენ მიერ მოწოდებულ მონაცემებზე ინფორმაციის მისაღებად ან მათი გასწორების ან წაშლის მოსათხოვად დაგვიკავშირდი.',
    ],
  },
  terms: {
    label: 'წესები და პირობები', icon: BookOpen, heading: 'კატალოგით სარგებლობა', question: 'faq-ordering',
    preview: [
      'ვებგვერდზე შეგიძლია გაეცნო ყუთებს, ფასებსა და ასაკობრივ რეკომენდაციებს. შეკვეთებს Messenger-ში ვიღებთ.',
      'ფასები მითითებულია ლარში. პროდუქტის გვერდზე მოცემული შეფუთვის ვიზუალიზაცია დიზაინს ასახავს. ვიდეოში ნაჩვენები ნივთები შიგთავსის ილუსტრაციული მაგალითებია. ზუსტი შიგთავსი შეიძლება განსხვავდებოდეს.',
      'შეკვეთის დადასტურებამდე Messenger-ში დააზუსტე გადახდის, მიწოდებისა და დაბრუნების პირობები.',
    ],
  },
} as const;

export async function PolicyPage({ policy, title }: { policy: keyof typeof policies; title: string }) {
  const settings = await getSettings();
  const savedPolicy = policy === 'delivery' ? undefined : settings.policies[policy]?.trim();
  const { icon: Icon, heading, question, preview } = policies[policy];
  const paragraphs = savedPolicy ? savedPolicy.split(/\n\s*\n/) : preview;

  return (
    <main className="page-shell container information-edition information-reading" id="main">
      <header className={`page-header policy-hero policy-hero-${policy}`}>
        <h1>{title}</h1>
        <Icon className="policy-symbol" size={112} strokeWidth={1.15} aria-hidden="true" />
      </header>
      <div className="information-layout">
        <aside className="information-aside">
          <nav aria-label="ინფორმაცია შეძენამდე">
            {Object.entries(policies).map(([key, entry]) => (
              <Link key={key} href={`/${key}`} aria-current={policy === key ? 'page' : undefined}>
                {entry.label}<ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
            <Link href="/contact">კონტაქტი<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </nav>
        </aside>
        <article className="prose policy-content">
          {!savedPolicy && heading && <h2>{heading}</h2>}
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className="policy-next-links">
            <Link className="text-link" href={`/faq#${question}`}>კითხვები და პასუხები <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="text-link" href="/contact">დაგვიკავშირდი <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </article>
      </div>
      <CollectionInvitation />
    </main>
  );
}
