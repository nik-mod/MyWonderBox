import { storefrontMetadata } from '@/lib/metadata';
import { PolicyPage } from '@/components/information';
export const metadata = storefrontMetadata('/privacy', 'კონფიდენციალურობა', 'ინფორმაცია MyWonderBox-ის ვებგვერდზე პერსონალური მონაცემების დამუშავების შესახებ.');
export default function Page() { return <PolicyPage policy="privacy" title="კონფიდენციალურობის პოლიტიკა" />; }
