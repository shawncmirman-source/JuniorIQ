/**
 * Subitize Safari — Flash dots on a ten-frame, adaptive shutter speed.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
const INITIAL_MS = 1500;
const MIN_MS = 300;

let _container, _onBack, _round, _score, _shutterMs, _streak;

function generateCells(n) {
  const cells = Array(10).fill(false);
  shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0, n).forEach(i => (cells[i] = true));
  return cells;
}

function buildChoices(correct) {
  const pool = new Set([correct]);
  for (const off of shuffle([-3,-2,-1,1,2,3])) {
    const v = correct + off;
    if (v >= 1 && v <= 10) pool.add(v);
    if (pool.size === 4) break;
  }
  for (let v = 1; v <= 10 && pool.size < 4; v++) pool.add(v);
  return shuffle([...pool]);
}

function render() {
  const n     = Math.floor(Math.random() * 10) + 1;
  const cells = generateCells(n);
  const start = Date.now();

  _container.innerHTML = `
    ${gameHeader('🔢', 'Subitize Safari', _round + 1, ROUNDS, _onBack)}
    <p class="sub-prompt">Watch carefully — how many dots?</p>
    <div class="sub-timer-bar"><div class="sub-timer-fill" style="animation-duration:${_shutterMs}ms"></div></div>
    <div class="ten-frame" id="tf">
      ${cells.map(f => `<div class="ten-cell${f ? ' dot' : ''}"></div>`).join('')}
    </div>
    <div id="sub-answers" class="sub-answers hidden"></div>
    <div id="sub-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  setTimeout(() => {
    // hide dots, show choices
    document.getElementById('tf').querySelectorAll('.ten-cell').forEach(c => c.classList.remove('dot'));
    const answerEl = document.getElementById('sub-answers');
    answerEl.classList.remove('hidden');
    answerEl.innerHTML = buildChoices(n).map(v =>
      `<button class="sub-btn" data-v="${v}">${v}</button>`
    ).join('');

    answerEl.querySelectorAll('.sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.dataset.v);
        const isCorrect = chosen === n;
        const timeMs = Date.now() - start;

        answerEl.querySelectorAll('.sub-btn').forEach(b => {
          b.disabled = true;
          if (parseInt(b.dataset.v) === n) b.classList.add('sub-correct');
          else if (b === btn && !isCorrect) b.classList.add('sub-incorrect');
        });

        recordAnswer('math', isCorrect, timeMs);
        if (isCorrect) {
          _score++;  _streak++;
          if (_streak > 0 && _streak % 3 === 0) _shutterMs = Math.max(MIN_MS, _shutterMs - 100);
          playSuccess();
        } else {
          _streak = 0;
          playError();
        }

        document.getElementById('sub-fb').innerHTML = `
          <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
            ${isCorrect ? `🎉 Yes! There were ${n} dots!` : `❌ There were ${n} dots.`}
          </div>`;

        _round++;
        setTimeout(() => {
          if (_round < ROUNDS) render();
          else renderGameOver(_container, _score, ROUNDS, 'math', () => { _round = 0; _score = 0; render(); }, _onBack);
        }, 1500);
      });
    });
  }, _shutterMs);
}

export function launch(container, _cat, onBack) {
  _container = container; _onBack = onBack;
  _round = 0; _score = 0; _shutterMs = INITIAL_MS; _streak = 0;
  render();
}
