import type { RefObject } from 'react';
import { allowMotion, gsap, useGSAP, wideMotion } from './motion';
import { prefersLightweightMode } from './device-performance';

const bearMotion = '(min-width: 320px) and (min-height: 600px) and (max-aspect-ratio: 12/5) and ' + allowMotion;

export function useHeroMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const hero = root.current?.querySelector<HTMLElement>('.hero-cinema');
    if (!hero || prefersLightweightMode()) return;
    const track = hero.closest('.hero-bear-track') ?? hero;
    const media = gsap.matchMedia(hero);

    media.add(allowMotion, () => {
      if (window.scrollY < 80) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('.hero-photo', { scale: 1.045, yPercent: .65 }, {
            scale: 1, yPercent: 0, duration: 1.08, ease: 'power2.out', clearProps: 'transform',
          }, 0)
          .fromTo('.hero-exposure', { opacity: .23 }, {
            opacity: 0, duration: .84, ease: 'power2.out', clearProps: 'opacity',
          }, .03)
          .fromTo('.hero-title-reveal', { y: 12 }, {
            y: 0, duration: .68, stagger: .1, clearProps: 'transform',
          }, .08)
          .fromTo('.hero-copy > p', { y: 7, opacity: .84 }, {
            y: 0, opacity: 1, duration: .52, clearProps: 'transform,opacity',
          }, .22)
          .fromTo('.hero-action', { y: 7, opacity: .82 }, {
            y: 0, opacity: 1, duration: .52, clearProps: 'transform,opacity',
          }, .3);
      }

      gsap.to('.hero-shutter', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'bottom center', end: 'bottom top', scrub: .35 },
      });
    });

    media.add(wideMotion, () => {
      // The photograph moves as a single plate. Scroll owns the camera.
      gsap.to('.hero-lens', {
        scale: 1.12, yPercent: 3.2, ease: 'none',
        scrollTrigger: { id: 'joybox-hero-camera', trigger: track, start: 'top top', end: 'bottom top', scrub: .45 },
      });
    });

    media.add(bearMotion, context => {
      // Direct links to sections below the hero keep their original scroll position.
      if (['#how', '#collection', '#unboxing'].includes(window.location.hash)) return;
      let active = true;
      let stop: (() => void) | undefined;
      void import('./hero-bear').then(({ mountHeroBear }) => {
        if (active) stop = mountHeroBear(hero, context);
      }).catch(() => { /* The hero photograph is already visible. */ });
      return () => { active = false; stop?.(); };
    });
    return () => media.revert();
  }, { scope: root });
}
