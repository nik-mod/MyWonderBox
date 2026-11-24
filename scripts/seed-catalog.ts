import { createClient } from '@supabase/supabase-js';
import { launchProducts } from '../src/lib/launch-products';
import { packagingColors, packagingDesigns } from '../src/lib/packaging';

async function main() {
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key, NEXT_PUBLIC_SITE_URL: site } = process.env;
if (!url || !key || !site?.startsWith('https://')) {
  throw new Error('Set the Supabase URL, server secret and HTTPS site URL before importing products.');
}
const stock = [process.env.JOYBOX_NAVY_STOCK, process.env.JOYBOX_BERRY_STOCK];
if (stock.some(value => !value || !/^\d+$/.test(value) || Number(value) > 100000)) {
  throw new Error('Set JOYBOX_NAVY_STOCK and JOYBOX_BERRY_STOCK to the actual counts.');
}
const client = createClient(url, key, { auth: { persistSession: false } });
const boxSlugs: string[] = packagingColors.map(color => packagingDesigns[color].storedSlug);
const records = launchProducts.map((product, index) => ({
  ...product,
  stock: boxSlugs.includes(product.slug) ? Number(stock[boxSlugs.indexOf(product.slug)]) : product.stock,
  sort_order: index,
  image_url: new URL(product.image_url, site).href,
  images: product.images.map(image => new URL(image, site).href),
}));
// Preserve an existing catalog, including inventory edited in the admin.
const { error } = await client.from('products').upsert(records, { onConflict: 'slug', ignoreDuplicates: true });
if (error) throw new Error(error.message);
console.log('Catalog import completed. Existing product rows were preserved.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Setup failed"); process.exitCode = 1; });
