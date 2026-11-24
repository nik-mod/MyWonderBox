/* Run against a production preview: JOYBOX_QA_URL=http://localhost:3098 node tests/how-journey.browser.cjs */
const { chromium, webkit, firefox } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.JOYBOX_QA_URL || 'http://localhost:3098';
const out = process.env.MYWONDERBOX_QA_OUTPUT || 'docs/qa/how-video';
fs.mkdirSync(out, { recursive: true });
const report = { base, checks: [], seekLatencyMs: [], limitations: ['Browser emulation is not physical iOS Safari or Android hardware.'] };
const pass = (name, detail) => { report.checks.push({ name, detail }); console.log('PASS', name, detail ?? ''); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const inspect = page => page.locator('video').evaluate(v => ({ time: v.currentTime, duration: v.duration, paused: v.paused, ready: v.readyState }));
const bounds = page => page.locator('.journey-stage').evaluate(el => ({
  start: el.parentElement.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').clientHeight,
  distance: el.parentElement.offsetHeight - el.offsetHeight,
}));
async function scrub(page, fraction, geometry) {
  await page.evaluate(({ start, distance, fraction }) => scrollTo({ top: start + distance * fraction, behavior: 'instant' }), { ...geometry, fraction });
  await wait(650);
  return inspect(page);
}
async function openFilm(page) {
  await page.locator('.journey-begin').click();
  await page.waitForSelector('[data-mode="ready"]');
  await wait(700);
}
async function setDeviceHints(page, memory) {
  await page.addInitScript(memory => {
    Object.defineProperty(navigator, 'deviceMemory', { get: () => memory });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
  }, memory);
}
async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await setDeviceHints(p, 8);
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base + '/how-it-works');
  await wait(700);
  assert.equal(await p.locator('video').getAttribute('src'), null);
  await p.screenshot({ path: out + '/final-intro-desktop.png' });
  await openFilm(p);
  const { duration } = await inspect(p);
  assert.ok(Math.abs(duration - 10) < .1, 'The supplied ten-second film is loaded');
  const geometry = await bounds(p);
  await p.locator('video').evaluate(v => {
    let start = 0; window.__journeyLatencies = [];
    v.addEventListener('seeking', () => start = performance.now());
    v.addEventListener('seeked', () => { if (start) window.__journeyLatencies.push(performance.now() - start); });
  });
  const times = [];
  for (const fraction of [.12, .36, .55, .85, .98]) {
    const state = await scrub(p, fraction, geometry);
    assert.equal(state.paused, true); assert.ok(state.ready >= 2);
    times.push(state.time);
    await p.screenshot({ path: out + `/final-chapter-${fraction}.png` });
  }
  assert.ok(times.every((time, i) => i === 0 || time > times[i - 1]));
  pass('Forward scrub advances a paused video', times);
  const reverse = await scrub(p, .36, geometry);
  assert.ok(Math.abs(reverse.time - times[1]) < .09);
  pass('Reverse returns to the same frame', reverse.time);
  const held = (await inspect(p)).time; await wait(500);
  assert.equal((await inspect(p)).time, held); pass('Scroll interruption holds frame');
  for (const fraction of [.9, .15, .75, .22]) {
    await p.evaluate(({ start, distance, fraction }) => scrollTo({ top: start + distance * fraction, behavior: 'instant' }), { ...geometry, fraction });
    await wait(25);
  }
  await wait(850);
  assert.ok((await inspect(p)).time < duration * .16); pass('Rapid scrolling converges to latest target');
  await p.locator('.journey-milestones button').nth(2).focus();
  await p.locator('.journey-milestones button').nth(2).press('Enter');
  await p.waitForFunction(() => {
    const video = document.querySelector('video');
    return video.currentTime > video.duration * .75;
  });
  pass('Keyboard-accessible milestones seek chapters');
  report.seekLatencyMs = await p.evaluate(() => window.__journeyLatencies);
  for (const width of [375, 390, 768, 1024, 1440, 1920]) {
    await p.setViewportSize({ width, height: 1000 }); await wait(400);
    const layout = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, stageBottom: document.querySelector('.journey-stage').getBoundingClientRect().bottom }));
    assert.equal(layout.overflow, false);
    const media = await p.locator('.journey-picture video').evaluate(v => ({ fit: getComputedStyle(v).objectFit, controls: v.controls }));
    assert.equal(media.fit, 'contain'); assert.equal(media.controls, false);
  }
  pass('Resize / 375–1920px / undistorted media / no controls');
  await p.locator('.journey-stage-top a').click(); await wait(1100);
  await p.locator('.journey-end .button').click(); await p.waitForURL('**/shop');
  assert.equal(await p.locator('.journey-stage').count(), 0);
  assert.equal(await p.locator('.pin-spacer').count(), 0);
  pass('Final CTA navigation and pin cleanup');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base + '/how-it-works'); await openFilm(p);
  assert.ok((await p.locator('video').getAttribute('src')).includes('mobile'));
  const mobile = await scrub(p, .8, await bounds(p)); assert.ok(mobile.time > mobile.duration * .7);
  await p.screenshot({ path: out + '/final-mobile-scrub.png' }); pass('Mobile encoded source and scrub', mobile.time);
  await p.getByRole('button', { name: 'მენიუს გახსნა' }).click();
  await p.locator('.mobile-menu[open] a[href="/shop"]').click(); await p.waitForURL('**/shop');
  assert.equal(await p.locator('.pin-spacer').count(), 0); pass('Mobile navigation works while pinned and releases scene');
  const touch = await browser.newPage({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  await setDeviceHints(touch, 8);
  await touch.goto(base + '/how-it-works'); await openFilm(touch);
  const touchFrame = await scrub(touch, .85, await bounds(touch));
  assert.ok(touchFrame.time > touchFrame.duration * .75); pass('Touch/mobile Chrome emulation');
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  let mediaRequests = 0;
  reduced.on('request', r => { if (r.url().includes('how-journey') && r.url().endsWith('.mp4')) mediaRequests++; });
  await reduced.goto(base + '/how-it-works'); await reduced.waitForSelector('[data-mode="still"]');
  assert.equal(mediaRequests, 0); assert.equal(await reduced.locator('.pin-spacer').count(), 0);
  for (const row of await reduced.locator('.journey-chapter').all()) assert.equal(await row.isVisible(), true);
  await reduced.screenshot({ path: out + '/final-reduced-motion.png', fullPage: true }); pass('Reduced-motion still: no video request, no pin, all chapters');
  const lightweight = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await setDeviceHints(lightweight, 2);
  const lightweightMedia = [];
  lightweight.on('request', request => { if (request.url().endsWith('.mp4')) lightweightMedia.push(request.url()); });
  await lightweight.goto(base + '/how-it-works');
  const stillJourney = lightweight.locator('.how-journey[data-mode="still"]:visible');
  await stillJourney.waitFor();
  await stillJourney.locator('.journey-begin').click();
  const lastMilestone = stillJourney.locator('.journey-milestones button').last();
  await lastMilestone.click();
  assert.equal(await lastMilestone.getAttribute('aria-current'), 'step');
  assert.equal(await stillJourney.locator('video').getAttribute('src'), null);
  assert.equal(await lightweight.locator('.pin-spacer').count(), 0);
  assert.deepEqual(lightweightMedia, []);
  pass('2 GB device: static steps stay interactive without loading video');
  const broken = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await setDeviceHints(broken, 8);
  await broken.route('**/how-journey*.mp4', route => route.abort());
  await broken.goto(base + '/how-it-works'); await broken.locator('.journey-begin').click();
  await broken.waitForSelector('[data-mode="error"]');
  assert.equal(await broken.locator('.pin-spacer').count(), 0);
  for (const row of await broken.locator('.journey-chapter').all()) assert.equal(await row.isVisible(), true);
  pass('Network failure restores static narrative');
  const range = await p.request.get(base + '/brand/mywonderbox/how-journey.mp4', { headers: { Range: 'bytes=0-1023' } });
  assert.equal(range.status(), 206); pass('HTTP byte ranges', range.headers()['content-range']);
  assert.deepEqual(errors, []); pass('No Chromium page errors');
  await browser.close();
  for (const [name, engine] of [['WebKit', webkit], ['Firefox', firefox]]) {
    if (!fs.existsSync(engine.executablePath())) { report.limitations.push(name + ' not installed'); continue; }
    const b = await engine.launch({ headless: true });
    try {
      const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
      await setDeviceHints(page, 8);
      const engineErrors = []; page.on('pageerror', e => engineErrors.push(e.message));
      await page.goto(base + '/how-it-works'); await openFilm(page);
      const geometry = await bounds(page);
      for (const [fraction, min, max] of [[.85, .75, .95], [.12, .02, .15]]) {
        await scrub(page, fraction, geometry);
        await page.waitForFunction(({ min, max }) => {
          const video = document.querySelector('video');
          const position = video.currentTime / video.duration;
          return !video.seeking && position > min && position < max;
        }, { min, max }, { timeout: 2000 });
      }
      assert.deepEqual(engineErrors, []);
      await page.screenshot({ path: out + '/final-' + name.toLowerCase() + '.png' });
      pass(name + ' forward/reverse scrub');
    } finally {
      await b.close();
    }
  }
}
run().then(() => fs.writeFileSync(out + '/browser-report.json', JSON.stringify(report, null, 2))).catch(error => { console.error(error); fs.writeFileSync(out + '/browser-report.json', JSON.stringify({ ...report, error: String(error) }, null, 2)); process.exitCode = 1; });
