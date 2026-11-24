'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from '@/lib/admin';
import {createSessionClient} from '@/lib/supabase';
import {productSchema,settingsSchema} from '@/lib/validation';
import {z} from 'zod';
import sharp from 'sharp';

const imageFormats = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpeg'],
  ['image/webp', 'webp'],
]);

export async function signIn(form:FormData) {
  const email=String(form.get('email')??'').trim();const password=String(form.get('password')??'');
  if(!z.email().safeParse(email).success || password.length<8 || password.length>128) redirect('/admin/login?state=invalid');
  const client=await createSessionClient();
  if(!client) redirect('/admin/login?state=setup');
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error) redirect('/admin/login?state=invalid');
  await requireAdmin();
  redirect('/admin');
}
export async function signOut(){const client=await createSessionClient();await client?.auth.signOut();redirect('/admin/login');}
export async function saveProduct(form:FormData){
  const {client}=await requireAdmin();
  const parsed=productSchema.safeParse({
    ...Object.fromEntries(form.entries()),
    packaging: form.get('packaging') || null,
    published:form.get('published')==='on',
  });
  if(!parsed.success) redirect('/admin/products?state=invalid');
  const rawId=form.get('id');
  if(rawId && !z.uuid().safeParse(rawId).success) redirect('/admin/products?state=invalid');
  const version = z.iso.datetime({ offset: true }).safeParse(form.get('updated_at'));
  if (rawId && !version.success) redirect('/admin/products?state=invalid');
  const result = rawId
    ? await client.from('products').update(parsed.data).eq('id',String(rawId))
      .eq('updated_at', version.data!).select('id').maybeSingle()
    : await client.from('products').insert(parsed.data).select('id').single();
  if (result.error) redirect('/admin/products?state=error');
  if (!result.data) redirect('/admin/products?state=stale');
  revalidatePath('/','layout');redirect('/admin/products?state=saved');
}
export async function archiveProduct(form:FormData){
  const {client}=await requireAdmin();
  const id=z.uuid().safeParse(form.get('id'));
  const version=z.iso.datetime({offset:true}).safeParse(form.get('updated_at'));
  if(!id.success || !version.success)redirect('/admin/products?state=invalid');
  const {data,error}=await client.from('products').update({published:false})
    .eq('id',id.data).eq('updated_at',version.data).eq('published',true).select('id').maybeSingle();
  if(error)redirect('/admin/products?state=error');
  if(!data)redirect('/admin/products?state=stale');
  revalidatePath('/','layout');redirect('/admin/products?state=saved');
}
export async function uploadImage(form: FormData) {
  const { client, user } = await requireAdmin();
  const file = form.get('image');
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    redirect('/admin/products?state=image-invalid');
  }
  const expectedFormat = imageFormats.get(file.type);
  if (!expectedFormat) redirect('/admin/products?state=image-invalid');

  let buffer: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25_000_000 });
    const { format } = await image.metadata();
    if (format !== expectedFormat) throw new Error('Invalid image format');
    buffer = await image.rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 }).toBuffer();
  } catch {
    redirect('/admin/products?state=image-invalid');
  }
  const path=`${user.id}/${crypto.randomUUID()}.webp`;
  const {error}=await client.storage.from('product-media').upload(path,buffer,{contentType:'image/webp',upsert:false});
  if(error)redirect('/admin/products?state=error');
  const {data}=client.storage.from('product-media').getPublicUrl(path);
  redirect(`/admin/products?uploaded=${encodeURIComponent(data.publicUrl)}`);
}
export async function saveSettings(form:FormData){
  const {client}=await requireAdmin();let input:unknown;
  try{input={contact_email:String(form.get('contact_email')??''),contact_phone:String(form.get('contact_phone')??''),delivery_zones:JSON.parse(String(form.get('delivery_zones')??'[]')),policies:Object.fromEntries(['delivery','returns','privacy','terms'].map(key=>[key,String(form.get(key)??'')]))};}
  catch{redirect('/admin/settings?state=invalid');}
  const parsed=settingsSchema.safeParse(input);if(!parsed.success)redirect('/admin/settings?state=invalid');
  const {error}=await client.from('store_settings').upsert({id:1,...parsed.data});
  if(error)redirect('/admin/settings?state=error');
  revalidatePath('/','layout');redirect('/admin/settings?state=saved');
}
export async function updateOrder(form:FormData){
  const {client}=await requireAdmin();const id=z.uuid().safeParse(form.get('id'));
  const status=z.enum(['confirmed','preparing','shipped','delivered','cancelled']).safeParse(form.get('status'));
  if(!id.success || !status.success)redirect('/admin/orders?state=invalid');
  const {error}=await client.rpc('transition_order',{order_id:id.data,next_status:status.data});
  if(error)redirect('/admin/orders?state=transition');
  revalidatePath('/admin');redirect('/admin/orders?state=saved');
}

export async function confirmMessengerSale(form: FormData) {
  const { client } = await requireAdmin();
  const reference = z.uuid().safeParse(form.get('reference'));
  const quantity = z.coerce.number().int().min(0).max(99);
  const blue = quantity.safeParse(form.get('blue'));
  const pink = quantity.safeParse(form.get('pink'));
  if (!reference.success || !blue.success || !pink.success || blue.data + pink.data === 0) {
    redirect('/admin/orders?state=invalid');
  }
  const { data, error } = await client.rpc('confirm_messenger_sale', {
    sale_reference: reference.data, blue_quantity: blue.data, pink_quantity: pink.data,
  });
  if (error) {
    const state = error.code === '23505' ? 'sale-reference' : error.code === 'P0001' ? 'sale-stock' : 'error';
    redirect(`/admin/orders?state=${state}`);
  }
  revalidatePath('/', 'layout');
  redirect(`/admin/orders?state=${data ? 'sale-saved' : 'sale-recorded'}`);
}
