import { gsap, ScrollTrigger } from './motion';

const assets = ['box-interior', 'core', 'arm-left', 'arm-right', 'leg-left', 'leg-right'] as const;
type Art = Record<typeof assets[number], HTMLImageElement>;
const crop = { x: 875, y: 65, width: 625, height: 838 };
const legLayerSize = 184;
const radians = Math.PI / 180;

function poseAtStart() {
  return { x: 1090, y: 415, tilt: 0, squash: 1, wallShadow: 0,
    left: 38, right: -43, elbowLeft: 0, elbowRight: -5, wristRight: 0, grip: 0,
    braceLeft: 1, braceRight: 1, step: 0, leadExtension: 0, tuck: .18, plant: 0, seat: 0, shadow: 0 };
}

const restingPaws = [{ x: 1020, y: 487 }, { x: 1248, y: 468 }];
const pawsOnRim = [{ x: 1010, y: 506 }, { x: 1237, y: 490 }];
const feetOnRug = [{ x: 1148, y: 851 }, { x: 1254, y: 854 }];
const seatOnRug = { x: 1198, y: 848 };

function smoothRange(value: number, start: number, end: number) {
  const fraction = gsap.utils.clamp(0, 1, (value - start) / (end - start));
  return fraction * fraction * (3 - 2 * fraction);
}

function pawPosition(index: number, grip: number) {
  const rest = restingPaws[index];
  const rim = pawsOnRim[index];
  return { x: gsap.utils.interpolate(rest.x, rim.x, grip), y: gsap.utils.interpolate(rest.y, rim.y, grip) };
}

function clipInterior(ctx: CanvasRenderingContext2D, grip = 0, braceLeft = 0, braceRight = 0) {
  ctx.beginPath();
  ctx.moveTo(crop.x, crop.y);
  ctx.lineTo(crop.x + crop.width, crop.y);
  ctx.lineTo(crop.x + crop.width, 473);
  ctx.lineTo(922, 505);
  ctx.lineTo(crop.x, 494);
  ctx.closePath();
  for (const [index, brace] of [braceLeft, braceRight].entries()) {
    if (brace <= 0) continue;
    const paw = pawPosition(index, grip);
    ctx.moveTo(paw.x + 39 * brace, paw.y - 5);
    ctx.ellipse(paw.x, paw.y - 5, 39 * brace, 32 * brace, 0, 0, 2 * Math.PI);
  }
  ctx.clip();
}

// Transverse strips follow a continuous bend through the elbow. The sleeve
// and paw stay connected. During the climb the strip follows a curve to the rim.
function drawArm(
  ctx: CanvasRenderingContext2D, image: HTMLImageElement, p: ReturnType<typeof poseAtStart>, side: -1 | 1,
) {
  const x = 76 * side;
  const angle = side === -1 ? p.left : p.right;
  const bend = side === -1 ? p.elbowLeft : p.elbowRight;
  const wrist = side === 1 ? p.wristRight : 0;
  const brace = side === -1 ? p.braceLeft : p.braceRight;
  const paw = pawPosition(side === -1 ? 0 : 1, p.grip);
  ctx.save();
  ctx.translate(x, 32);
  const startX = 21 * Math.sin(angle * radians);
  const startY = -21 * Math.cos(angle * radians);
  const pitch = p.tilt * radians;
  const dx = paw.x - p.x;
  const dy = paw.y - p.y;
  const endX = dx * Math.cos(pitch) + dy * Math.sin(pitch) - x;
  const endY = (dy * Math.cos(pitch) - dx * Math.sin(pitch)) / p.squash - 32;
  const reach = Math.hypot(endX - startX, endY - startY);
  const elbowX = (startX + endX) / 2 + side * Math.min(22, reach * .16);
  const elbowY = (startY + endY) / 2;
  let px = startX;
  let py = startY;
  const rows = 28;
  const length = 166 - p.seat * 22;
  for (let row = 0; row < rows; row++) {
    const part = row / rows;
    const elbow = smoothRange(part, .31, .69);
    const palm = smoothRange(part, .72, .96);
    const turn = (angle + bend * elbow + wrist * palm) * radians;
    const sy = image.height * part;
    const sourceHeight = Math.min(image.height - sy, image.height / rows + 15);
    const rest = 1 - part;
    const bendX = rest * rest * startX + 2 * rest * part * elbowX + part * part * endX;
    const bendY = rest * rest * startY + 2 * rest * part * elbowY + part * part * endY;
    const tangentX = 2 * (rest * (elbowX - startX) + part * (endX - elbowX));
    const tangentY = 2 * (rest * (elbowY - startY) + part * (endY - elbowY));
    const vx = -Math.sin(turn) * length;
    const vy = Math.cos(turn) * length;
    ctx.save();
    ctx.translate(gsap.utils.interpolate(px, bendX, brace), gsap.utils.interpolate(py, bendY, brace));
    ctx.rotate(Math.atan2(-gsap.utils.interpolate(vx, tangentX, brace), gsap.utils.interpolate(vy, tangentY, brace)));
    const stripLength = gsap.utils.interpolate(length, Math.hypot(tangentX, tangentY), brace);
    const width = 84 - Math.abs(wrist) * palm * .56;
    ctx.drawImage(image, 0, sy, image.width, sourceHeight, -width / 2, 0, width, stripLength * sourceHeight / image.height);
    ctx.restore();
    px += vx / rows;
    py += vy / rows;
  }
  ctx.restore();
}

function drawCore(ctx: CanvasRenderingContext2D, image: HTMLImageElement, compression: number, taper: number) {
  const upperHeight = .6;
  const upperSource = image.height * upperHeight;
  const upperDrawn = 386 * upperHeight;
  ctx.drawImage(image, 0, 0, image.width, upperSource, -143, -184, 285, upperDrawn);
  // Leave the head and bow stable as the belly compresses under the tucked legs.
  const lowerTop = -184 + upperDrawn;
  const lowerSource = image.height - upperSource;
  const lowerDrawn = 386 - upperDrawn;
  const bands = 10;
  for (let band = 0; band < bands; band++) {
    const from = band / bands;
    const to = (band + 1) / bands;
    const top = lowerDrawn * from - compression * from * (.35 + .65 * from);
    const bottom = lowerDrawn * to - compression * to * (.35 + .65 * to);
    const inset = 142.5 * taper * from * from;
    ctx.drawImage(image, 0, upperSource + from * lowerSource, image.width, lowerSource / bands,
      -143 + inset, lowerTop + top, 285 - inset * 2, bottom - top);
  }
}

function legPose(p: ReturnType<typeof poseAtStart>, side: -1 | 1) {
  const pitch = p.tilt * radians;
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const toScene = (x: number, y: number) => ({
    x: p.x + x * cos - y * p.squash * sin,
    y: p.y + x * sin + y * p.squash * cos,
  });
  const lift = gsap.utils.clamp(0, 1, (p.tuck - .18) / .82);
  const reach = side === -1 ? p.leadExtension : 0;
  const isLead = side === -1;
  const hip = toScene(side * (47 + p.tuck * 9), 131 - p.tuck * 52 - p.seat * 36);
  const hanging = toScene(side * (53 + p.tuck * 20), 246 - p.tuck * 91 + side * p.step * 33);
  const reaching = {
    x: p.x + side * (49 + p.tuck * 9) - p.step * 9 - reach * 17,
    y: p.y + (243 - p.tuck * 93) * p.squash + side * p.step * 33 + reach * 24,
  };
  const rug = feetOnRug[isLead ? 0 : 1];
  const contact = isLead ? smoothRange(p.plant, 0, .7) : smoothRange(p.plant, .22, 1);
  const toe = {
    x: gsap.utils.interpolate(gsap.utils.interpolate(hanging.x, reaching.x, lift), rug.x, contact),
    y: Math.min(rug.y, gsap.utils.interpolate(gsap.utils.interpolate(hanging.y, reaching.y, lift), rug.y, contact)),
  };
  const height = toe.y - hip.y;
  return {
    hip, toe, height, contact, rug,
    toeDepth: Math.min(height * .68, 34 - contact * 2 + p.seat * 19 + lift * 8 - reach * 7),
    toeFur: .52 + contact * .28 - p.seat * .32 - lift * (isLead ? .08 : .015),
    curve: side * (lift * 9 + p.seat * 8 + 4),
    width: 81 + p.tuck * 4 + p.seat * 9 - contact * 4,
    front: Math.max(p.seat, lift * (isLead ? .92 : .42)),
  };
}

function drawLeg(ctx: CanvasRenderingContext2D, image: HTMLImageElement, leg: ReturnType<typeof legPose>) {
  const { hip, toe, height, toeDepth, toeFur, curve, width } = leg;
  if (height <= 0) return;
  const ankleX = gsap.utils.interpolate(hip.x, toe.x, .73) + curve;
  const ankleY = toe.y - toeDepth;
  const soleStart = Math.round(image.height * .55);
  const padStart = Math.round(image.height * .70);
  const draw = (sy: number, sourceHeight: number, x: number, y: number, dx: number, span: number) => {
    ctx.save();
    ctx.transform(1, 0, dx / span, 1, x - width / 2, y);
    ctx.drawImage(image, 0, sy, image.width, sourceHeight, 0, 0, width, span);
    ctx.restore();
  };
  const overlap = 3;
  const upperSpan = ankleY - hip.y;
  const upperRatio = (soleStart + overlap) / soleStart;
  draw(0, soleStart + overlap, hip.x, hip.y, (ankleX - hip.x) * upperRatio, upperSpan * upperRatio);

  // Roll the pad under the plush toe on contact. Only the lower foot changes
  // perspective, so the heel keeps its volume and the fur stays connected.
  const toeSplit = toeDepth * toeFur;
  const padX = gsap.utils.interpolate(ankleX, toe.x, toeFur);
  const furRatio = (padStart - soleStart + overlap) / (padStart - soleStart);
  draw(soleStart, padStart - soleStart + overlap, ankleX, ankleY, (padX - ankleX) * furRatio, toeSplit * furRatio);
  draw(padStart, image.height - padStart, padX, ankleY + toeSplit, toe.x - padX, toeDepth - toeSplit);
}

function drawForwardKnee(
  ctx: CanvasRenderingContext2D, layer: CanvasRenderingContext2D, image: HTMLImageElement,
  leg: ReturnType<typeof legPose>,
) {
  const { hip, toe, front, height, width } = leg;
  if (front <= 0 || height <= 0) return;
  const x = Math.floor(Math.min(hip.x, toe.x) - width / 2 - 24);
  const y = Math.floor(hip.y);
  const density = layer.canvas.width / legLayerSize;
  layer.setTransform(1, 0, 0, 1, 0, 0);
  layer.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  layer.setTransform(density, 0, 0, density, -x * density, -y * density);
  drawLeg(layer, image, leg);

  // The entire knee and paw come forward together. Feather the upper joint
  // into the belly, where the leg turns away, and keep the toe edge defined.
  layer.save();
  layer.globalCompositeOperation = 'destination-in';
  const join = layer.createLinearGradient(0, hip.y, 0, hip.y + height * .52);
  join.addColorStop(0, '#0000');
  join.addColorStop(1, '#000');
  layer.fillStyle = join;
  layer.fillRect(x, y, legLayerSize, legLayerSize);
  layer.restore();

  ctx.save();
  ctx.globalAlpha = front;
  ctx.drawImage(layer.canvas, x, y, legLayerSize, legLayerSize);
  ctx.restore();
}

function drawRugContact(
  ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, depth: number, opacity: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, depth / radius);
  const contact = ctx.createRadialGradient(0, 0, radius * .13, 0, 0, radius);
  contact.addColorStop(0, `rgba(48, 27, 18, ${opacity})`);
  contact.addColorStop(.5, `rgba(48, 27, 18, ${opacity * .37})`);
  contact.addColorStop(1, 'rgba(48, 27, 18, 0)');
  ctx.fillStyle = contact;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function clipSeatToPile(ctx: CanvasRenderingContext2D) {
  const { x, y } = seatOnRug;
  ctx.beginPath();
  ctx.moveTo(crop.x, crop.y);
  ctx.lineTo(crop.x + crop.width, crop.y);
  ctx.lineTo(crop.x + crop.width, y + 4);
  ctx.lineTo(x + 76, y + 4);
  // Small variations at the contact edge let the exposed carpet read as pile.
  for (let offset = 76; offset >= -76; offset -= 4) {
    ctx.lineTo(x + offset, y + Math.sin(offset * 1.9) * 1.3 + Math.sin(offset * .51) * 1.7);
  }
  ctx.lineTo(crop.x, y + 4);
  ctx.closePath();
  ctx.clip();
}

function paintBear(
  ctx: CanvasRenderingContext2D, actor: CanvasRenderingContext2D, art: Art,
  p: ReturnType<typeof poseAtStart>, legLayer: CanvasRenderingContext2D,
) {
  const leftLeg = legPose(p, -1);
  const rightLeg = legPose(p, 1);
  ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
  ctx.drawImage(art['box-interior'], 907, 202, 452, 321);

  if (p.wallShadow > .001) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(922, 505);
    ctx.lineTo(1445, 477);
    ctx.lineTo(1445, 775);
    ctx.lineTo(922, 797);
    ctx.closePath();
    ctx.clip();
    ctx.translate(p.x - 38, p.y + 100);
    ctx.scale(.8, 1.24);
    const shade = ctx.createRadialGradient(0, 0, 13, 0, 0, 153);
    shade.addColorStop(0, `rgba(53, 28, 13, ${p.wallShadow})`);
    shade.addColorStop(1, 'rgba(53, 28, 13, 0)');
    ctx.fillStyle = shade;
    ctx.fillRect(-153, -153, 306, 306);
    ctx.restore();
  }

  if (p.shadow > .001) {
    ctx.save();
    ctx.translate(p.x - 14, 855);
    ctx.scale(1, .175);
    const radius = 123 + (1 - p.shadow) * 36;
    const ink = ctx.createRadialGradient(0, 0, 6, 0, 0, radius);
    ink.addColorStop(0, `rgba(54, 30, 17, ${p.shadow * .52})`);
    ink.addColorStop(.53, `rgba(54, 30, 17, ${p.shadow * .19})`);
    ink.addColorStop(1, 'rgba(54,30,17,0)');
    ctx.fillStyle = ink;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
  for (const leg of [leftLeg, rightLeg]) {
    if (leg.contact > .001) drawRugContact(ctx, leg.rug.x - 3, leg.rug.y, 44, 10, leg.contact * .57);
  }
  const seatPressure = gsap.utils.clamp(0, 1, (p.seat - .58) / .42);
  if (seatPressure > 0) {
    drawRugContact(ctx, seatOnRug.x - 12, seatOnRug.y + 1, 89, 12, seatPressure * .56);
    drawRugContact(ctx, seatOnRug.x - 4, seatOnRug.y + 2, 59, 6, seatPressure * .72);
  }

  actor.clearRect(crop.x, crop.y, crop.width, crop.height);
  // While lifting, the carton wall and foreground toys occlude the lower body.
  // Tucked feet clear the rim before the matte is released.
  const behindRim = p.x < 1158;
  const transformBear = () => {
    actor.translate(p.x, p.y);
    actor.rotate(p.tilt * radians);
    actor.scale(1, p.squash);
  };
  actor.save();
  if (behindRim) clipInterior(actor, p.grip, p.braceLeft, p.braceRight);
  transformBear();
  drawArm(actor, art['arm-left'], p, -1);
  drawArm(actor, art['arm-right'], p, 1);
  actor.restore();

  actor.save();
  if (behindRim) clipInterior(actor);
  drawLeg(actor, art['leg-right'], rightLeg);
  drawLeg(actor, art['leg-left'], leftLeg);
  actor.save();
  if (seatPressure > 0) clipSeatToPile(actor);
  transformBear();
  // The face, neck, ribbon and chest share one piece of artwork and one pose.
  // Fold the lower torso behind the rising knees so the feet clear its
  // silhouette before the legs extend again on the way to the rug.
  const bellyCompression = p.seat * 24 + Math.max(0, p.tuck - .18) * 44 + p.plant * (1 - p.seat) * 12;
  if (bellyCompression > 0) drawCore(actor, art.core, bellyCompression, .12 * p.plant * (1 - p.seat));
  else actor.drawImage(art.core, -143, -184, 285, 386);
  actor.restore();
  drawForwardKnee(actor, legLayer, art['leg-right'], rightLeg);
  drawForwardKnee(actor, legLayer, art['leg-left'], leftLeg);
  actor.restore();

  // Grade the bear independently. The box and room keep their original colors.
  actor.save();
  actor.globalCompositeOperation = 'source-atop';
  const shade = .21 - p.shadow * .09;
  const light = actor.createLinearGradient(p.x - 140, 0, p.x + 130, 0);
  light.addColorStop(0, `rgba(47, 29, 22, ${shade + .10})`);
  light.addColorStop(1, `rgba(55, 37, 26, ${shade * .46})`);
  actor.fillStyle = light;
  actor.fillRect(crop.x, crop.y, crop.width, crop.height);
  actor.restore();
  ctx.drawImage(actor.canvas, crop.x, crop.y, crop.width, crop.height);
  if (behindRim) {
    // The yellow block sits in front of the bear until it clears the carton.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(1123, 457);
    ctx.lineTo(1177, 452);
    ctx.lineTo(1201, 459);
    ctx.lineTo(1201, 493);
    ctx.lineTo(1123, 497);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(art['box-interior'], 907, 202, 452, 321);
    ctx.restore();
  }
}

function startScene(hero: HTMLElement, track: HTMLElement, image: HTMLImageElement, canvas: HTMLCanvasElement, art: Art) {
  const ctx = canvas.getContext('2d');
  const actor = document.createElement('canvas').getContext('2d');
  const legLayer = document.createElement('canvas').getContext('2d');
  if (!ctx || !actor || !legLayer) return;
  const p = poseAtStart();
  const lens = { y: 50, rise: 0 };
  let copyOffset = 0;
  let wide = false;
  let risePosition = 38;
  let cameraCrop = 0;
  let horizontalPosition = 59;
  const measure = () => {
    const height = hero.offsetHeight;
    track.style.setProperty('--bear-hero-height', `${height}px`);
    copyOffset = window.innerWidth <= 850 ? Math.min(100, Math.max(0, height - window.innerHeight)) : 0;
    wide = window.innerWidth / window.innerHeight > 1.89;
    horizontalPosition = Number.parseFloat(getComputedStyle(image).objectPosition);
    const scale = widthScale();
    cameraCrop = image.offsetHeight - 941 * scale;
    const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    risePosition = cameraCrop < 0
      ? gsap.utils.clamp(0, 38, 100 * (103 * scale - headerHeight - 12) / -cameraCrop)
      : 38;
    canvas.style.width = `${crop.width * scale}px`;
    canvas.style.height = `${crop.height * scale}px`;
    canvas.style.left = `${image.offsetLeft + (image.offsetWidth - 1672 * scale) * horizontalPosition / 100 + crop.x * scale}px`;
    canvas.style.top = `${image.offsetTop + cameraCrop / 2 + crop.y * scale}px`;
  };
  const align = () => {
    const y = wide ? lens.y + (risePosition - 50) * lens.rise : 50;
    canvas.style.transform = wide ? `translateY(${cameraCrop * (y - 50) / 100}px)` : '';
    image.style.objectPosition = `${horizontalPosition}% ${y}%`;
  };
  const paint = () => {
    if (wide) align();
    if (copyOffset) track.style.setProperty('--bear-copy-y', `${copyOffset * Math.min(1, scene.progress() / .15)}px`);
    paintBear(ctx, actor, art, p, legLayer);
  };
  const scene = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' }, onUpdate: paint });
  // The first frame is also the static poster. Move the resting paws down
  // onto the rim as the bear leans in, then push off.
  scene.to(p, { y: 431, x: 1094, tilt: -4, squash: .96, left: 53,
    right: -59, elbowLeft: -24, elbowRight: 23, grip: 1, duration: .207 }, .02)
    // Push against the rim, bring the first knee up, and shift weight forward.
    .to(p, { y: 340, x: 1123, tilt: 5, squash: 1.015, tuck: 1, step: .79,
      left: 45, right: -54, elbowLeft: -26, elbowRight: 17, duration: .15 }, .227)
    .to(p, { braceRight: 0, duration: .11 }, .302)
    .to(p, { leadExtension: 1, duration: .094 }, .348)
    .to(p, { braceLeft: 0, duration: .086 }, .397)
    .to(p, { y: 294, x: 1159, tilt: 9, tuck: 1.04, step: -.44,
      left: 32, right: -61, elbowLeft: 23, elbowRight: -53, wristRight: 12, duration: .072 }, .377)
    .to(p, { x: 1188, tilt: 5, tuck: .62, step: -.84,
      left: 46, right: -53, elbowLeft: 12, elbowRight: -35, wristRight: 4, duration: .092 }, .449)
    .to(p, { leadExtension: 0, duration: .13 }, .466)
    .to(p, { y: 616, duration: .202, ease: 'power1.in' }, .449)
    .to(p, { wallShadow: .23, duration: .15 }, .444)
    // Extend the legs on the way down; catch the landing with a short squash.
    .to(p, { x: 1203, tilt: -2, squash: .95, tuck: 0, step: 0,
      left: 27, right: -24, elbowLeft: -15, elbowRight: 16, wristRight: 0, duration: .11, ease: 'power1.inOut' }, .541)
    .to(p, { shadow: .96, duration: .115 }, .535)
    .to(p, { plant: 1, duration: .067 }, .584)
    .to(p, { y: 600, x: 1198, squash: 1, tilt: 1, left: 16, right: -15,
      elbowLeft: -7, elbowRight: 5, duration: .078 }, .651)
    // The shoulder lifts first; the wrist follows each forearm change a beat later.
    .to(p, { right: -88, tilt: -3, x: 1195, duration: .083 }, .729)
    .to(p, { elbowRight: -63, wristRight: -12, duration: .074 }, .748)
    .to(p, { elbowRight: -29, tilt: -1, x: 1199, duration: .042 }, .822)
    .to(p, { wristRight: 11, duration: .045 }, .831)
    .to(p, { elbowRight: -66, tilt: -3, x: 1195, duration: .041 }, .864)
    .to(p, { wristRight: -11, duration: .049 }, .876)
    .to(p, { elbowRight: -34, duration: .049 }, .905)
    .to(p, { x: seatOnRug.x, y: 683, tilt: -2, squash: .975, seat: 1, wallShadow: .14,
      left: 35, right: -31, elbowLeft: -31, duration: .131 }, .937)
    .to(p, { elbowRight: 26, wristRight: 10, duration: .114 }, .954)
    .to(lens, { rise: 1, duration: .22 }, .18)
    .to(lens, { y: 92, rise: 0, duration: .25 }, .43)
    .to({}, { duration: .032 }, 1.068);

  const density = Math.min(1.5, Math.max(1, widthScale() * window.devicePixelRatio));
  canvas.width = Math.round(crop.width * density);
  canvas.height = Math.round(crop.height * density);
  ctx.setTransform(density, 0, 0, density, -crop.x * density, -crop.y * density);
  actor.canvas.width = canvas.width;
  actor.canvas.height = canvas.height;
  actor.setTransform(density, 0, 0, density, -crop.x * density, -crop.y * density);
  legLayer.canvas.width = Math.round(legLayerSize * density);
  legLayer.canvas.height = legLayer.canvas.width;
  measure();
  align();
  paintBear(ctx, actor, art, p, legLayer);
  track.dataset.bear = 'ready';
  // The next film can refresh ScrollTrigger while the hero is mid-gesture.
  // Keep the playhead tween separate so that refresh cannot pause the gesture.
  const playhead = { value: 0 };
  let targetProgress = 0;
  const scrub = gsap.quickTo(playhead, 'value', {
    duration: .42, ease: 'expo.out', onUpdate: () => scene.progress(playhead.value),
  });
  const seek = ({ progress }: ScrollTrigger) => {
    if (progress === targetProgress) return;
    targetProgress = progress;
    scrub(progress);
  };
  const trigger = ScrollTrigger.create({
    id: 'joybox-hero-bear',
    trigger: track,
    start: () => `top top-=${Math.max(0, -Number.parseFloat(getComputedStyle(hero).top))}`,
    end: 'bottom bottom',
    refreshPriority: 2,
    onUpdate: seek,
    onRefresh: seek,
    onRefreshInit() { image.style.removeProperty('object-position'); measure(); align(); },
  });
  const resize = new ResizeObserver(() => ScrollTrigger.refresh(true));
  resize.observe(hero);
  ScrollTrigger.refresh();
  return () => {
    resize.disconnect();
    trigger.kill();
    scrub.tween.kill();
    scene.kill();
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    delete track.dataset.bear;
    track.style.removeProperty('--bear-hero-height');
    track.style.removeProperty('--bear-copy-y');
    image.style.removeProperty('object-position');
  };

  function widthScale() {
    return Math.max(image.offsetWidth / 1672, image.offsetHeight / 941);
  }
}

export function mountHeroBear(hero: HTMLElement, context: gsap.Context) {
  const track = hero.closest<HTMLElement>('.hero-bear-track');
  const canvas = hero.querySelector<HTMLCanvasElement>('.hero-bear');
  const image = hero.querySelector<HTMLImageElement>('.hero-photo img');
  if (!track || !canvas || !image) return;
  let alive = true;
  let loading = false;
  let art: Art | undefined;
  let stop: (() => void) | undefined;
  const install = context.add('installHeroBear', () => { if (art) stop = startScene(hero, track, image, canvas, art); });
  const load = () => {
    if (!alive || window.scrollY > 120) return;
    if (art) {
      if (!image.complete || !image.naturalWidth) return;
      install();
      window.removeEventListener('scroll', load);
    } else if (!loading) {
      loading = true;
      void Promise.all(assets.map(async name => {
        const part = new Image();
        part.fetchPriority = 'low';
        part.src = `/brand/hero-teddy/${name}.webp`;
        await part.decode();
        return [name, part] as const;
      })).then(entries => {
        if (!alive) return;
        art = Object.fromEntries(entries) as Art;
        load();
      }).catch(() => window.removeEventListener('scroll', load));
    }
  };
  image.addEventListener('load', load, { once: true });
  window.addEventListener('scroll', load, { passive: true });
  load();
  return () => {
    alive = false;
    stop?.();
    image.removeEventListener('load', load);
    window.removeEventListener('scroll', load);
  };
}
