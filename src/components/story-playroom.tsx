import { Hand } from 'lucide-react';
import type { MouseEvent } from 'react';
import { prefersLightweightMode } from './device-performance';
import './story-playroom.css';

const toys = [
  { id: 'rocket', label: 'რაკეტის გაშვება', w: 275, h: 506, duration: 1250,
    poses: ['translateY(3%) scaleY(.96)', 'translate(3%,-16%) rotate(6deg)', 'translate(4%,-24%) rotate(3deg)', 'translateY(-7%)', 'scaleY(.96)'] },
  { id: 'rings', label: 'რგოლების შერხევა', w: 380, h: 506, duration: 720,
    poses: ['rotate(-8deg)', 'rotate(7deg)', 'rotate(-4deg)', 'rotate(2deg)'] },
  { id: 'bear', label: 'დათუნიას ახტუნება', w: 304, h: 506, duration: 860,
    poses: ['scale(1.025,.96)', 'translateY(-13%) rotate(-6deg)', 'translateY(-8%) rotate(3deg)', 'scale(1.02,.98)'] },
  { id: 'camera', label: 'კამერის ღილაკზე დაჭერა', w: 506, h: 412, duration: 510,
    poses: ['scale(.94) rotate(3deg)', 'scale(1.025)', 'scale(.99)'] },
  { id: 'car', label: 'მანქანის გაგორება', w: 506, h: 333, duration: 980,
    poses: ['translate(-6%,-3%) rotate(-3deg)', 'translate(22%,9%) rotate(3deg)', 'translate(17%,7%)', 'translate(-2%,0)'] },
  { id: 'cube', label: 'კუბის გადაგორება', w: 471, h: 506, duration: 720,
    poses: ['translate(-5%,-6%) rotate(-9deg)', 'translate(9%,-16%) rotate(17deg)', 'translate(10%,0) rotate(8deg)', 'rotate(-3deg)'] },
  { id: 'top', label: 'ბზრიალას დატრიალება', w: 464, h: 470, duration: 1040,
    poses: ['rotate(-11deg) scaleX(.92)', 'rotate(10deg) scaleX(1.06)', 'rotate(-7deg) scaleX(.95)', 'rotate(4deg)'] },
  { id: 'palette', label: 'პალიტრის შერხევა', w: 479, h: 276, duration: 540,
    poses: ['rotate(-10deg)', 'rotate(6deg)', 'rotate(-3deg)'] },
] as const;

function playToy(event: MouseEvent<HTMLButtonElement>, toy: typeof toys[number]) {
  const button = event.currentTarget;
  const artwork = button.querySelector('img');
  const shadow = button.querySelector<HTMLElement>('.story-play-shadow');
  if (!artwork || !shadow) return;

  [button, artwork, shadow].forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
  if (prefersLightweightMode() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    artwork.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.25)' }, { filter: 'brightness(1)' }], 350);
    return;
  }

  artwork.animate(['none', ...toy.poses, 'none'].map(transform => ({ transform, easing: 'ease-in-out' })), toy.duration);
  shadow.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: toy.id === 'car' ? 'translate(24%,12%)' : 'scale(.8)', opacity: .52 },
    { transform: 'scale(1)', opacity: 1 },
  ], { duration: toy.duration, easing: 'ease-in-out' });
  if (toy.id === 'camera') {
    button.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.34)', offset: .22 }, { filter: 'brightness(1)' }], 480);
  }
}

export function StoryPlayroom() {
  return (
    <section className="brand-story story-edition story-playroom" id="unboxing" aria-labelledby="toy-story-heading">
      <div className="story-edition-copy">
        <h2 id="toy-story-heading">სათამაშოების მაგალითები</h2>
        <div className="story-play-hint" id="toy-story-controls"><Hand size={16} aria-hidden="true" /> შეეხე სათამაშოებს</div>
      </div>
      <div className="story-play-floor" role="group" aria-labelledby="toy-story-controls">
        {toys.map(toy => (
          <button type="button" className={`story-play-prop play-${toy.id}`} key={toy.id} aria-label={toy.label}
            onClick={event => playToy(event, toy)}>
            <span className="story-play-shadow" aria-hidden="true" />
            <img src={`/brand/story-play/${toy.id}.webp`}
              srcSet={`/brand/story-play/${toy.id}-compact.webp ${Math.round(toy.w * 260 / Math.max(toy.w, toy.h))}w, /brand/story-play/${toy.id}.webp ${toy.w}w`}
              sizes="(max-width: 600px) 115px, (max-width: 850px) 185px, (max-width: 1600px) 250px, 365px"
              width={toy.w} height={toy.h} alt="" loading="lazy" decoding="async" draggable={false} />
          </button>
        ))}
      </div>
    </section>
  );
}
