import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { brandCopy } from '../src/lib/brand-copy';
import { launchProducts } from '../src/lib/launch-products';
import { catalogProduct, packagingDesigns, productHref, storedProductSlug } from '../src/lib/packaging';

test('legacy catalog and saved cart data adopt the correct edition while keeping their identifiers and amounts', () => {
  const original = {
    ...launchProducts.find(item => item.slug === 'joybox-navy')!, name: 'JOYBOX — ბიჭებისთვის', description: 'ჯოიბოქსის ყუთი',
    image_url: 'https://store.example.test/brand/box-navy.webp', stock: 7, price_minor: 3100,
    images: ['https://store.example.test/brand/mywonderbox/box-blue-detail.webp'],
  };
  const product = catalogProduct(original);
  assert.equal(storedProductSlug('mywonderbox-blue'), original.slug);
  assert.equal(productHref(original.slug), '/shop/mywonderbox-blue');
  assert.deepEqual([product.id, product.slug, product.stock, product.price_minor],
    [original.id, original.slug, 7, 3100]);
  assert.equal(product.name, 'MyWonderBox — ბიჭებისთვის');
  assert.equal(product.description, 'ჩემი ვანდერბოქსის ყუთი');
  assert.deepEqual([product.image_url, ...product.images], [packagingDesigns['navy-yellow'].image]);
  assert.equal(catalogProduct({ ...original, slug: 'custom-edition' }).image_url, original.image_url);
  assert.equal(brandCopy('Joy Box / WonderBox / MyWonderBox'), 'MyWonderBox / MyWonderBox / MyWonderBox');
});

test('rebrand SQL updates only matching editions and leaves their commerce data intact on retry', async () => {
  const query = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/prepare-catalog-rebrand-sql.ts'], {
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: 'https://store.example.test' }, encoding: 'utf8',
  });
  const db = new PGlite();
  try {
    await db.exec(`create table products (
      id int primary key, slug text, name text, description text, short_description text,
      image_url text, images text[], packaging text, price_minor integer, stock integer, published boolean
    );
    insert into products values
      (1, 'joybox-navy', 'JOYBOX', 'ჯოიბოქსის ყუთი', 'JOYBOX', 'https://store.example.test/blue.webp', array['https://store.example.test/brand/mywonderbox/box-blue-detail.webp'], 'navy-yellow', 3100, 7, true),
      (2, 'joybox-berry', 'JOYBOX', 'ჯოიბოქსის ყუთი', 'JOYBOX', 'https://store.example.test/pink.webp', array['https://store.example.test/brand/mywonderbox/box-pink-detail.webp'], 'pink-berry', 3200, 4, false),
      (3, 'independent-edition', 'Other', 'Other', 'Other', 'https://store.example.test/other.webp', '{}', 'navy-yellow', 4000, 2, true);`);
    await db.exec(query);
    await db.exec(query);
    assert.deepEqual((await db.query('select id, slug, price_minor, stock, published from products order by id')).rows, [
      { id: 1, slug: 'joybox-navy', price_minor: 3100, stock: 7, published: true },
      { id: 2, slug: 'joybox-berry', price_minor: 3200, stock: 4, published: false },
      { id: 3, slug: 'independent-edition', price_minor: 4000, stock: 2, published: true },
    ]);
    const { rows } = await db.query<{ name: string; image_url: string; images: string[] }>('select name, image_url, images from products order by id');
    assert.deepEqual(rows.map(({ image_url }) => new URL(image_url).pathname),
      [packagingDesigns['navy-yellow'].image, packagingDesigns['pink-berry'].image, '/other.webp']);
    assert.deepEqual(rows.slice(0, 2).map(({ images }) => images), [[], []]);
    assert.equal(rows[1].name, 'MyWonderBox — გოგოებისთვის');
  } finally {
    await db.close();
  }
});
