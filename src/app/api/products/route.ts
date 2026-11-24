import {getProducts} from '@/lib/catalog';
export async function GET() {
  try { return Response.json({products:await getProducts()}, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({error:'პროდუქტების ჩატვირთვა ვერ მოხერხდა.'},{status:503}); }
}
