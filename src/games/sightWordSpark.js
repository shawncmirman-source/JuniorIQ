/**
 * Sight Word Spark — Flash a high-frequency word, then pick it from three options.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
const FLASH  = 1500;

const WORDS = [
  'the','of','and','to','a','in','is','it','you','that','he','was','for',
  'on','are','as','at','be','this','with','his','they','we','her','she',
  'or','had','by','but','not','can','all','do','out','up','one','so',
  'look','see','like','go','come','run','jump','play','said','my','no',
];

let _container, _onBack, _round, _score;

function render() {
  const target  = rand(WORDS);
  const choices = shuffle([target, ...shuffle(WORDS.filter(w => w !== target)).slice(0, 2)]);
  const start   = Date.now();

  _container.innerHTML = `
    ${gameHeader('📖', 'Sight Word Spark', _round + 1, ROUNDS, _onBack)}
    <p class="sw-hint">Remember this word!</p>
    <div class="sw-flash-card" id="sw-flash">
      <span class="sw-word">${target}</span>
      <div class="sw-shutter"><div class="sw-fill" style="animation-duration:${FLASH}ms"></div></div>
    </div>
    <div class="sw-choices hidden" id="sw-choices">
      ${choices.map(w => `<button class="sw-btn" data-w="${w}">${w}</button>`).join('')}
    </div>
    <div id="sw-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  setTimeout(() => {
    document.getElementById('sw-flash').classList.add('sw-faded');
    const wrap = document.getElementById('sw-choices');
    wrap.classList.remove('hidden');

    wrap.querySelectorAll('.sw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.w === target;
        const timeMs = Date.now() - start;
        wrap.querySelectorAll('.sw-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.w === target) b.classList.add('sw-correct');
          else if (b === btn && !isCorrect) b.classList.add('sw-incorrect');
        });
        recordAnswer('reading', isCorrect, timeMs);
        if (isCorrect) { _score++; playSuccess(); } else playError();
        document.getElementById('sw-fb').innerHTML = `
          <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
            ${isCorrect ? `🎉 That's right — "${target}"!` : `❌ The word was "${target}"!`}
          </div>`;
        _round++;
        setTimeout(() => {
          if (_round < ROUNDS) render();
          else renderGameOver(_container, _score, ROUNDS, 'reading', () => { _round = 0; _score = 0; render(); }, _onBack);
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
