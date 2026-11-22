import { packagingColors, packagingDesigns } from '../src/lib/packaging';

const site = process.env.NEXT_PUBLIC_SITE_URL;
if (!site || new URL(site).protocol !== 'https:') {
  throw new Error('Set NEXT_PUBLIC_SITE_URL to the HTTPS site serving the MyWonderBox assets.');
}

const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const rows = packagingColors.map(color => {
  const edition = packagingDesigns[color];
  const fields = [edition.storedSlug, color, edition.productName, new URL(edition.image, site).href];
  return `    (${fields.map(quote).join(', ')})`;
});

// Emit reviewable SQL. Re-running it skips rows whose brand fields are already current.
process.stdout.write(`-- MyWonderBox product branding for the two existing launch editions.
begin;
with artwork(slug, packaging, name, photo) as (
  values
${rows.join(',\n')}
)
update public.products as product
set name = artwork.name,
    image_url = artwork.photo,
    images = array[]::text[],
    description = replace(replace(replace(product.description, 'ჯოიბოქსის', 'ჩემი ვანდერბოქსის'), 'ჯოიბოქსი', 'ჩემი ვანდერბოქსი'), 'JOYBOX', 'MyWonderBox'),
    short_description = replace(replace(replace(product.short_description, 'ჯოიბოქსის', 'ჩემი ვანდერბოქსის'), 'ჯოიბოქსი', 'ჩემი ვანდერბოქსი'), 'JOYBOX', 'MyWonderBox')
from artwork
where product.slug = artwork.slug
  and (product.packaging is null or product.packaging = artwork.packaging)
  and (product.name, product.image_url, product.images) is distinct from
      (artwork.name, artwork.photo, array[]::text[]);
commit;
`);
