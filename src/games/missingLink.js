/**
 * The Missing Link — ABAB / AABB pattern completion game.
 * Click a choice, then click the drop zone (or drag it).
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, rand, randExclude, shapeHTML, SHAPE_NAMES, PALETTE, COLOR_NAMES, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
let _container, _onBack, _round, _score, _startTime, _selected, _correctKey;

function generateRound() {
  const type   = Math.random() < 0.5 ? 'ABAB' : 'AABB';
  const sA = rand(SHAPE_NAMES),        sB = randExclude(SHAPE_NAMES, sA);
  const cA = rand(COLOR_NAMES),        cB = randExclude(COLOR_NAMES, cA);
  const A  = { shape: sA, color: PALETTE[cA] };
  const B  = { shape: sB, color: PALETTE[cB] };
  // Always show 3 items; missing is always B
  // ABAB → [A,B,A, ?=B]   AABB → [A,A,B, ?=B]
  const seq = type === 'ABAB' ? [A, B, A] : [A, A, B];
  const missing = B;

  const d1 = { shape: randExclude(SHAPE_NAMES, sA, sB), color: PALETTE[randExclude(COLOR_NAMES, cA, cB)] };
  const d2 = { shape: randExclude(SHAPE_NAMES, sA, sB, d1.shape), color: PALETTE[randExclude(COLOR_NAMES, cA, cB)] };
  const choices = shuffle([missing, d1, d2]).map((c, i) => ({ ...c, key: i }));
  const correctKey = choices.findIndex(c => c.shape === missing.shape && c.color === missing.color);
  return { type, seq, choices, correctKey };
}

function render() {
  const round = generateRound();
  _correctKey = round.correctKey;
  _selected   = null;
  _startTime  = Date.now();

  _container.innerHTML = `
    ${gameHeader('🧩', 'The Missing Link', _round + 1, ROUNDS, _onBack)}
    <div class="ml-pattern-label">${round.type} Pattern — What comes next?</div>
    <div class="ml-sequence" id="ml-sequence">
      ${round.seq.map(item => `<div class="ml-item">${shapeHTML(item.shape, item.color, 90)}</div>`).join('')}
      <div class="ml-item ml-dropzone" id="ml-dropzone">
        <div class="ml-dz-inner">?</div>
      </div>
    </div>
    <p class="ml-hint">Click a shape below, then click the <strong>?</strong> box</p>
    <div class="ml-choices" id="ml-choices">
      ${round.choices.map((c, i) => `
        <div class="ml-choice" data-key="${i}" draggable="true">
          ${shapeHTML(c.shape, c.color, 80)}
        </div>`).join('')}
    </div>
    <div id="ml-feedback"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);
  setupInteraction(round.choices);
}

function setupInteraction(choices) {
  const choiceEls = _container.querySelectorAll('.ml-choice');
  const dropZone  = document.getElementById('ml-dropzone');
  let dragKey = null;

  choiceEls.forEach(el => {
    // Click to select
    el.addEventListener('click', () => {
      choiceEls.forEach(c => c.classList.remove('ml-selected'));
      el.classList.add('ml-selected');
      _selected = parseInt(el.dataset.key);
    });
    // Drag start
    el.addEventListener('dragstart', () => { dragKey = parseInt(el.dataset.key); el.style.opacity = '0.45'; });
    el.addEventListener('dragend',   () => { el.style.opacity = '1'; });
  });

  dropZone.addEventListener('click', () => {
    if (_selected !== null) handleAnswer(_selected, choices);
  });
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('ml-dz-hover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('ml-dz-hover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('ml-dz-hover');
    if (dragKey !== null) handleAnswer(dragKey, choices);
  });
}

function handleAnswer(chosenKey, choices) {
  const isCorrect = chosenKey === _correctKey;
  const timeMs    = Date.now() - _startTime;
  const chosen    = choices[chosenKey];
  const dropzone  = document.getElementById('ml-dropzone');
  const feedback  = document.getElementById('ml-feedback');

  // Fill the dropzone
  dropzone.innerHTML = shapeHTML(chosen.shape, chosen.color, 90);
  dropzone.classList.add(isCorrect ? 'dz-correct' : 'dz-incorrect');
  _container.querySelectorAll('.ml-choice').forEach(el => { el.style.pointerEvents = 'none'; });

  recordAnswer('patterns', isCorrect, timeMs);
  if (isCorrect) { _score++; playSuccess(); }
  else           { playError(); }

  feedback.innerHTML = `<div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
    ${isCorrect ? '🎉 Correct! Great spotting!' : `❌ The pattern needed a different shape.`}
  </div>`;

  _round++;
  setTimeout(() => {
    if (_round < ROUNDS) render();
    else renderGameOver(_container, _score, ROUNDS, 'patterns', () => { _round = 0; _score = 0; render(); }, _onBack);
  }, 1600);
}

export function launch(container, _cat, onBack) {
  _container = container;
  _onBack    = onBack;
  _round     = 0;
  _score     = 0;
  render();
}
