import { deliveryLabels, paymentLabels } from '@/lib/order-labels';
import { requireAdmin } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { canTransition } from '@/lib/orders';
import type { FulfillmentStatus, PaymentStatus } from '@/lib/types';
import { AdminNav, Notice } from '../_components';
import { confirmMessengerSale, updateOrder } from '../actions';
import { bagDesigns } from '@/lib/gift-bags';

const deliveryStatuses = Object.keys(deliveryLabels) as FulfillmentStatus[];
const saleNotices: Record<string, string> = {
  'sale-saved': 'Messenger-ის გაყიდვა დაფიქსირდა. მარაგი განახლდა.',
  'sale-recorded': 'ეს გაყიდვა უკვე დაფიქსირებულია. მარაგი მეორედ არ შემცირებულა.',
  'sale-reference': 'ამ კოდით სხვა რაოდენობის გაყიდვაა დაფიქსირებული. გადაამოწმეთ შეკვეთა.',
  'sale-stock': 'მარაგი არასაკმარისია. გაყიდვა არ დაფიქსირებულა.',
};

function OrderStatusForm({ id, delivery, payment, reservation }: {
  id: string; delivery: FulfillmentStatus; payment: PaymentStatus; reservation: string;
}) {
  const options = deliveryStatuses.filter(next =>
    canTransition(delivery, next, payment)
    && (next !== 'cancelled' || (reservation !== 'held' && payment !== 'processing' && payment !== 'paid')),
  );
  if (!options.length) return <p className="admin-muted">სტატუსის შეცვლა ამ ეტაპზე მიუწვდომელია.</p>;
  return (
    <form action={updateOrder} className="admin-form">
      <input type="hidden" name="id" value={id} />
      <label>მიწოდების ახალი სტატუსი
        <select name="status" required defaultValue="">
          <option value="" disabled>აირჩიეთ სტატუსი</option>
          {options.map(option => <option key={option} value={option}>{deliveryLabels[option]}</option>)}
        </select>
      </label>
      <button>სტატუსის განახლება</button>
    </form>
  );
}

export default async function Orders({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { client } = await requireAdmin();
  const params = await searchParams;
  const state = typeof params.state === 'string' ? params.state : undefined;
  const q = typeof params.q === 'string' ? params.q.replace(/[%_]/g, '').trim().slice(0, 60) : '';
  const status = deliveryStatuses.find(option => option === params.status) ?? '';
  let query = client.from('orders')
    .select('id,order_number,total_minor,fulfillment_status,payment_status,reservation_state,customer_name,customer_phone,delivery_city,delivery_address,notes,order_items(name,quantity,unit_price_minor)')
    .order('created_at', { ascending: false }).limit(200);
  if (q) query = query.ilike('order_number', '%' + q + '%');
  if (status) query = query.eq('fulfillment_status', status);
  const { data, error } = await query;
  if (error) throw new Error('შეკვეთები ვერ ჩაიტვირთა.');

  return (
    <main id="main">
      <AdminNav current="/admin/orders" />
      <h1>შეკვეთები</h1>
      {state && Object.hasOwn(saleNotices, state) ? <p role="status" className="admin-notice">{saleNotices[state]}</p> : <Notice state={state} />}
      <details className="admin-panel">
        <summary>Messenger-ის გაყიდვის დაფიქსირება</summary>
        <form action={confirmMessengerSale} className="admin-form admin-form-grid">
          <p className="span-two">შეიყვანეთ მომხმარებლის შეკვეთის კოდი და რაოდენობები მას შემდეგ, რაც შეკვეთას ჩატში დაადასტურებთ.</p>
          <label className="span-two">შეკვეთის კოდი<input name="reference" type="text" required maxLength={36} autoComplete="off" /></label>
          <label>{bagDesigns['mywonderbox-bag-blue'].title}<input name="blue" type="number" min={0} max={99} defaultValue={0} required /></label>
          <label>{bagDesigns['mywonderbox-bag-pink'].title}<input name="pink" type="number" min={0} max={99} defaultValue={0} required /></label>
          <button type="submit">გაყიდვის დაფიქსირება</button>
        </form>
      </details>
      <form className="admin-search">
        <input name="q" aria-label="შეკვეთის ნომერი" placeholder="შეკვეთის ნომერი" defaultValue={q} maxLength={60} />
        <select name="status" aria-label="მიწოდების სტატუსი" defaultValue={status}>
          <option value="">ყველა სტატუსი</option>
          {deliveryStatuses.map(value => <option key={value} value={value}>{deliveryLabels[value]}</option>)}
        </select>
        <button>ძებნა</button>
      </form>
      {data?.length ? data.map(order => {
        const delivery = order.fulfillment_status as FulfillmentStatus;
        const payment = order.payment_status as PaymentStatus;
        return (
          <details className="admin-panel admin-order" key={order.id}>
            <summary>{order.order_number} · {formatMoney(order.total_minor)} · {deliveryLabels[delivery]}</summary>
            <dl>
              <dt>მომხმარებელი</dt><dd>{order.customer_name}</dd>
              <dt>ტელეფონი</dt><dd>{order.customer_phone}</dd>
              <dt>მისამართი</dt><dd>{order.delivery_city}, {order.delivery_address}</dd>
              <dt>გადახდა</dt><dd>{paymentLabels[payment]}</dd>
              <dt>შენიშვნა</dt><dd>{order.notes || '—'}</dd>
            </dl>
            <ul>{order.order_items.map((item, index) => (
              <li key={index}>{item.name} × {item.quantity} · {formatMoney(item.unit_price_minor)}</li>
            ))}</ul>
            <OrderStatusForm id={order.id} delivery={delivery} payment={payment} reservation={order.reservation_state} />
            <small>გადახდის სტატუსი ხელით არ იცვლება.</small>
          </details>
        );
      }) : <div className="admin-empty">შეკვეთები ვერ მოიძებნა.</div>}
    </main>
  );
}
