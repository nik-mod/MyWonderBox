import { getProducts } from '@/lib/catalog';
import { hasSupabase } from '@/lib/config';
import { connection } from 'next/server';
import { Home } from '@/components/home';
import { brandName, siteDescription, siteTitle, siteUrl, storefrontMetadata } from '@/lib/metadata';

export const metadata = storefrontMetadata('/', siteTitle, siteDescription);

export default async function Page() {
  if (hasSupabase()) await connection();
  const products = await getProducts();
  const organization = siteUrl && {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName,
    alternateName: 'ჩემი ვანდერბოქსი',
    url: siteUrl.href,
    logo: new URL('/brand/mywonderbox/logo.webp', siteUrl).href,
  };

  return <>
    {organization && <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(organization).replace(/</g, '\\u003c'),
    }} />}
    <Home products={products} />
  </>;
}
