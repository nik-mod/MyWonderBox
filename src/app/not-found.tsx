import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
export default function NotFound() {
 return <main id="main" className="page-shell container recovery-page"><div className="recovery-code" aria-hidden="true">404</div><div><h1>გვერდი ვერ მოიძებნა</h1><div className="recovery-actions"><Link className="button button-yellow" href="/shop">ყუთების ნახვა <ArrowRight size={19} aria-hidden="true" /></Link><Link className="text-link" href="/"><ArrowLeft size={17} aria-hidden="true" /> მთავარი გვერდი</Link></div></div></main>;
}
