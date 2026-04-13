/**
 * First Sounds — Flash a letter, pick the image that starts with that sound.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;
const FLASH  = 1500;

const LETTER_ITEMS = {
  A:[{e:'🍎',l:'Apple'},{e:'🐜',l:'Ant'},{e:'✈️',l:'Airplane'}],
  B:[{e:'🐝',l:'Bee'},{e:'🐻',l:'Bear'},{e:'📚',l:'Book'}],
  C:[{e:'🐱',l:'Cat'},{e:'🌵',l:'Cactus'},{e:'🚗',l:'Car'}],
  D:[{e:'🐶',l:'Dog'},{e:'🦆',l:'Duck'},{e:'💎',l:'Diamond'}],
  E:[{e:'🥚',l:'Egg'},{e:'🐘',l:'Elephant'},{e:'✉️',l:'Envelope'}],
  F:[{e:'🐟',l:'Fish'},{e:'🦊',l:'Fox'},{e:'🌺',l:'Flower'}],
  G:[{e:'🍇',l:'Grapes'},{e:'🦒',l:'Giraffe'},{e:'🎸',l:'Guitar'}],
  H:[{e:'🏠',l:'House'},{e:'🍯',l:'Honey'},{e:'🐴',l:'Horse'}],
  I:[{e:'🍦',l:'Icecream'},{e:'🏝️',l:'Island'},{e:'🪲',l:'Insect'}],
  J:[{e:'🫙',l:'Jar'},{e:'🕹️',l:'Joystick'},{e:'🃏',l:'Joker'}],
  K:[{e:'🦘',l:'Kangaroo'},{e:'🪁',l:'Kite'},{e:'🔑',l:'Key'}],
  L:[{e:'🦁',l:'Lion'},{e:'🍋',l:'Lemon'},{e:'🪔',l:'Lamp'}],
  M:[{e:'🐭',l:'Mouse'},{e:'🌙',l:'Moon'},{e:'🍄',l:'Mushroom'}],
  N:[{e:'📰',l:'Newspaper'},{e:'🥜',l:'Nuts'},{e:'🌃',l:'Night'}],
  O:[{e:'🐙',l:'Octopus'},{e:'🍊',l:'Orange'},{e:'🦉',l:'Owl'}],
  P:[{e:'🐼',l:'Panda'},{e:'🍕',l:'Pizza'},{e:'🦜',l:'Parrot'}],
  R:[{e:'🐇',l:'Rabbit'},{e:'🌈',l:'Rainbow'},{e:'🤖',l:'Robot'}],
  S:[{e:'⭐',l:'Star'},{e:'🐍',l:'Snake'},{e:'🌻',l:'Sunflower'}],
  T:[{e:'🐯',l:'Tiger'},{e:'🐢',l:'Turtle'},{e:'🌮',l:'Taco'}],
  W:[{e:'🐳',l:'Whale'},{e:'🐺',l:'Wolf'},{e:'🪄',l:'Wand'}],
};
const ALL = Object.keys(LETTER_ITEMS);

let _container, _onBack, _round, _score;

function render() {
  const letter  = rand(ALL);
  const correct = rand(LETTER_ITEMS[letter]);
  const used    = new Set([letter]);
  const pick = () => { let l; do { l = rand(ALL); } while (used.has(l)); used.add(l); return rand(LETTER_ITEMS[l]); };
  const choices = shuffle([correct, pick(), pick()]);
  const start   = Date.now();

  _container.innerHTML = `
    ${gameHeader('🔤', 'First Sounds', _round + 1, ROUNDS, _onBack)}
    <p class="fs-hint">What starts with this letter?</p>
    <div class="fs-flash-card" id="fs-flash">
      <span class="fs-letter">${letter}</span>
      <div class="fs-shutter"><div class="fs-fill" style="animation-duration:${FLASH}ms"></div></div>
    </div>
    <div class="fs-choices hidden" id="fs-choices">
      ${choices.map((c, i) => `
        <button class="fs-choice" data-ok="${c === correct}" id="fsc${i}">
          <span class="fs-emoji">${c.e}</span>
          <span class="fs-label">${c.l}</span>
        </button>`).join('')}
    </div>
    <div id="fs-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  setTimeout(() => {
    document.getElementById('fs-flash').classList.add('fs-faded');
    const wrap = document.getElementById('fs-choices');
    wrap.classList.remove('hidden');

    wrap.querySelectorAll('.fs-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.ok === 'true';
        const timeMs = Date.now() - start;
        wrap.querySelectorAll('.fs-choice').forEach(b => b.disabled = true);
        if (isCorrect) { btn.classList.add('fs-correct'); playSuccess(); _score++; }
        else { btn.classList.add('fs-incorrect'); wrap.querySelector('[data-ok="true"]').classList.add('fs-correct'); playError(); }
        recordAnswer('letters', isCorrect, timeMs);
        document.getElementById('fs-fb').innerHTML = `
          <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
            ${isCorrect ? `🎉 ${correct.l} starts with "${letter}"!` : `❌ ${correct.l} starts with "${letter}"!`}
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
