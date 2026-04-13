/**
 * Living or Not — Drag 10 items into Living / Non-Living buckets.
 * Immediate green/red feedback + sound on each drop.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, playPop, shuffle, gameHeader } from './shared.js';

const LIVING = [
  { emoji: '🌱', label: 'Plant' },    { emoji: '🐕', label: 'Dog' },
  { emoji: '🐟', label: 'Fish' },     { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🌲', label: 'Tree' },     { emoji: '🐦', label: 'Bird' },
  { emoji: '🐛', label: 'Worm' },     { emoji: '🐸', label: 'Frog' },
  { emoji: '🌸', label: 'Flower' },   { emoji: '🐜', label: 'Ant' },
  { emoji: '🦎', label: 'Lizard' },   { emoji: '🌿', label: 'Grass' },
];
const NON_LIVING = [
  { emoji: '🪨', label: 'Rock' },     { emoji: '🪑', label: 'Chair' },
  { emoji: '💻', label: 'Computer' }, { emoji: '📚', label: 'Book' },
  { emoji: '🚗', label: 'Car' },      { emoji: '⛅', label: 'Cloud' },
  { emoji: '💧', label: 'Water' },    { emoji: '✏️', label: 'Pencil' },
  { emoji: '🎒', label: 'Backpack' }, { emoji: '🔦', label: 'Torch' },
  { emoji: '🪟', label: 'Window' },   { emoji: '🎈', label: 'Balloon' },
];

let _container, _onBack;
let _placed;   // Map: itemId → { isLiving, correct }
let _items;    // flat array of { id, emoji, label, isLiving }
let _startTime;

function buildItems() {
  const living    = shuffle(LIVING).slice(0, 5).map((x, i) => ({ id: `l${i}`, ...x, isLiving: true }));
  const nonLiving = shuffle(NON_LIVING).slice(0, 5).map((x, i) => ({ id: `n${i}`, ...x, isLiving: false }));
  return shuffle([...living, ...nonLiving]);
}

function render() {
  _items     = buildItems();
  _placed    = {};
  _startTime = Date.now();

  _container.innerHTML = `
    ${gameHeader('🧬', 'Living or Not', null, null, _onBack)}
    <p class="lon-prompt">Drag each item into the correct bucket!</p>
    <div class="lon-items-tray" id="lon-tray">
      ${_items.map(item => `
        <div class="lon-item" draggable="true" data-id="${item.id}" id="lon-item-${item.id}">
          <span class="lon-emoji">${item.emoji}</span>
          <span class="lon-item-label">${item.label}</span>
        </div>`).join('')}
    </div>
    <div class="lon-buckets">
      <div class="lon-bucket" data-living="true" id="bucket-living">
        <div class="lon-bucket-header">🌱 Living</div>
        <div class="lon-bucket-drop" id="bdrop-living"></div>
      </div>
      <div class="lon-bucket" data-living="false" id="bucket-nonliving">
        <div class="lon-bucket-header">🪨 Non-Living</div>
        <div class="lon-bucket-drop" id="bdrop-nonliving"></div>
      </div>
    </div>
    <div id="lon-score-bar" class="lon-score-bar hidden"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);
  setupDrag();
}

function setupDrag() {
  _container.querySelectorAll('.lon-item').forEach(el => {
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', el.dataset.id);
      el.style.opacity = '0.4';
    });
    el.addEventListener('dragend', () => el.style.opacity = '1');
  });

  ['bucket-living', 'bucket-nonliving'].forEach(bucketId => {
    const bucket = document.getElementById(bucketId);
    const dropArea = bucket.querySelector('.lon-bucket-drop');
    const bucketIsLiving = bucketId === 'bucket-living';

    bucket.addEventListener('dragover',  e => { e.preventDefault(); bucket.classList.add('lon-bucket-hover'); });
    bucket.addEventListener('dragleave', () => bucket.classList.remove('lon-bucket-hover'));
    bucket.addEventListener('drop', e => {
      e.preventDefault();
      bucket.classList.remove('lon-bucket-hover');
      const id   = e.dataTransfer.getData('text/plain');
      const item = _items.find(x => x.id === id);
      if (!item || _placed[id]) return;  // already placed

      const isCorrect = item.isLiving === bucketIsLiving;
      _placed[id] = { isCorrect };

      // Move card into bucket
      const card = document.getElementById(`lon-item-${id}`);
      card.style.opacity = '1';
      card.classList.add(isCorrect ? 'lon-placed-correct' : 'lon-placed-incorrect');
      card.setAttribute('draggable', 'false');
      dropArea.appendChild(card);

      if (isCorrect) playPop(); else playError();

      // Flash bucket
      bucket.classList.add(isCorrect ? 'bucket-flash-correct' : 'bucket-flash-incorrect');
      setTimeout(() => { bucket.classList.remove('bucket-flash-correct', 'bucket-flash-incorrect'); }, 600);

      if (Object.keys(_placed).length === 10) showSummary();
    });
  });
}

function showSummary() {
  const timeMs    = Date.now() - _startTime;
  const correct   = Object.values(_placed).filter(p => p.isCorrect).length;
  const isWin     = correct >= 8;

  // Record as a single answer weighted by score
  recordAnswer('science', correct >= 8, timeMs);
  if (isWin) playSuccess(); else playError();

  const bar = document.getElementById('lon-score-bar');
  bar.classList.remove('hidden');
  bar.innerHTML = `
    <div class="lon-result ${isWin ? 'lon-win' : 'lon-ok'}">
      ${isWin ? '🏆' : '⭐'} You got <strong>${correct}/10</strong> correct!
      <div class="lon-buttons">
        <button class="btn btn-primary" id="lon-again">🔄 Play Again</button>
        <button class="btn btn-warning" id="lon-back">← Back</button>
      </div>
    </div>`;

  document.getElementById('lon-again').addEventListener('click', render);
  document.getElementById('lon-back').addEventListener('click', _onBack);
}

export function launch(container, _cat, onBack) {
  _container = container;
  _onBack    = onBack;
  render();
}
