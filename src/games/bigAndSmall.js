/**
 * Big & Small — Click the side with more items.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
const EMOJIS = ['⭐','🍎','🐝','🎈','🌸','🦋','🍓','🎯','🌟','🍭'];

let _container, _onBack, _round, _score;

function render() {
  const emoji = rand(EMOJIS);
  const left  = Math.floor(Math.random() * 7) + 2;          // 2–8
  let right; do { right = Math.floor(Math.random() * 7) + 2; } while (right === left);
  const correct = left > right ? 'left' : 'right';
  const start = Date.now();

  _container.innerHTML = `
    ${gameHeader('📊', 'Big & Small', _round + 1, ROUNDS, _onBack)}
    <p class="bas-prompt">Click the side with <strong>MORE</strong>!</p>
    <div class="bas-groups">
      <button class="bas-group" id="bas-left"  data-side="left">
        <div class="bas-items">${emoji.repeat(left)}</div>
      </button>
      <div class="bas-vs">VS</div>
      <button class="bas-group" id="bas-right" data-side="right">
        <div class="bas-items">${emoji.repeat(right)}</div>
      </button>
    </div>
    <div id="bas-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  ['bas-left','bas-right'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      const chosen = e.currentTarget.dataset.side;
      const isCorrect = chosen === correct;
      const timeMs = Date.now() - start;

      document.getElementById('bas-left').disabled  = true;
      document.getElementById('bas-right').disabled = true;
      document.getElementById(`bas-${correct}`).classList.add('bas-winner');
      if (!isCorrect) document.getElementById(`bas-${chosen}`).classList.add('bas-loser');

      recordAnswer('math', isCorrect, timeMs);
      if (isCorrect) { _score++; playSuccess(); } else playError();

      const big = Math.max(left, right);
      document.getElementById('bas-fb').innerHTML = `
        <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
          ${isCorrect ? `🎉 Correct — ${big} is more!` : `❌ ${big} is more!`}
        </div>`;

      _round++;
      setTimeout(() => {
        if (_round < ROUNDS) render();
        else renderGameOver(_container, _score, ROUNDS, 'math', () => { _round = 0; _score = 0; render(); }, _onBack);
      }, 1600);
    });
  });
}

export function launch(container, _cat, onBack) {
  _container = container; _onBack = onBack;
  _round = 0; _score = 0;
  render();
}
