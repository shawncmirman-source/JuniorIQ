/**
 * Lifecycle Shuffle — Drag scrambled lifecycle stages into the correct order.
 * Validation triggers only once all four slots are filled.
 */
import { recordAnswer } from '../store.js';
import { playSuccess, playError, playPop, shuffle, rand, gameHeader, renderGameOver } from './shared.js';

const ROUNDS = 3;

const LIFECYCLES = [
  {
    name: 'Butterfly',
    stages: [
      { emoji: '🥚', label: 'Egg' },
      { emoji: '🐛', label: 'Caterpillar' },
      { emoji: '🫘', label: 'Cocoon' },
      { emoji: '🦋', label: 'Butterfly' },
    ],
  },
  {
    name: 'Flower',
    stages: [
      { emoji: '🌰', label: 'Seed' },
      { emoji: '🌱', label: 'Seedling' },
      { emoji: '🌿', label: 'Plant' },
      { emoji: '🌸', label: 'Flower' },
    ],
  },
  {
    name: 'Chicken',
    stages: [
      { emoji: '🥚', label: 'Egg' },
      { emoji: '🐣', label: 'Hatching' },
      { emoji: '🐥', label: 'Chick' },
      { emoji: '🐓', label: 'Chicken' },
    ],
  },
];

let _container, _onBack, _round, _score;
let _slots, _pool, _dragSrc;

function render() {
  const lifecycle = LIFECYCLES[_round % LIFECYCLES.length];
  const scrambled = shuffle([...lifecycle.stages.keys()]); // scrambled indices into lifecycle.stages
  _slots = [null, null, null, null];  // slot → lifecycle stage index
  _pool  = [...scrambled];             // pool stage indices (left panel)
  _dragSrc = null;

  const startTime = Date.now();

  _container.innerHTML = `
    ${gameHeader('🔬', 'Lifecycle Shuffle', _round + 1, ROUNDS, _onBack)}
    <p class="lc-prompt">Drag the stages of the <strong>${lifecycle.name}</strong> lifecycle into the correct order!</p>
    <div class="lc-layout">
      <div class="lc-slots" id="lc-slots">
        ${[0,1,2,3].map(i => `
          <div class="lc-slot" data-slot="${i}" id="lc-slot-${i}">
            <div class="lc-slot-num">${i + 1}</div>
            <div class="lc-slot-content"></div>
          </div>`).join('')}
      </div>
      <div class="lc-pool" id="lc-pool">
        ${scrambled.map(idx => `
          <div class="lc-item" draggable="true" data-stageidx="${idx}" id="lc-item-${idx}">
            <span class="lc-emoji">${lifecycle.stages[idx].emoji}</span>
            <span class="lc-label">${lifecycle.stages[idx].label}</span>
          </div>`).join('')}
      </div>
    </div>
    <button class="btn btn-success lc-check-btn hidden" id="lc-check-btn">✅ Check My Order!</button>
    <div id="lc-feedback"></div>`;

  document.getElementById('game-back-btn').addEventListener('click', _onBack);
  setupDrag(lifecycle, startTime);
}

function setupDrag(lifecycle, startTime) {
  refreshPoolDrag(lifecycle);
  refreshSlotDrag(lifecycle);
  document.getElementById('lc-check-btn').addEventListener('click', () => validateAnswer(lifecycle, startTime));
}

function refreshPoolDrag(lifecycle) {
  _container.querySelectorAll('.lc-item').forEach(el => {
    el.addEventListener('dragstart', () => {
      _dragSrc = { type: 'pool', stageIdx: parseInt(el.dataset.stageidx) };
      el.style.opacity = '0.4';
    });
    el.addEventListener('dragend', () => el.style.opacity = '1');
  });
  const pool = document.getElementById('lc-pool');
  pool.addEventListener('dragover', e => e.preventDefault());
  pool.addEventListener('drop', () => {
    if (!_dragSrc || _dragSrc.type !== 'slot') return;
    const slotIdx = _dragSrc.fromSlot;
    _slots[slotIdx] = null;
    _pool.push(_dragSrc.stageIdx);
    _dragSrc = null;
    redrawAll(lifecycle);
  });
}

function refreshSlotDrag(lifecycle) {
  [0,1,2,3].forEach(slotIdx => {
    const slotEl = document.getElementById(`lc-slot-${slotIdx}`);
    slotEl.addEventListener('dragover', e => { e.preventDefault(); slotEl.classList.add('lc-slot-hover'); });
    slotEl.addEventListener('dragleave', () => slotEl.classList.remove('lc-slot-hover'));
    slotEl.addEventListener('drop', e => {
      e.preventDefault();
      slotEl.classList.remove('lc-slot-hover');
      if (!_dragSrc) return;
      const incoming = _dragSrc.stageIdx;
      const existing = _slots[slotIdx];

      if (_dragSrc.type === 'pool') {
        _pool = _pool.filter(i => i !== incoming);
        if (existing !== null) _pool.push(existing);
        _slots[slotIdx] = incoming;
      } else if (_dragSrc.type === 'slot') {
        const fromSlot = _dragSrc.fromSlot;
        _slots[fromSlot] = existing;
        _slots[slotIdx]  = incoming;
      }
      _dragSrc = null;
      playPop();
      redrawAll(lifecycle);
      checkAllFilled();
    });

    // Allow dragging from a filled slot back out
    const content = slotEl.querySelector('.lc-slot-content');
    if (_slots[slotIdx] !== null) {
      content.addEventListener('dragstart', () => {
        _dragSrc = { type: 'slot', stageIdx: _slots[slotIdx], fromSlot: slotIdx };
      });
    }
  });
}

function redrawAll(lifecycle) {
  // Redraw pool
  const poolEl = document.getElementById('lc-pool');
  poolEl.innerHTML = _pool.map(idx => `
    <div class="lc-item" draggable="true" data-stageidx="${idx}" id="lc-item-${idx}">
      <span class="lc-emoji">${lifecycle.stages[idx].emoji}</span>
      <span class="lc-label">${lifecycle.stages[idx].label}</span>
    </div>`).join('');
  // Redraw slots content
  [0,1,2,3].forEach(i => {
    const content = document.querySelector(`#lc-slot-${i} .lc-slot-content`);
    const stageIdx = _slots[i];
    if (stageIdx !== null) {
      content.innerHTML = `
        <span class="lc-emoji">${lifecycle.stages[stageIdx].emoji}</span>
        <span class="lc-label">${lifecycle.stages[stageIdx].label}</span>`;
      content.setAttribute('draggable', 'true');
    } else {
      content.innerHTML = '';
      content.removeAttribute('draggable');
    }
  });
  refreshPoolDrag(lifecycle);
  refreshSlotDrag(lifecycle);
}

function checkAllFilled() {
  const btn = document.getElementById('lc-check-btn');
  if (_slots.every(s => s !== null)) btn.classList.remove('hidden');
  else btn.classList.add('hidden');
}

function validateAnswer(lifecycle, startTime) {
  const timeMs    = Date.now() - startTime;
  const isCorrect = _slots.every((stageIdx, slotPos) => stageIdx === slotPos);
  recordAnswer('science', isCorrect, timeMs);

  // Colour the slots
  [0,1,2,3].forEach(i => {
    const slot = document.getElementById(`lc-slot-${i}`);
    slot.classList.add(_slots[i] === i ? 'slot-correct' : 'slot-incorrect');
  });

  if (isCorrect) { _score++; playSuccess(); }
  else           { playError(); }

  document.getElementById('lc-feedback').innerHTML = `
    <div class="game-feedback ${isCorrect ? 'fb-correct' : 'fb-incorrect'}">
      ${isCorrect ? '🎉 Perfect order!' : '❌ Not quite — the correct order is shown above.'}
    </div>`;
  document.getElementById('lc-check-btn').disabled = true;

  // Show correct labels
  if (!isCorrect) {
    [0,1,2,3].forEach(i => {
      const content = document.querySelector(`#lc-slot-${i} .lc-slot-content`);
      content.innerHTML += `<div class="lc-correct-label">✓ ${lifecycle.stages[i].label}</div>`;
    });
  }

  _round++;
  setTimeout(() => {
    if (_round < ROUNDS) render();
    else renderGameOver(_container, _score, ROUNDS, 'science', () => { _round = 0; _score = 0; render(); }, _onBack);
  }, 2500);
}

export function launch(container, _cat, onBack) {
  _container = container;
  _onBack    = onBack;
  _round     = 0;
  _score     = 0;
  render();
}
