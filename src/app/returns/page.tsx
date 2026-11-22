import { storefrontMetadata } from '@/lib/metadata';
import { PolicyPage } from '@/components/information';
export const metadata = storefrontMetadata('/returns', 'დაბრუნების პირობები', 'MyWonderBox-ის ყუთების დაბრუნებისა და თანხის ანაზღაურების პირობები.');
export default function Page() { return <PolicyPage policy="returns" title="დაბრუნება და თანხის ანაზღაურება" />; }
