import { storefrontMetadata } from '@/lib/metadata';
import { PolicyPage } from '@/components/information';
export const metadata = storefrontMetadata('/delivery', 'მიწოდების პირობები', 'MyWonderBox-ის ყუთების დაგეგმილი უფასო მიწოდება საქართველოს მასშტაბით.');
export default function Page() { return <PolicyPage policy="delivery" title="მიწოდება" />; }
