'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { messengerOrdering } from '@/lib/preview-copy';
import { howSteps } from './how-content';
import { JourneyGlints, JourneyToys } from './journey-toys';
import { allowMotion, gsap, ScrollTrigger, useGSAP } from './motion';
import './how-journey.css';

const chapters = [
  { ...howSteps[0], label: 'არჩევა', stop: .12 },
  { ...howSteps[1], label: 'მიწოდება', stop: .36 },
  { ...howSteps[2], label: 'გახსნა', stop: .85 },
];
const cuts = [.28, .47];
const fps = 24;
// The boxes stay closed during selection and delivery, then open during the longer reveal.
// The last 6% of the scroll holds the final frame.
const filmAnchors = [[0, 0], [cuts[0], .083], [cuts[1], .16], [.94, 1], [1, 1]];
function filmTime(progress: number, duration: number) {
  const p = Math.max(0, Math.min(1, progress));
  const end = Math.max(0, duration - 1 / fps);
  for (let i = 1; i < filmAnchors.length; i++) {
    const [to, value] = filmAnchors[i], [from, prior] = filmAnchors[i - 1];
    if (p <= to) return (prior + (value - prior) * (p - from) / (to - from)) * end;
  }
  return end;
}
export function HowJourney() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'loading' | 'ready' | 'still' | 'error'>('loading');
  useGSAP(() => {
    const page = root.current, video = videoRef.current;
    const stage = page?.querySelector<HTMLElement>('.journey-stage');
    if (!page || !stage || !video) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: reduce), (max-height: 649px)', () => setMode('still'));
    media.add(allowMotion + ' and (min-height: 650px)', context => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (connection?.saveData || connection?.effectiveType?.endsWith('2g')) { setMode('still'); return; }
      setMode('loading');
      setActive(0);
      let disposed = false, failed = false, ready = false;
      let raf = 0, target = 0, progress = 0, currentChapter = 0, seekStarted = 0, slowSeeks = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let seekDeadline: ReturnType<typeof setTimeout> | undefined;
      let trigger: ScrollTrigger | undefined;
      const rows = Array.from(stage.querySelectorAll<HTMLElement>('.journey-chapter'));
      const advance = gsap.quickSetter(stage.querySelector('.journey-progress-fill'), 'scaleX');
      if (window.scrollY < 120) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.journey-title-ink', { yPercent: 105, duration: .9, stagger: .12, clearProps: 'transform' }, .05)
          .from('.journey-intro-foot', { y: 12, opacity: 0, duration: .6, clearProps: 'transform,opacity' }, .4);
      }
      gsap.from('.journey-end h2', { y: 32, opacity: .5, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.journey-end', start: 'top 85%', once: true } });
      const seekLatest = () => {
        if (!ready || disposed || failed || video.seeking || raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (video.seeking || Math.abs(video.currentTime - target) < .5 / fps) return;
          seekStarted = performance.now();
          try {
            clearTimeout(seekDeadline);
            video.currentTime = target + .125 / fps;
            seekDeadline = setTimeout(() => {
              if (video.seeking) fallback('still');
            }, 2500);
          } catch { fallback('error'); }
        });
      };
      const playhead = { progress: 0 };
      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: () => {
        progress = playhead.progress;
        const next = progress >= cuts[1] ? 2 : progress >= cuts[0] ? 1 : 0;
        if (next !== currentChapter) { currentChapter = next; setActive(next); }
        advance(progress);
        if (ready) {
          target = Math.round(filmTime(progress, video.duration) * fps) / fps;
          seekLatest();
        }
      } });
      timeline.to(playhead, { progress: 1, duration: 1 }, 0);
      cuts.forEach((cut, index) => {
        timeline.to(rows[index], { clipPath: 'inset(0 0 100% 0)', y: -18, autoAlpha: 0, duration: .035 }, cut - .035)
          .fromTo(rows[index + 1], { clipPath: 'inset(100% 0 0 0)', y: 18, autoAlpha: 0 },
            { clipPath: 'inset(0% 0 0 0)', y: 0, autoAlpha: 1, duration: .05, immediateRender: false }, cut);
      });
      const enhance = context.add('enhance', () => {
        stage.dataset.enhanced = 'true';
        gsap.set(rows.slice(1), { clipPath: 'inset(100% 0 0 0)', y: 18, autoAlpha: 0 });
        gsap.set(rows[0], { clipPath: 'inset(0% 0 0 0)', y: 0, autoAlpha: 1 });
        trigger = ScrollTrigger.create({
          id: 'joybox-journey', trigger: stage, animation: timeline,
          start: () => `top top+=${document.querySelector('.site-header')?.clientHeight ?? 88}`,
          end: () => '+=' + Math.round(window.innerHeight * (window.innerWidth < 700 ? 2.1 : 2.5)),
          pin: true, scrub: .38, invalidateOnRefresh: true, anticipatePin: 1,
        });
        // The timeline is already populated. Establish the pin before exposing the ready state.
        trigger.refresh();
        triggerRef.current = trigger;
      });
      function fallback(reason: 'still' | 'error') {
        if (failed || disposed) return;
        failed = true;
        const before = stage!.getBoundingClientRect().top, anchored = trigger?.isActive;
        trigger?.kill(); triggerRef.current = null; timeline.kill();
        if (raf) cancelAnimationFrame(raf);
        if (timer) clearTimeout(timer);
        clearTimeout(seekDeadline);
        delete stage!.dataset.enhanced;
        gsap.set(rows, { clearProps: 'all' });
        setMode(reason);
        video!.removeAttribute('src'); video!.load();
        if (trigger) ScrollTrigger.refresh();
        // Preserve the visible section anchor if a decoder fails while pinned.
        if (anchored) window.scrollBy({ top: stage!.getBoundingClientRect().top - before, behavior: 'instant' });
      }
      const onReady = () => {
        if (failed || disposed || ready || !Number.isFinite(video.duration) || video.duration < 1 || video.readyState < 2) return;
        if (stage.getBoundingClientRect().bottom < 90 || window.location.hash === '#journey-end') {
          fallback('still');
          return;
        }
        ready = true;
        if (timer) clearTimeout(timer);
        enhance();
        setMode('ready');
        target = Math.round(filmTime(progress, video.duration) * fps) / fps;
        seekLatest();
      };
      const seeked = () => {
        clearTimeout(seekDeadline);
        if (failed || disposed) return;
        slowSeeks = seekStarted && performance.now() - seekStarted > 900 && !document.hidden ? slowSeeks + 1 : 0;
        if (slowSeeks >= 3) { fallback('still'); return; }
        seekLatest();
      };
      const onError = () => fallback('error');
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('seeked', seeked);
      video.addEventListener('error', onError);
      let nearFilm = false;
      let requested = false;
      const loadFilm = () => {
        if (!nearFilm || requested || failed || disposed || window.scrollY <= 24) return;
        requested = true;
        observer.disconnect();
        window.removeEventListener('scroll', loadFilm);
        video.src = window.innerWidth <= 850 ? '/brand/mywonderbox/how-journey-mobile.mp4' : '/brand/mywonderbox/how-journey.mp4';
        video.load();
        timer = setTimeout(() => { if (!ready) fallback('error'); }, 15000);
      };
      const observer = new IntersectionObserver(([entry]) => {
        nearFilm = entry.isIntersecting;
        loadFilm();
      }, { rootMargin: '420px 0px' });
      observer.observe(stage);
      window.addEventListener('scroll', loadFilm, { passive: true });
      return () => {
        disposed = true; observer.disconnect();
        window.removeEventListener('scroll', loadFilm);
        if (timer) clearTimeout(timer);
        clearTimeout(seekDeadline);
        if (raf) cancelAnimationFrame(raf);
        trigger?.kill(); triggerRef.current = null; timeline.kill();
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('seeked', seeked);
        video.removeEventListener('error', onError);
        video.removeAttribute('src'); video.load();
        delete stage.dataset.enhanced;
      };
    });
    return () => media.revert();
  }, { scope: root });
  const jump = (index: number) => {
    const trigger = triggerRef.current;
    if (trigger) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * chapters[index].stop, behavior: 'smooth' });
    else { setActive(index); document.getElementById(`journey-step-${index}`)?.scrollIntoView({ behavior: 'auto', block: 'center' }); }
  };
  return <main id="main" ref={root} className="how-journey" data-mode={mode}>
    <section className="journey-intro">
      <JourneyGlints scene="intro" />
      <div className="journey-intro-inner">
        <div className="journey-intro-copy">
          <h1 className="journey-intro-title"><span><span className="journey-title-ink">როგორ მუშაობს</span></span>{' '}<span lang="en"><span className="journey-title-ink">MyWonderBox?</span></span></h1>
          <div className="journey-intro-foot">
            <a href="#journey-film" className="button button-yellow journey-begin">ეტაპების ნახვა <ArrowDown size={20} aria-hidden="true" /></a>
          </div>
        </div>
        <JourneyToys scene="intro" />
      </div>
    </section>
    <section className="journey-film" id="journey-film" aria-label="MyWonderBox-ის აღმოჩენის სამი ეტაპი">
      <div className="journey-stage">
        <JourneyGlints scene="film" />
        <div className="journey-stage-top"><a href="#journey-end">ყუთებზე გადასვლა <ArrowUpRight size={15} aria-hidden="true" /></a></div>
        <div className="journey-composition">
          <ol className="journey-chapters">
            {chapters.map(({ title, description }, index) => <li className="journey-chapter" id={`journey-step-${index}`} key={title}>
              <div className="journey-chapter-number" aria-hidden="true">0{index + 1}</div>
              <h2>{title}</h2><p>{description}</p>
            </li>)}
          </ol>
          <figure className="journey-screen">
            <div className="journey-picture">
              <picture>
                <source media="(max-width: 850px)" srcSet="/brand/mywonderbox/how-journey-poster-compact.webp" />
                <img src="/brand/mywonderbox/how-journey-poster.webp" width={1280} height={720}
                  alt="MyWonderBox-ის ლურჯ-ყვითელი და ვარდისფერი სიურპრიზის ყუთები" loading="lazy" decoding="async" />
              </picture>
              <video ref={videoRef} muted playsInline preload="none" aria-hidden="true" disablePictureInPicture />
            </div>
          </figure>
        </div>
        <JourneyToys scene="film" />
        <div className="journey-stage-bottom">
          <nav className="journey-milestones" aria-label="აირჩიე აღმოჩენის ეტაპი">
            <div className="journey-progress-track" aria-hidden="true"><span className="journey-progress-fill" /></div>
            {chapters.map(({ label }, index) => <button type="button" key={label} aria-current={active === index ? 'step' : undefined} onClick={() => jump(index)}>
              {label}
            </button>)}
          </nav>
          {mode === 'error' && <span className="journey-scroll-note" role="status">ვიდეო ვერ ჩაიტვირთა. ეტაპები ზემოთ შეგიძლია წაიკითხო.</span>}
        </div>
      </div>
    </section>
    <section className="journey-end" id="journey-end">
      <div className="journey-end-inner">
        <JourneyGlints scene="end" />
        <h2>სიურპრიზის ყუთები</h2>
        <p>{messengerOrdering}</p>
        <div className="journey-end-actions">
          <Link className="button button-yellow" href="/shop">ყუთების ნახვა <ArrowRight size={21} aria-hidden="true" /></Link>
          <Link className="text-link" href="/faq">კითხვები და პასუხები <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <JourneyToys scene="end" />
      </div>
    </section>
  </main>;
}
