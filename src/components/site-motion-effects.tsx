'use client';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { allowMotion, gsap, ScrollTrigger, useGSAP, wideMotion } from './motion';

/** Never transform a pin ancestor: it changes fixed-position geometry. */
export default function SiteMotionEffects() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const transition = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const navigated = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    const main = document.querySelector('main');
    if (!main || pathname.startsWith('/admin')) return;

    // Reveal the committed route without delaying navigation or transforming its pinned sections.
    if (navigated && transition.current && window.matchMedia(allowMotion).matches) {
      gsap.fromTo(transition.current, { autoAlpha: .56 }, {
        autoAlpha: 0, duration: .42, ease: 'power2.out', clearProps: 'opacity,visibility',
      });
    }

    const media = gsap.matchMedia();
    media.add(allowMotion, () => {
      const title = main.querySelector('.commerce-heading h1, .page-header h1, .about-lead h1, .product-copy h1');
      if (title) gsap.fromTo(title, { y: 14, opacity: .7 }, {
        y: 0, opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'opacity,transform',
      });
      // A single line-drawing moment identifies each information page.
      main.querySelectorAll<SVGGeometryElement>('.policy-symbol path, .policy-symbol circle, .policy-symbol rect').forEach((line, index) => {
        const length = line.getTotalLength();
        gsap.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, {
          strokeDashoffset: 0, duration: .85, delay: .12 + index * .07, ease: 'power2.out',
          clearProps: 'strokeDasharray,strokeDashoffset',
        });
      });
    });
    media.add(wideMotion, () => {
      main.querySelectorAll('.about-still img, .about-closing img, .contact-still img').forEach(element => {
        gsap.fromTo(element, { y: 10 }, { y: -10, ease: 'none',
          scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .6 },
        });
      });
    });
    const tweens = new Map<HTMLDetailsElement, gsap.core.Tween>();
    let refresh = 0;
    const scheduleRefresh = () => {
      cancelAnimationFrame(refresh);
      refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const finish = (details: HTMLDetailsElement, open: boolean) => {
      details.open = open;
      delete details.dataset.expanding;
      details.style.removeProperty('height');
      details.style.removeProperty('overflow');
      tweens.delete(details);
      scheduleRefresh();
    };
    const toggle = (event: MouseEvent) => {
      const summary = event.target instanceof Element ? event.target.closest('summary') : null;
      const details = summary?.parentElement;
      if (!(details instanceof HTMLDetailsElement) || !details.closest('.faq-list, .product-disclosures')) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      const open = details.dataset.expanding ? details.dataset.expanding !== 'true' : !details.open;
      const from = details.getBoundingClientRect().height;
      tweens.get(details)?.kill();
      details.open = true;
      details.style.height = '';
      const to = open ? details.getBoundingClientRect().height : summary!.getBoundingClientRect().height;
      details.dataset.expanding = String(open);
      details.style.overflow = 'hidden';
      tweens.set(details, gsap.fromTo(details, { height: from }, {
        height: to, duration: .36, ease: 'power3.inOut', onComplete: () => finish(details, open),
      }));
    };
    const nativeToggle = (event: Event) => {
      if (event.target instanceof HTMLDetailsElement && !tweens.has(event.target)) scheduleRefresh();
    };
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => {
      if (!preference.matches) return;
      tweens.forEach((tween, details) => { tween.kill(); finish(details, details.dataset.expanding === 'true'); });
    };
    main.addEventListener('click', toggle);
    main.addEventListener('toggle', nativeToggle, true);
    preference.addEventListener('change', stopMotion);
    return () => {
      main.removeEventListener('click', toggle);
      main.removeEventListener('toggle', nativeToggle, true);
      preference.removeEventListener('change', stopMotion);
      cancelAnimationFrame(refresh);
      tweens.forEach((tween, details) => {
        tween.kill(); details.style.removeProperty('height'); details.style.removeProperty('overflow'); delete details.dataset.expanding;
      });
      media.revert();
    };
  }, { dependencies: [pathname], revertOnUpdate: true });
  return <div ref={transition} className="page-transition" aria-hidden="true" />;
}
