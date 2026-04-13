/**
 * Letter Pop — Flash uppercase, pick the matching lowercase bubble.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS  = 5;
const FLASH   = 1500;
const LETTERS = 'ABCDEFGHIJKLMNOPRSTW'.split('');

const COLORS  = ['#FF4B40','#007AFF','#34C759','#FFCC00','#AF52DE','#FF9F0A'];

let _container, _onBack, _round, _score;

function render() {
  const letter      = rand(LETTERS);
  const correct     = letter.toLowerCase();
  const distractors = shuffle(LETTERS.filter(l => l !== letter)).slice(0, 2).map(l => l.toLowerCase());
  const choices     = shuffle([correct, ...distractors]);
  const color       = rand(COLORS);
  const start       = Date.now();

  _container.innerHTML = `
    ${gameHeader('🔤', 'Letter Pop', _round + 1, ROUNDS, _onBack)}
    <p class="lp-hint">Remember this letter!</p>
    <div class="lp-flash-card" id="lp-flash" style="--lp-color:${color}">
      <span class="lp-letter">${letter}</span>
      <div class="lp-shutter"><div class="lp-fill" style="animation-duration:${FLASH}ms"></div></div>
    </div>
    <div class="lp-bubbles hidden" id="lp-bubbles">
      ${choices.map((c, i) => `<button class="lp-bubble" data-c="${c}" style="background:${COLORS[i]}">${c}</button>`).join('')}
    </div>
    <div id="lp-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  setTimeout(() => {
    document.getElementById('lp-flash').classList.add('lp-faded');
    const bubbles = document.getElementById('lp-bubbles');
    bubbles.classList.remove('hidden');

    bubbles.querySelectorAll('.lp-bubble').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.c === correct;
        const timeMs = Date.now() - start;
        bubbles.querySelectorAll('.lp-bubble').forEach(b => b.disabled = true);
        if (isCorrect) { btn.classList.add('lp-pop-anim'); playSuccess(); _score++; }
        else { btn.classList.add('lp-wrong-bubble'); bubbles.querySelector(`[data-c="${correct}"]`).classList.add('lp-pop-anim'); playError(); }
        recordAnswer('letters', isCorrect, timeMs);
        document.getElementById('lp-fb').innerHTML = `
          <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
            ${isCorrect ? `🎉 "${correct}" is the lowercase "${letter}"!` : `❌ "${correct}" is the lowercase "${letter}"!`}
          </div>`;
        _round++;
        setTimeout(() => {
          if (_round < ROUNDS) render();
          else renderGameOver(_container, _score, ROUNDS, 'letters', () => { _round = 0; _score = 0; render(); }, _onBack);
        }, 1600);
      });
    });
  }, FLASH);
}

export function launch(container, _cat, onBack) {
  _container = container; _onBack = onBack;
  _round = 0; _score = 0;
  render();
}
