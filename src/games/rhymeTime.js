/**
 * Rhyme Time — Pick the image that rhymes with the target word.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, shuffle, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 5;

const SETS = [
  { w:'Cat',   e:'🐱', r:{w:'Hat',   e:'🎩'}, d:[{w:'Dog',e:'🐶'},{w:'Sun',e:'☀️'},{w:'Fish',e:'🐟'}] },
  { w:'Bee',   e:'🐝', r:{w:'Tree',  e:'🌳'}, d:[{w:'Car',e:'🚗'},{w:'Pig',e:'🐷'},{w:'Moon',e:'🌙'}] },
  { w:'Cake',  e:'🎂', r:{w:'Lake',  e:'🏞️'}, d:[{w:'Bird',e:'🐦'},{w:'Ball',e:'⚽'},{w:'Frog',e:'🐸'}] },
  { w:'Star',  e:'⭐', r:{w:'Car',   e:'🚗'}, d:[{w:'Cat',e:'🐱'},{w:'Bee',e:'🐝'},{w:'Egg',e:'🥚'}] },
  { w:'Hen',   e:'🐔', r:{w:'Ten',   e:'🔟'}, d:[{w:'Dog',e:'🐶'},{w:'Cup',e:'☕'},{w:'Key',e:'🔑'}] },
  { w:'Frog',  e:'🐸', r:{w:'Log',   e:'🪵'}, d:[{w:'Hat',e:'🎩'},{w:'Bee',e:'🐝'},{w:'Sun',e:'☀️'}] },
  { w:'Ball',  e:'⚽', r:{w:'Wall',  e:'🧱'}, d:[{w:'Fish',e:'🐟'},{w:'Cat',e:'🐱'},{w:'Star',e:'⭐'}] },
  { w:'Boat',  e:'⛵', r:{w:'Goat',  e:'🐐'}, d:[{w:'Bear',e:'🐻'},{w:'Cake',e:'🎂'},{w:'Frog',e:'🐸'}] },
  { w:'Bear',  e:'🐻', r:{w:'Chair', e:'🪑'}, d:[{w:'Frog',e:'🐸'},{w:'Boat',e:'⛵'},{w:'Hen',e:'🐔'}] },
  { w:'Rain',  e:'🌧️', r:{w:'Train', e:'🚂'}, d:[{w:'Dog',e:'🐶'},{w:'Ball',e:'⚽'},{w:'Fish',e:'🐟'}] },
  { w:'Fox',   e:'🦊', r:{w:'Box',   e:'📦'}, d:[{w:'Bear',e:'🐻'},{w:'Star',e:'⭐'},{w:'Moon',e:'🌙'}] },
  { w:'Snail', e:'🐌', r:{w:'Tail',  e:'🐕'}, d:[{w:'Dog',e:'🐶'},{w:'Star',e:'⭐'},{w:'Ball',e:'⚽'}] },
];

let _container, _onBack, _round, _score, _used;

function render() {
  const avail = SETS.map((_,i) => i).filter(i => !_used.has(i));
  if (avail.length === 0) _used.clear();
  const idx = rand(avail.length ? avail : SETS.map((_,i)=>i));
  _used.add(idx);
  const set = SETS[idx];

  const choices = shuffle([set.r, ...shuffle(set.d).slice(0, 2)]);
  const start   = Date.now();

  _container.innerHTML = `
    ${gameHeader('📖', 'Rhyme Time', _round + 1, ROUNDS, _onBack)}
    <p class="rt-prompt">Which word <strong>rhymes</strong> with...</p>
    <div class="rt-target">
      <span class="rt-emoji">${set.e}</span>
      <span class="rt-word">${set.w}</span>
    </div>
    <div class="rt-choices">
      ${choices.map((c, i) => `
        <button class="rt-choice" data-rhyme="${c === set.r}" id="rtc${i}">
          <span class="rt-c-emoji">${c.e}</span>
          <span class="rt-c-word">${c.w}</span>
        </button>`).join('')}
    </div>
    <div id="rt-fb"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);

  _container.querySelectorAll('.rt-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.dataset.rhyme === 'true';
      const timeMs = Date.now() - start;
      _container.querySelectorAll('.rt-choice').forEach(b => b.disabled = true);
      if (isCorrect) { btn.classList.add('rt-correct'); playSuccess(); _score++; }
      else { btn.classList.add('rt-incorrect'); _container.querySelector('[data-rhyme="true"]').classList.add('rt-correct'); playError(); }
      recordAnswer('reading', isCorrect, timeMs);
      document.getElementById('rt-fb').innerHTML = `
        <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
          ${isCorrect ? `🎉 "${set.r.w}" rhymes with "${set.w}"!` : `❌ "${set.r.w}" rhymes with "${set.w}"!`}
        </div>`;
      _round++;
      setTimeout(() => {
        if (_round < ROUNDS) render();
        else renderGameOver(_container, _score, ROUNDS, 'reading', () => { _round=0; _score=0; _used.clear(); render(); }, _onBack);
      }, 1600);
    });
  });
}

export function launch(container, _cat, onBack) {
  _container = container; _onBack = onBack;
  _round = 0; _score = 0; _used = new Set();
  render();
}
