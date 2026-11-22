'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { packagingColors, packagingDesigns, productHref } from '@/lib/packaging';
import type { Packaging, Product } from '@/lib/types';
import { allowMotion, gsap, ScrollTrigger, useGSAP } from './motion';
import type { OrbitalPose } from './orbital-scene';
import { PackagingPhoto } from './packaging-photo';
import './orbital-showcase.css';

const showcaseMotion = '(min-width: 1040px) and (min-height: 660px) and (pointer: fine) and ' + allowMotion;
const editionTitles = {
  'navy-yellow': 'ბიჭებისთვის',
  'pink-berry': 'გოგონებისთვის',
};
const stops = [.39, .915];
const editionChange = .624;

function EditionImage({ color, product }: { color: Packaging; product?: Product }) {
  return product?.image_url && product.image_url !== packagingDesigns[color].image
    ? <img src={product.image_url} alt={product.name} width={1440} height={960} loading="lazy" decoding="async" />
    : <PackagingPhoto color={color} />;
}

function EditionDetails({ color, product }: { color: Packaging; product?: Product }) {
  const href = product ? productHref(product.slug) : `/shop?packaging=${color}`;
  return (
    <>
      <h3><span>ყუთი</span>{' '}<span>{editionTitles[color]}</span></h3>
      {product && <p className="edition-price">{formatMoney(product.price_minor)}</p>}
      <Link href={href} className="edition-action">
        {product ? 'ყუთის ნახვა' : 'შეფუთვის ნახვა'} <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </>
  );
}

export function PackagingShowcase({ products }: { products: Product[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const catalog = packagingColors.map(color => products.find(item => item.published && item.packaging === color && item.stock > 0)
    ?? products.find(item => item.published && item.packaging === color));

  useGSAP(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvasHost = canvasRef.current;
    if (!section || !stage || !canvasHost) return;
    const media = gsap.matchMedia(section);
    let anchorFrame = 0;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (window.location.hash === '#collection' && navigation?.type !== 'back_forward') {
      // The browser can resolve the fragment before the homepage layout settles.
      anchorFrame = requestAnimationFrame(() => {
        if (window.location.hash === '#collection' && section.getBoundingClientRect().top > 160) {
          section.scrollIntoView({ behavior: 'instant' });
        }
      });
    }

    media.add(showcaseMotion, context => {
      if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
      const abort = new AbortController();
      let studio: Awaited<ReturnType<typeof import('./orbital-scene')['mountOrbitalScene']>> | undefined;
      let timeline: gsap.core.Timeline | undefined;
      const panels = Array.from(stage.querySelectorAll<HTMLElement>('.orbital-edition'));
      const buttons = Array.from(stage.querySelectorAll<HTMLButtonElement>('.orbital-variants button'));
      let sectionRefresh = 0;
      let active = -1;
      let pendingStart: (() => void) | undefined;
      const inspection = { x: 0, y: 0 };
      const inspect = () => studio?.inspect(inspection.x, inspection.y);
      const inspectX = gsap.quickTo(inspection, 'x', { duration: .7, ease: 'power3.out', onUpdate: inspect });
      const inspectY = gsap.quickTo(inspection, 'y', { duration: .7, ease: 'power3.out', onUpdate: inspect });
      const look = (event: PointerEvent) => {
        if (!triggerRef.current?.isActive) return;
        const bounds = canvasHost.getBoundingClientRect();
        inspectX((event.clientX - bounds.left) / bounds.width - .5);
        inspectY((event.clientY - bounds.top) / bounds.height - .5);
      };
      const resetView = () => { inspectX(0); inspectY(0); };
      canvasHost.addEventListener('pointermove', look);
      canvasHost.addEventListener('pointerleave', resetView);

      const setEdition = (index: number) => {
        if (index === active) return;
        const heldFocus = panels[active]?.contains(document.activeElement);
        active = index;
        stage.dataset.active = String(index);
        panels.forEach((panel, i) => { panel.inert = i !== index; });
        buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
        if (heldFocus) buttons[index].focus({ preventScroll: true });
      };

      function release() {
        canvasHost!.removeEventListener('pointermove', look);
        canvasHost!.removeEventListener('pointerleave', resetView);
        inspectX.tween.kill(); inspectY.tween.kill();
        abort.abort();
        if (pendingStart) window.removeEventListener('scroll', pendingStart);
        if (sectionRefresh) cancelAnimationFrame(sectionRefresh);
        triggerRef.current?.kill();
        triggerRef.current = null;
        timeline?.revert();
        studio?.dispose();
        delete section!.dataset.orbit;
        delete stage!.dataset.active;
      }

      const restorePhotos = () => {
        const wasPinned = triggerRef.current?.isActive;
        const hadFocus = stage.contains(document.activeElement);
        release();
        const edition = section.querySelectorAll('.collection-edition')[active];
        if (wasPinned && edition) {
          window.scrollTo({ top: edition.getBoundingClientRect().top + window.scrollY - 88, behavior: 'instant' });
        }
        if (hadFocus) edition?.querySelector<HTMLElement>('.edition-action')?.focus({ preventScroll: true });
      };

      const start = context.add('startOrbitalShowcase', () => {
        const pose: OrbitalPose = { angle: -.14, camera: 1.13, blush: 0, navyLid: 0, navyToys: 0, pinkLid: 0, pinkToys: 0 };
        const title = panels.map(panel => panel.querySelectorAll('h3 span'));
        const details = panels.map(panel => panel.querySelectorAll('.edition-price, .edition-action'));
        setEdition(0);
        studio?.draw(pose, true);
        section.dataset.orbit = 'ready';

        timeline = gsap.timeline({
          paused: true,
          defaults: { ease: 'none' },
          onUpdate() {
            studio?.draw(pose);
            setEdition(this.progress() >= editionChange ? 1 : 0);
          },
        });

        timeline
          .to(pose, { camera: 1, angle: 0, duration: .175, ease: 'sine.inOut' }, 0)
          .to(pose, { navyLid: 1, duration: .148, ease: 'sine.inOut' }, .128)
          .to(pose, { navyToys: 1, duration: .16, ease: 'sine.inOut' }, .216)
          .to(pose, { navyToys: 0, duration: .069, ease: 'sine.inOut' }, .424)
          .to(pose, { navyLid: 0, duration: .064, ease: 'sine.inOut' }, .493)
          .to(pose, { angle: Math.PI, duration: .148, ease: 'sine.inOut' }, .552)
          .to(pose, { blush: 1, duration: .177, ease: 'sine.inOut' }, .538)
          .to(stage, { backgroundColor: '#f3dce1', duration: .177, ease: 'sine.inOut' }, .538)
          .to(pose, { pinkLid: 1, duration: .121, ease: 'sine.inOut' }, .698)
          .to(pose, { pinkToys: 1, duration: .143, ease: 'sine.inOut' }, .752)
          .to(pose, { camera: 1.036, duration: .053, ease: 'sine.inOut' }, .947);

        const hidden = 'inset(100% -2px 0%)';
        const shown = 'inset(-4px -2px)';
        timeline
          .fromTo(title[0], { y: 16, clipPath: hidden }, { y: 0, clipPath: shown, duration: .075, stagger: .019 }, .035)
          .fromTo(details[0], { y: 9, opacity: 0 }, { y: 0, opacity: 1, duration: .065, stagger: .024 }, .09)
          .to(details[0], { y: -9, opacity: 0, duration: .039 }, .573)
          .to(title[0], { y: -12, clipPath: 'inset(0% -2px 100%)', duration: .043 }, .58)
          .fromTo(title[1], { y: 16, clipPath: hidden }, { y: 0, clipPath: shown, duration: .063, stagger: .018 }, .627)
          .fromTo(details[1], { y: 9, opacity: 0 }, { y: 0, opacity: 1, duration: .070, stagger: .019 }, .67);

        triggerRef.current = ScrollTrigger.create({
          id: 'joybox-orbital-showcase',
          animation: timeline,
          trigger: stage,
          start: 'top top',
          end: () => '+=' + gsap.utils.clamp(1240, 1760, window.innerHeight * 1.85),
          pin: true,
          scrub: .6,
          anticipatePin: 1,
          refreshPriority: -1,
        });
        sectionRefresh = requestAnimationFrame(() => ScrollTrigger.refresh());
      });

      const observer = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        try {
          const { mountOrbitalScene } = await import('./orbital-scene');
          if (abort.signal.aborted) return;
          studio = await mountOrbitalScene(canvasHost, abort.signal, restorePhotos);
          if (abort.signal.aborted) { studio.dispose(); return; }
          const enter = () => {
            // Allow a direct collection link to activate the scene. If loading
            // finishes deeper in the cards, wait for the next approach.
            if (section.getBoundingClientRect().top < -64 || section.contains(document.activeElement)) return;
            window.removeEventListener('scroll', enter);
            pendingStart = undefined;
            start();
          };
          pendingStart = enter;
          window.addEventListener('scroll', enter, { passive: true });
          enter();
        } catch {
          if (!abort.signal.aborted) release();
        }
      }, { rootMargin: '400px 0px' });

      observer.observe(section);
      return () => {
        observer.disconnect();
        release();
      };
    });

    return () => {
      cancelAnimationFrame(anchorFrame);
      media.revert();
    };
  }, { scope: sectionRef });

  const goToEdition = (index: number) => {
    const trigger = triggerRef.current;
    if (trigger) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * stops[index], behavior: 'smooth' });
  };

  return (
    <section className="edition-showcase" id="collection" ref={sectionRef} aria-label="სიურპრიზის ყუთები">
      <div className="edition-static container">
        <div className="collection-intro">
          <h2>სიურპრიზის ყუთები</h2>
          <Link href="/shop" className="edition-catalog-link">ყველა ყუთი <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="collection-editions">
          {packagingColors.map((color, index) => {
            const product = catalog[index];
            const href = product ? productHref(product.slug) : `/shop?packaging=${color}`;
            return (
              <article className="collection-edition" data-color={color} key={color}>
                <Link href={href} className="edition-image" aria-label={packagingDesigns[color].title}>
                  <EditionImage color={color} product={product} />
                </Link>
                <div className="collection-edition-copy">
                  <h3>{packagingDesigns[color].title}</h3>
                  {product && <p>{formatMoney(product.price_minor)}</p>}
                  <Link href={href} className="edition-action">ყუთის ნახვა <ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="orbital-stage" ref={stageRef}>
        <div className="orbital-header">
          <h2>სიურპრიზის ყუთები</h2>
          <Link href="/shop" className="edition-catalog-link">ყველა ყუთი <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="orbital-layout">
          <div className="orbital-visual" ref={canvasRef} aria-hidden="true" />
          <div className="orbital-copy">
            <div className="orbital-variants" role="group" aria-label="შეფუთვის არჩევა">
              {packagingColors.map((color, index) => (
                <button type="button" key={color} aria-pressed={index === 0} onClick={() => goToEdition(index)}>
                  <span className={`orbital-swatch orbital-swatch-${color}`} aria-hidden="true" />
                  {packagingDesigns[color].title}
                </button>
              ))}
            </div>
            <div className="orbital-editions">
              {packagingColors.map((color, index) => (
                <article className="orbital-edition" key={color} inert={index !== 0}>
                  <EditionDetails color={color} product={catalog[index]} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
