/**
 * Shape Shifter — Spot the odd one out (different shape, colour, or rotation).
 * Click-to-answer; no drag needed.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, rand, randExclude, shapeHTML, SHAPE_NAMES, PALETTE, COLOR_NAMES, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
let _container, _onBack, _round, _score;

function generateRound() {
  const diffType = rand(['shape', 'color', 'rotation']);
  let shapes, colors, rotations, oddIdx;
  oddIdx = Math.floor(Math.random() * 4);

  if (diffType === 'shape') {
    const base = rand(SHAPE_NAMES);
    const odd  = randExclude(SHAPE_NAMES, base);
    const col  = PALETTE[rand(COLOR_NAMES)];
    shapes    = [base, base, base, base];
    shapes[oddIdx] = odd;
    colors    = [col, col, col, col];
    rotations = [0, 0, 0, 0];
  } else if (diffType === 'color') {
    const shape  = rand(SHAPE_NAMES);
    const baseC  = rand(COLOR_NAMES);
    const oddC   = randExclude(COLOR_NAMES, baseC);
    shapes    = [shape, shape, shape, shape];
    colors    = [PALETTE[baseC], PALETTE[baseC], PALETTE[baseC], PALETTE[baseC]];
    colors[oddIdx] = PALETTE[oddC];
    rotations = [0, 0, 0, 0];
  } else {
    // rotation — use triangle so rotation is obvious
    const shape = 'triangle';
    const col   = PALETTE[rand(COLOR_NAMES)];
    shapes    = [shape, shape, shape, shape];
    colors    = [col, col, col, col];
    rotations = [0, 0, 0, 0];
    rotations[oddIdx] = 180;
  }

  const items = [0,1,2,3].map(i => ({ shape: shapes[i], color: colors[i], rotate: rotations[i] }));
  const labels = { shape: 'different shape', color: 'different colour', rotation: 'different direction' };
  return { items, oddIdx, hint: labels[diffType] };
}

function render() {
  const round = generateRound();
  const startTime = Date.now();

  _container.innerHTML = `
    ${gameHeader('🔷', 'Shape Shifter', _round + 1, ROUNDS, _onBack)}
    <p class="ss-prompt">Which shape is the <strong>odd one out</strong>?</p>
    <div class="ss-grid" id="ss-grid">
      ${round.items.map((item, i) => `
        <button class="ss-card" data-idx="${i}" id="ss-card-${i}">
          ${shapeHTML(item.shape, item.color, 110, item.rotate)}
        </button>`).join('')}
    </div>
    <div id="ss-feedback"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  _container.querySelectorAll('.ss-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = parseInt(btn.dataset.idx);
      const isCorrect = chosen === round.oddIdx;
      const timeMs = Date.now() - startTime;

      _container.querySelectorAll('.ss-card').forEach(b => b.disabled = true);

      // Highlight correct + chosen
      document.getElementById(`ss-card-${round.oddIdx}`).classList.add('ss-correct');
      if (!isCorrect) btn.classList.add('ss-incorrect');

      recordAnswer('patterns', isCorrect, timeMs);
      if (isCorrect) { _score++; playSuccess(); }
      else           { playError(); }

      document.getElementById('ss-feedback').innerHTML = `
        <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
          ${isCorrect ? '🎉 You found it!' : `❌ The odd one had a ${round.hint}.`}
        </div>`;

      _round++;
      setTimeout(() => {
        if (_round < ROUNDS) render();
        else renderGameOver(_container, _score, ROUNDS, 'patterns', () => { _round = 0; _score = 0; render(); }, _onBack);
      }, 1600);
    });
  });
}

export function launch(container, _cat, onBack) {
  _container = container;
  _onBack    = onBack;
  _round     = 0;
  _score     = 0;
  render();
}
