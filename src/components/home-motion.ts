import type { RefObject } from 'react';
import { useHeroMotion } from './hero-motion';
import { allowMotion, editorialEase, gsap, useGSAP } from './motion';
import { prefersLightweightMode } from './device-performance';

export function useHomeMotion(root: RefObject<HTMLElement | null>) {
  useHeroMotion(root);
  useGSAP(() => {
    if (!root.current || prefersLightweightMode()) return;
    const media = gsap.matchMedia(root.current);
    media.add(allowMotion, () => {
      gsap.fromTo('.story-edition-copy', { y: 18, opacity: .78 }, {
        y: 0, opacity: 1, duration: .68, ease: editorialEase, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.story-edition', start: 'top 82%', once: true },
      });
    });
    return () => media.revert();
  }, { scope: root });
}
