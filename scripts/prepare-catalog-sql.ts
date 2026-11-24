import { writeFile } from 'node:fs/promises';
import { launchProducts } from '../src/lib/launch-products';

async function main() {
// Generates a reviewable import without a database password or management token.
const site = process.env.NEXT_PUBLIC_SITE_URL;
const counts = [process.env.JOYBOX_NAVY_STOCK, process.env.JOYBOX_BERRY_STOCK];
if (!site || new URL(site).protocol !== 'https:') throw new Error('Set NEXT_PUBLIC_SITE_URL to the deployed HTTPS website serving /brand images.');
if (counts.some(value => !value || !/^\d+$/.test(value) || Number(value) > 100000)) {
  throw new Error('Set JOYBOX_NAVY_STOCK and JOYBOX_BERRY_STOCK to actual counts. No estimated stock is imported.');
}
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const rows = launchProducts.map((product, index) => {
  const boxIndex = ['joybox-navy', 'joybox-berry'].indexOf(product.slug);
  const record = { ...product, stock: boxIndex < 0 ? product.stock : Number(counts[boxIndex]), sort_order: index,
    image_url: new URL(product.image_url, site).href,
    images: product.images.map(image => new URL(image, site).href) };
  return `${quote(JSON.stringify(record))}::jsonb`;
});
const sql = `-- Owner-approved catalog. Existing rows and inventory are preserved.\nbegin;\ninsert into public.products (id,slug,name,description,short_description,price_minor,age_label,image_url,images,categories,dimensions,safety_info,stock,published,packaging,sort_order)\nselect p.id,p.slug,p.name,p.description,p.short_description,p.price_minor,p.age_label,p.image_url,p.images,p.categories,p.dimensions,p.safety_info,p.stock,p.published,p.packaging,p.sort_order\nfrom (values\n${rows.map(row => `(${row})`).join(',\n')}\n) as source(data)\ncross join lateral jsonb_populate_record(null::public.products,source.data) p\non conflict (slug) do nothing;\ncommit;\n`;
await writeFile('supabase/CATALOG-IMPORT.local.sql', sql, { flag: 'wx' });
console.log('Created supabase/CATALOG-IMPORT.local.sql. Review before running. Existing files are not overwritten.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Setup failed"); process.exitCode = 1; });
