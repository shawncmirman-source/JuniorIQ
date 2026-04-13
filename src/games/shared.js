/**
 * JuniorIQ — Shared Game Utilities (shared.js)
 * Audio, shape rendering, and drag-and-drop helpers.
 */

// ─── Audio ───────────────────────────────────────────────────────────────
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
export function playSuccess() {
  try {
    const ctx = getAudio(); const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i*0.1);
      g.gain.linearRampToValueAtTime(0.25, now + i*0.1 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.5);
      o.start(now + i*0.1); o.stop(now + i*0.1 + 0.6);
    });
  } catch { /* audio unavailable */ }
}
export function playError() {
  try {
    const ctx = getAudio();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch { /* audio unavailable */ }
}
export function playPop() {
  try {
    const ctx = getAudio();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(700, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(); o.stop(ctx.currentTime + 0.2);
  } catch { /* audio unavailable */ }
}

// ─── Shape Rendering ─────────────────────────────────────────────────────
export const SHAPE_CLIPS = {
  circle:   'circle(50%)',
  square:   'inset(0% round 14px)',
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  star:     'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
  diamond:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  pentagon: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
};
export const SHAPE_NAMES = Object.keys(SHAPE_CLIPS);

export const PALETTE = {
  red:    '#FF4B40', blue:   '#007AFF', green:  '#34C759',
  yellow: '#FFCC00', purple: '#AF52DE', orange: '#FF9F0A',
};
export const COLOR_NAMES  = Object.keys(PALETTE);
export const COLOR_VALUES = Object.values(PALETTE);

/** Returns an HTML string for a colored CSS shape. */
export function shapeHTML(shape, color, size = 80, rotate = 0) {
  const clip = SHAPE_CLIPS[shape] || SHAPE_CLIPS.circle;
  return `<div class="shape-block" style="width:${size}px;height:${size}px;background:${color};clip-path:${clip};transform:rotate(${rotate}deg);"></div>`;
}

// ─── Randomisation ───────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function randExclude(arr, ...excl) { return rand(arr.filter(x => !excl.includes(x))); }

// ─── Standard Game Header ────────────────────────────────────────────────
export function gameHeader(emoji, title, round, total, onBack) {
  return `
    <div class="game-header-bar">
      <button class="btn btn-sm game-back-btn" id="game-back-btn">← Back</button>
      <h2 class="game-title-display">${emoji} ${title}</h2>
      <div class="round-info">${round !== null ? `Round ${round}/${total}` : ''}</div>
    </div>`;
}

// ─── Game-over screen ────────────────────────────────────────────────────
export function renderGameOver(container, score, total, category, onPlayAgain, onBack) {
  const emoji = score >= total * 0.8 ? '🏆' : score >= total * 0.5 ? '⭐' : '💪';
  const msg   = score >= total * 0.8 ? 'Incredible!' : score >= total * 0.5 ? 'Well done!' : 'Keep practising!';
  container.innerHTML = `
    <div class="game-over-screen">
      <div class="game-over-emoji">${emoji}</div>
      <h2>${msg}</h2>
      <p class="game-over-score">You scored <strong>${score}/${total}</strong></p>
      <div class="game-over-buttons">
        <button class="btn btn-primary" id="again-btn">🔄 Play Again</button>
        <button class="btn btn-warning" id="back-btn2">← Back</button>
      </div>
    </div>`;
  document.getElementById('again-btn').addEventListener('click', onPlayAgain);
  document.getElementById('back-btn2').addEventListener('click', onBack);
}
