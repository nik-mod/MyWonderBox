'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { giftBag } from '@/lib/gift-bags';
import { productHref } from '@/lib/packaging';
import { useCart } from './cart-context';
import { BoxMark } from './brand';
import { ProductThumbnail } from './packaging-photo';

export function CartDrawer() {
  const { lines, count, ready, update, remove } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const subtotal = lines.reduce((total, line) => total + line.product.price_minor * line.quantity, 0);
  const close = () => dialog.current?.close();
  useEffect(() => { dialog.current?.close(); }, [path]);

  return <>
    <button className="cart-link" type="button" aria-label={`კალათა, ${count} ნივთი`}
      aria-haspopup="dialog" aria-controls="cart-drawer" aria-expanded={open}
      onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      <ShoppingBag size={25} strokeWidth={1.65} aria-hidden="true" /><span className="cart-count">{count}</span>
    </button>
    <dialog id="cart-drawer" ref={dialog} className="cart-drawer" aria-labelledby="cart-drawer-title"
      onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="cart-drawer-panel">
        <header><h2 id="cart-drawer-title">ჩემი კალათა</h2><button type="button" className="icon-button" aria-label="კალათის დახურვა" onClick={close}><X /></button></header>
        <div className="cart-drawer-content">
          {!ready ? <p role="status">კალათა იტვირთება…</p> : lines.length === 0 ? (
            <div className="cart-drawer-empty"><ShoppingBag size={44} strokeWidth={1.2} aria-hidden="true" />
              <p>კალათა ცარიელია.</p><Link className="button button-yellow" href="/shop" onClick={close}>მაღაზიის ნახვა <ArrowRight size={18} /></Link>
            </div>
          ) : <ul>{lines.map(({ product, quantity }) => (
            <li className="drawer-line" key={product.id}>
              <Link href={productHref(product.slug)} onClick={close} aria-label={product.name}>
                {product.image_url ? <ProductThumbnail product={product} decorative /> : <BoxMark />}
              </Link>
              <div><Link href={productHref(product.slug)} onClick={close}>{giftBag(product)?.title ?? product.name}</Link>
                <strong>{formatMoney(product.price_minor * quantity)}</strong>
                <div className="drawer-line-actions">
                  <div className="quantity-control">
                    <button type="button" aria-label={`${product.name}: რაოდენობის შემცირება`} disabled={quantity <= 1} onClick={() => update(product.id, quantity - 1)}><Minus size={15} /></button>
                    <span>{quantity}</span>
                    <button type="button" aria-label={`${product.name}: რაოდენობის გაზრდა`} disabled={quantity >= Math.min(99, product.stock)} onClick={() => update(product.id, quantity + 1)}><Plus size={15} /></button>
                  </div>
                  <button className="remove-button" type="button" onClick={() => remove(product.id)}>წაშლა</button>
                </div>
              </div>
            </li>
          ))}</ul>}
        </div>
        {ready && lines.length > 0 && <footer>
          <div className="summary-row total"><span>შუალედური ჯამი</span><strong>{formatMoney(subtotal)}</strong></div>
          <Link className="button button-yellow" href="/cart" onClick={close}>კალათის ნახვა <ArrowRight size={18} /></Link>
        </footer>}
      </div>
    </dialog>
  </>;
}
