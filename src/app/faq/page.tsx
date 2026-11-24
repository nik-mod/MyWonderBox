import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FAQExplorer, type FAQ } from '@/components/faq-explorer';
import { PackagingPhoto } from '@/components/packaging-photo';
import { storefrontMetadata } from '@/lib/metadata';
import { messengerOrdering, plannedDelivery, previewReturnsStatus } from '@/lib/preview-copy';
import '@/components/editorial-pages.css';

export const metadata = storefrontMetadata('/faq', 'ხშირად დასმული კითხვები', 'პასუხები MyWonderBox-ის ყუთების შიგთავსის, ასაკის, შეკვეთისა და მიწოდების შესახებ.');

const questions: FAQ[] = [
  {
    id: 'faq-joybox',
    topic: 'boxes',
    question: 'რა არის ჩემი ვანდერბოქსი?',
    answer: 'ჩემი ვანდერბოქსი ბავშვებისთვის განკუთვნილი სიურპრიზის ყუთია. მასში სათამაშოების, თამაშებისა და შემოქმედებითი ნივთების შერჩეული კომბინაცია დაგხვდება.',
  },
  {
    id: 'faq-contents',
    topic: 'boxes',
    question: 'რა დევს ყუთში?',
    answer: 'ზუსტი შიგთავსი სიურპრიზად რჩება. ნივთების შესაძლო კატეგორიები და ასაკობრივი რეკომენდაცია თითოეული ყუთის გვერდზეა. შიგთავსი შეიძლება განსხვავდებოდეს ყუთებს შორის.',
  },
  {
    id: 'faq-ages',
    topic: 'boxes',
    question: 'რომელი ასაკისთვის არის ყუთები?',
    answer: 'ყუთები რეკომენდებულია 4–10 წლის ბავშვებისთვის. არჩევანისას გადაამოწმე ასაკი და უსაფრთხოების ინფორმაცია.',
  },
  {
    id: 'faq-packaging',
    topic: 'boxes',
    question: 'რით განსხვავდება პარკი და ყუთი?',
    answer: 'სიურპრიზის იდეა და ნივთების კატეგორიები იგივეა, განსხვავება გარე შეფუთვაა. კრაფტის პარკების ხელმისაწვდომობა პროდუქტების გვერდზე ნახე. მუყაოს ყუთები გაყიდვაში მოგვიანებით დაბრუნდება.',
  },
  { id: 'faq-ordering', topic: 'ordering', question: 'როგორ შევუკვეთო?', answer: messengerOrdering },
  {
    id: 'faq-account',
    topic: 'ordering',
    question: 'კატალოგის სანახავად ანგარიში მჭირდება?',
    answer: 'კატალოგის დასათვალიერებლად ანგარიშის შექმნა არ გჭირდება.',
  },
  {
    id: 'faq-payment',
    topic: 'ordering',
    question: 'როგორ გადავიხდი?',
    answer: 'გადახდის პირობები შეკვეთისას Messenger-ში დააზუსტე.',
  },
  { id: 'faq-delivery', topic: 'ordering', question: 'სად და რა ფასად მოიტანთ ყუთს?', answer: plannedDelivery },
  {
    id: 'faq-returns',
    topic: 'ordering',
    question: 'როგორია დაბრუნების პირობები?',
    answer: previewReturnsStatus,
  },
];

export default function FAQPage() {
  return (
    <main className="page-shell container faq-page-edition" id="main">
      <header className="page-header">
        <h1>ხშირად დასმული კითხვები</h1>
        <Link className="faq-product-link" href="/shop">
          <PackagingPhoto color="navy-yellow" />
          <span>ყუთების ნახვა <ArrowUpRight size={19} aria-hidden="true" /></span>
        </Link>
      </header>
      <FAQExplorer questions={questions} />
    </main>
  );
}
