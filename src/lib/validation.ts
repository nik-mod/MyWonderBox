import { z } from 'zod';
export const georgianMobile = z.string().trim().max(32)
  .transform(value => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^(?:(?:\+|00)?995)?5\d{8}$/))
  .transform(value => '+995' + value.slice(-9));

export const checkoutSchema = z.object({
  items: z.array(z.object({product_id:z.uuid(),quantity:z.number().int().min(1).max(99)})).min(1).max(30)
    .refine(items => new Set(items.map(item => item.product_id)).size === items.length, 'Duplicate products'),
  customer:z.object({
    name:z.string().trim().min(2).max(120),phone:georgianMobile,
    email:z.union([z.email().max(254),z.literal('')]).optional(), city:z.string().trim().min(1).max(100),
    address:z.string().trim().min(8).max(500),notes:z.string().trim().max(1000).optional(),
  }),idempotency_key:z.uuid(),
});
export const productSchema = z.object({
  name:z.string().trim().min(2).max(150),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description:z.string().trim().min(10).max(6000),short_description:z.string().trim().min(5).max(300),
  price_minor:z.coerce.number().int().min(1).max(10000000),stock:z.coerce.number().int().min(0).max(100000),
  age_label:z.string().trim().min(1).max(60),dimensions:z.string().max(120),safety_info:z.string().trim().min(5).max(2000),
  image_url:z.string().refine(url => /^\/brand\/mywonderbox\/[a-z0-9-]+\.webp$/.test(url) || (z.url().safeParse(url).success && url.startsWith('https://')), 'HTTPS or bundled product image required'),
  packaging:z.enum(['navy-yellow','pink-berry']).nullable().optional(),
  published:z.boolean(),
});
export const settingsSchema = z.object({
  contact_email:z.union([z.email(),z.literal('')]),contact_phone:z.string().max(40),
  delivery_zones:z.array(z.object({id:z.string().regex(/^[a-z0-9-]+$/).max(60),name:z.string().min(1).max(100),price_minor:z.number().int().min(0).max(100000)})).max(100)
    .refine(zones => new Set(zones.map(zone=>zone.id)).size === zones.length,'Duplicate delivery zone'),
  policies:z.record(z.string(),z.string().max(30000)),
});
