import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('migrations enforce order integrity and access boundary in local PostgreSQL', async () => {
  const db = new PGlite();
  try {
    // Minimal Auth and Storage objects, as supplied by Supabase in deployment.
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create function auth.uid() returns uuid language sql as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon, authenticated, service_role;
      create table auth.users(id uuid primary key);
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,
        file_size_limit integer,allowed_mime_types text[]);
      create table storage.objects(bucket_id text);
      alter table storage.objects enable row level security;
    `);
    for (const migration of ['202611160001_foundation.sql', '202611160002_order_foundation.sql']) {
      await db.exec(await readFile('supabase/migrations/' + migration, 'utf8'));
    }
    const product = '5f463cc3-cd90-4b5c-8501-055f0a7ff11a';
    const hidden = '8f463cc3-cd90-4b5c-8501-055f0a7ff11a';
    const checkout = '2cd3ba42-0341-4cbd-ae8c-c19dd45326e4';
    const administrator = '14df10a5-7948-42b2-8dd1-edeea99dc343';
    const customer = { name: 'Fixture', phone: '+995599123456', city: 'test', address: 'Test address' };
    const items = [{ product_id: product, quantity: 2, price_minor: 1 }];
    const digest = 'a'.repeat(64);
    const token = 'b'.repeat(64);
    await db.exec(`
      insert into auth.users(id) values ('${administrator}');
      insert into public.admin_users(user_id) values ('${administrator}');
      update public.store_settings set checkout_enabled=true,
        delivery_zones='[{"id":"test","name":"Test zone","price_minor":500}]';
      insert into public.products(id,slug,name,description,short_description,price_minor,
        age_label,image_url,stock,safety_info,published) values
        ('${product}','fixture','Fixture','Fixture','Fixture',3200,'6+','https://example.test/a',2,'Fixture',true),
        ('${hidden}','hidden','Hidden','Hidden','Hidden',3200,'6+','https://example.test/a',2,'Fixture',false);
    `);
    const reserve = (key: string, fingerprint = digest, lines: object[] = items) =>
      db.query<{order: {id:string; total_minor:number}}>(
        'select public.reserve_order($1,$2,$3,$4,$5) as "order"',
        [key, fingerprint, key === checkout ? token : 'c'.repeat(64), JSON.stringify(customer), JSON.stringify(lines)],
      );
    await db.exec('set role anon');
    assert.equal((await db.query('select id from public.products')).rows.length, 1);
    await assert.rejects(reserve(checkout), /permission denied/);
    await assert.rejects(db.query('select * from public.orders'), /permission denied/);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select id from public.orders')).rows.length, 0);
    await assert.rejects(db.query('update public.products set reserved_stock=0'), /permission denied/);
    await db.exec('set role service_role');
    const failedKey = '3cd3ba42-0341-4cbd-ae8c-c19dd45326e4';
    await assert.rejects(reserve(failedKey, digest, [...items, { product_id:hidden, quantity:1 }]), /Product unavailable/);
    const order = (await reserve(checkout)).rows[0].order;
    assert.equal(order.total_minor, 6900);
    assert.deepEqual((await reserve(checkout)).rows[0].order, order);
    await assert.rejects(reserve(checkout, 'd'.repeat(64)), /already used/);
    await assert.rejects(reserve(failedKey), /Product unavailable/);
    const status = await db.query<{status: Record<string, unknown> | null}>(
      'select public.guest_order_status($1) as status', [token],
    );
    assert.equal(status.rows[0].status?.total_minor, 6900);
    assert.equal('customer_phone' in status.rows[0].status!, false);
    assert.equal((await db.query<{ status: unknown }>('select public.guest_order_status($1) as status', ['e'.repeat(64)])).rows[0].status, null);
    await db.exec("set role authenticated");
    assert.equal((await db.query('select id from public.orders')).rows.length, 0);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [administrator]);
    assert.deepEqual((await db.query('select id from public.orders')).rows, [{ id: order.id }]);
    await assert.rejects(db.query("select public.transition_order($1,'confirmed')", [order.id]), /Verified payment required/);
    await assert.rejects(db.query("select public.transition_order($1,'cancelled')", [order.id]), /Reconcile payment/);
    await db.exec("reset request.jwt.claim.sub; set role service_role");
    const release = () => db.query<{ released: boolean }>(
      'select public.release_order_reservation($1) as released', [order.id],
    );
    assert.equal((await release()).rows[0].released, true);
    assert.equal((await release()).rows[0].released, false);
    await db.exec('reset role');
    assert.deepEqual((await db.query('select stock,reserved_stock from public.products where id=$1', [product])).rows,
      [{ stock:2, reserved_stock:0 }]);
    assert.equal((await db.query('select id from public.orders')).rows.length, 1);

    const catalog = await readFile('supabase/migrations/202611230001_gift_bag_catalog.sql', 'utf8');
    const sales = await readFile('supabase/migrations/202611230002_messenger_sale_inventory.sql', 'utf8');
    await db.exec(`insert into public.products(slug,name,description,short_description,price_minor,
      age_label,image_url,stock,safety_info,published) values
      ('joybox-navy','Original','Original details','Original summary',3390,'4+','https://example.test/box',25,'Safety',true)`);
    await db.exec(catalog);
    await db.exec(sales);
    const bagStock = () => db.query<{ slug: string; stock: number; sold_quantity: number; price_minor: number }>(
      `select slug, stock, sold_quantity, price_minor from public.products where slug like 'mywonderbox-bag-%' order by slug`,
    );
    assert.deepEqual((await bagStock()).rows, [
      { slug: 'mywonderbox-bag-blue', stock: 50, sold_quantity: 0, price_minor: 2490 },
      { slug: 'mywonderbox-bag-pink', stock: 50, sold_quantity: 0, price_minor: 2490 },
    ]);
    assert.deepEqual((await db.query(`select slug, stock, price_minor from public.products where slug like 'joybox-%' order by slug`)).rows, [
      { slug: 'joybox-berry', stock: 0, price_minor: 2990 },
      { slug: 'joybox-navy', stock: 0, price_minor: 3390 },
    ]);
    const sale = (reference: string, blue: number, pink: number) => db.query<{ recorded: boolean }>(
      'select public.confirm_messenger_sale($1,$2,$3) as recorded', [reference, blue, pink],
    );
    await db.exec('set role anon');
    await assert.rejects(sale(checkout, 2, 3), /permission denied/);
    await db.exec('set role authenticated');
    await assert.rejects(sale(checkout, 2, 3), /Administrator required/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [administrator]);
    assert.equal((await sale(checkout, 2, 3)).rows[0].recorded, true);
    assert.equal((await sale(checkout, 2, 3)).rows[0].recorded, false);
    await assert.rejects(sale(checkout, 2, 4), /different quantities/);
    await assert.rejects(sale(failedKey, 3, 50), /Insufficient stock/);
    await db.exec('reset role');
    await db.exec(catalog);
    await db.exec(sales);
    assert.deepEqual((await bagStock()).rows.map(row => [row.stock, row.sold_quantity]), [[48, 2], [47, 3]]);
    assert.equal((await db.query('select reference from public.messenger_sales')).rows.length, 1);
    assert.equal((await db.query('select id from public.orders')).rows.length, 1);
  } finally {
    await db.close();
  }
});
