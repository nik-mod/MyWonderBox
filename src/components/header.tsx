'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Brand } from './brand';
import { CartDrawer } from './cart-drawer';
import './header.css';
const links = [['/', 'მთავარი'], ['/shop', 'მაღაზია'], ['/how-it-works', 'როგორ მუშაობს?'], ['/about', 'ჩვენ შესახებ']];
export function Header() {
  const path = usePathname(); const dialog = useRef<HTMLDialogElement>(null); const [scrolled, setScrolled] = useState(false);
  const isCurrent = (href: string) => path === href || (href !== '/' && path.startsWith(href + '/'));
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 30); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  useEffect(() => { dialog.current?.close(); }, [path]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 851px)');
    const closeOnDesktop = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main" onClick={() => {
        const main = document.getElementById('main');
        if (main && !main.hasAttribute('tabindex')) main.tabIndex = -1;
        main?.focus({ preventScroll: true });
      }}>შინაარსზე გადასვლა</a>
      <header className={`site-header ${path === '/' ? 'on-hero' : 'solid'} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="მთავარი ნავიგაცია">
            {links.map(([href, label]) => (
              <Link href={href} key={href} prefetch={false}
                aria-current={isCurrent(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/contact" prefetch={false} className="header-contact" aria-current={isCurrent('/contact') ? 'page' : undefined} aria-label="კონტაქტი">
              <Phone size={15} aria-hidden="true" /> <span>კონტაქტი</span>
            </Link>
            <CartDrawer />
            <button className="icon-button menu-toggle" type="button" aria-label="მენიუს გახსნა"
              aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={event => {
                // WebKit does not always focus a button activated with a pointer.
                event.currentTarget.focus({ preventScroll: true });
                dialog.current?.showModal();
                setMenuOpen(true);
              }}><Menu size={20} aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      <dialog id="mobile-navigation" ref={dialog} className="mobile-menu" aria-label="მენიუ"
        onClose={() => setMenuOpen(false)}>
        <div className="mobile-menu-top">
          <Brand onHomeNavigate={() => dialog.current?.close()} />
          <button className="icon-button" type="button" aria-label="მენიუს დახურვა"
            onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
        </div>
        <nav aria-label="მობილური ნავიგაცია">
          {links.map(([href, label]) => (
            <Link key={href} href={href} prefetch={false} aria-current={isCurrent(href) ? 'page' : undefined}
              onClick={() => dialog.current?.close()}>{label}<ArrowUpRight size={19} aria-hidden="true" /></Link>
          ))}
        </nav>
        <div className="mobile-menu-help">
          <Link className="mobile-menu-faq" href="/faq" prefetch={false} onClick={() => dialog.current?.close()}>კითხვები და პასუხები</Link>
          <Link className="header-contact" href="/contact" prefetch={false} aria-current={isCurrent('/contact') ? 'page' : undefined}
            onClick={() => dialog.current?.close()}><Phone size={15} aria-hidden="true" /> კონტაქტი</Link>
        </div>
      </dialog>
    </>
  );
}
