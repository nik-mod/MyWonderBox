'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { prefersLightweightMode } from './device-performance';

const SiteMotionEffects = lazy(() => import('./site-motion-effects'));

export function SiteMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersLightweightMode()) {
      document.documentElement.dataset.lightweight = '';
      return () => { delete document.documentElement.dataset.lightweight; };
    }

    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(motion.matches);
    update();
    motion.addEventListener('change', update);
    return () => { motion.removeEventListener('change', update); };
  }, []);

  return enabled ? <Suspense fallback={null}><SiteMotionEffects /></Suspense> : null;
}
