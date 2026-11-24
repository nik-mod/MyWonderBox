'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Minus, Plus, ArrowRight, Copy, Trash2 } from 'lucide-react';
import { formatMoney, formatProductPrice } from '@/lib/money';
import { giftBag } from '@/lib/gift-bags';
import { productHref } from '@/lib/packaging';
import { currentCartLines, fetchCartCatalog, useCart } from './cart-context';
import { BoxMark } from './brand';
import { ProductThumbnail } from './packaging-photo';
import { MessengerOrderLink } from './messenger-order-link';

export function Cart({ freeDelivery }: { freeDelivery: boolean }) {
  const { lines, ready, update, remove, applyCatalog } = useCart();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [draft, setDraft] = useState<{ key: string; message: string }>();
  const draftField = useRef<HTMLTextAreaElement>(null);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price_minor * line.quantity, 0);
  const key = lines.map(({ product, quantity }) => `${product.id}:${quantity}:${product.price_minor}`).join(',');
  const currentDraft = draft?.key === key ? draft : undefined;

  async function prepareOrder() {
    setChecking(true);
    setFeedback('');
    try {
      const products = await fetchCartCatalog();
      const current = currentCartLines(lines, products);
      applyCatalog(products);
      if (current.length !== lines.length || current.some((line, index) =>
        line.quantity !== lines[index].quantity || line.product.price_minor !== lines[index].product.price_minor)) {
        setFeedback('ფასი ან მარაგი შეიცვალა. გადაამოწმე განახლებული კალათა.');
        return;
      }
      const message = [
        'გამარჯობა! მსურს შემდეგი პროდუქტების შეკვეთა:',
        ...current.map(({ product, quantity }) => `${product.name} × ${quantity} · ${formatProductPrice(product)}`),
        `პროდუქტების ჯამი: ${formatMoney(subtotal)}`,
        `შეკვეთის კოდი: ${crypto.randomUUID()}`,
      ].join('\n');
      setDraft({ key, message });
    } catch {
      setFeedback('მარაგი ვერ გადამოწმდა. სცადე ხელახლა.');
    } finally {
      setChecking(false);
    }
  }

  async function copyOrder() {
    if (!currentDraft) return;
    try {
      await navigator.clipboard.writeText(currentDraft.message);
      setFeedback('სია დაკოპირდა. ჩასვი Messenger-ში და გამოგვიგზავნე.');
    } catch {
      draftField.current?.focus();
      draftField.current?.select();
      setFeedback('მონიშნული ტექსტი დააკოპირე და ჩასვი Messenger-ში.');
    }
  }

  if (!ready) return <div role="status" className="notice">კალათა იტვირთება…</div>;

  if (!lines.length) return (
    <div className="empty-state empty-discovery">
      <h2>შენი კალათა ჯერ ცარიელია</h2>
      {feedback && <p role="status">{feedback}</p>}
      <Link className="button button-yellow" href="/shop">მაღაზიის ნახვა <ArrowRight size={19} /></Link>
    </div>
  );

  return (
    <div className="cart-layout">
      <div>
        {lines.map(({ product, quantity }) => (
          <article className="cart-line" key={product.id}>
            <Link className="cart-line-img" href={productHref(product.slug)} aria-label={product.name}>
              {product.image_url ? <ProductThumbnail product={product} decorative /> : <BoxMark />}
            </Link>
            <div>
              <Link href={productHref(product.slug)}><h2>{giftBag(product)?.title ?? product.name}</h2></Link>
              <p>{formatProductPrice(product)}</p>
              <div className="cart-line-actions">
                <div className="quantity-control">
                  <button type="button" aria-label={`${product.name}: რაოდენობის შემცირება`} disabled={checking || quantity <= 1}
                    onClick={() => { setDraft(undefined); update(product.id, quantity - 1); }}><Minus size={14} /></button>
                  <span>{quantity}</span>
                  <button type="button" aria-label={`${product.name}: რაოდენობის გაზრდა`} disabled={checking || quantity >= product.stock || quantity >= 99}
                    onClick={() => { setDraft(undefined); update(product.id, quantity + 1); }}><Plus size={14} /></button>
                </div>
                <button type="button" className="remove-button" disabled={checking} onClick={() => { setDraft(undefined); remove(product.id); }}><Trash2 size={13} /> წაშლა</button>
              </div>
            </div>
            <strong>{formatMoney(product.price_minor * quantity)}</strong>
          </article>
        ))}
      </div>
      <aside className="cart-total">
        <h2>შეკვეთის შეჯამება</h2>
        <div className="summary-row"><span>პროდუქტების ღირებულება</span><span>{formatMoney(subtotal)}</span></div>
        <div className="summary-row"><span>მიწოდება</span><span>{freeDelivery ? 'უფასო' : 'მისამართის მიხედვით'}</span></div>
        <div className="summary-row total"><span>{freeDelivery ? 'სულ' : 'შუალედური ჯამი'}</span><span>{formatMoney(subtotal)}</span></div>
        <p>შეკვეთას და მიწოდების დეტალებს Messenger-ში დაგიდასტურებთ.</p>
        {feedback && <p role="status" className="cart-order-feedback">{feedback}</p>}
        {currentDraft ? <div className="cart-order-draft">
          <label htmlFor="cart-order-message">შეკვეთის სია</label>
          <textarea id="cart-order-message" ref={draftField} readOnly value={currentDraft.message} rows={6} />
          <button type="button" onClick={copyOrder} className="button button-outline"><Copy size={16} aria-hidden="true" /> სიის კოპირება</button>
          <MessengerOrderLink />
        </div> : <button type="button" className="button button-yellow" onClick={prepareOrder} disabled={checking}>
          {checking ? 'მარაგი მოწმდება…' : 'შეკვეთის სიის მომზადება'} <ArrowRight size={18} aria-hidden="true" />
        </button>}
        <Link className="text-link cart-continue" href="/shop">მაღაზიაში დაბრუნება</Link>
      </aside>
    </div>
  );
}
