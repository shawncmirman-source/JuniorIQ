import './style.css'
import { clearSession } from './store.js'
import { launch as launchQuizAll } from './quizAll.js'
import { launch as launchMissingLink } from './games/missingLink.js'
import { launch as launchShapeShifter } from './games/shapeShifter.js'
import { launch as launchLifecycleShuffle } from './games/lifecycleShuffle.js'
import { launch as launchLivingOrNot } from './games/livingOrNot.js'
import { launch as launchSubitizeSafari } from './games/subitizeSafari.js'
import { launch as launchBigAndSmall } from './games/bigAndSmall.js'
import { launch as launchLetterPop } from './games/letterPop.js'
import { launch as launchFirstSounds } from './games/firstSounds.js'
import { launch as launchSightWordSpark } from './games/sightWordSpark.js'
import { launch as launchRhymeTime } from './games/rhymeTime.js'

const GAMES_DATA = {
  math: {
    title: "Math Games",
    games: [
      {
        id: "subitize-safari",
        title: "Subitize Safari",
        desc: "Flash dot patterns (1-10) for recognition.",
        goal: "How many dots do you see? Answer as fast as you can!"
      },
      {
        id: "big-and-small",
        title: "Big & Small",
        desc: "Compare two groups of items and pick the larger quantity.",
        goal: "Look closely at the screen and choose the group with MORE items!"
      }
    ]
  },
  letters: {
    title: "Letter Learner",
    games: [
      {
        id: "letter-pop",
        title: "Letter Pop",
        desc: "Match uppercase letters to their lowercase partners.",
        goal: "Find the matching lowercase letter for each big letter!"
      },
      {
        id: "first-sounds",
        title: "First Sounds",
        desc: "Match a letter to an image that starts with that sound.",
        goal: "What does this sound start with? Find the matching picture!"
      }
    ]
  },
  reading: {
    title: "Reading Library",
    games: [
      {
        id: "sight-word-spark",
        title: "Sight Word Spark",
        desc: "Flash high-frequency 'sight words' followed by image selection.",
        goal: "Read the flashing word and pick the correct picture!"
      },
      {
        id: "rhyme-time",
        title: "Rhyme Time",
        desc: "Pick which word/image rhymes with a target word.",
        goal: "Listen carefully. Can you find the picture that rhymes?"
      }
    ]
  },
  patterns: {
    title: "Learning Patterns",
    games: [
      {
        id: "missing-link",
        title: "The Missing Link",
        desc: "Complete a simple ABAB or AABB color/shape sequence.",
        goal: "Look at the pattern. What shape or color comes next?"
      },
      {
        id: "shape-shifter",
        title: "Shape Shifter",
        desc: "Identify the 'odd one out' in a group of rotating shapes.",
        goal: "One of these shapes doesn't belong. Can you spot it?"
      }
    ]
  },
  science: {
    title: "Explore Science",
    games: [
      {
        id: "living-or-not",
        title: "Living or Not",
        desc: "Classify objects as living things or non-living objects.",
        goal: "Is it alive? Tell me if this object is living or non-living!"
      },
      {
        id: "lifecycle-shuffle",
        title: "Lifecycle Shuffle",
        desc: "Order images (e.g., egg, caterpillar, cocoon, butterfly).",
        goal: "Put the pictures in the right order to make the lifecycle!"
      }
    ]
  },
  'quiz-all': {
    title: "Quiz All Challenge",
    games: [
      {
        id: "master-quiz",
        title: "The Ultimate Challenge",
        desc: "Mix up all subjects for the ultimate test!",
        goal: "Get ready for a mix of everything! You can do it!"
      }
    ]
  }
};

const dom = {
  navTabs: document.querySelectorAll('.nav-tab'),
  gameContainer: document.getElementById('game-container'),
  modal: document.getElementById('instruction-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalInstructions: document.getElementById('modal-instructions'),
  startGameBtn: document.getElementById('start-game-btn'),
  homeBtn: document.getElementById('home-btn'),
  newStudentBtn: document.getElementById('new-student-btn')
};

function renderCategory(categoryKey) {
  // Quiz All is handled by its own controller
  if (categoryKey === 'quiz-all') {
    dom.gameContainer.innerHTML = '';
    launchQuizAll(dom.gameContainer);
    return;
  }

  const data = GAMES_DATA[categoryKey];
  if (!data) return;

  // Header
  let html = `<h2 class="category-header">${data.title}</h2>`;

  // Games Grid
  html += `<div class="games-grid">`;
  data.games.forEach(game => {
    const safeGoal = game.goal.replace(/'/g, "&#39;");
    html += `
      <div class="game-card">
        <h3>${game.title}</h3>
        <p>${game.desc}</p>
        <button class="btn btn-primary game-play-btn"
          data-game-id="${game.id}"
          data-game-title="${game.title}"
          data-game-goal="${safeGoal}">Play</button>
      </div>
    `;
  });
  html += `</div>`;

  dom.gameContainer.innerHTML = html;
  
  // Attach listeners to new buttons
  document.querySelectorAll('.game-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { gameId, gameTitle, gameGoal } = e.target.dataset;
      window.openGameModal(gameId, gameTitle, gameGoal);
    });
  });
}

function setActiveTab(clickedTab) {
  dom.navTabs.forEach(tab => tab.classList.remove('active'));
  clickedTab.classList.add('active');
  const cat = clickedTab.getAttribute('data-tab');
  renderCategory(cat);
}

// Modal Logic
let _pendingGameId = null;
let _pendingCat    = null;

window.openGameModal = function(gameId, title, goal) {
  _pendingGameId = gameId;
  _pendingCat    = document.querySelector('.nav-tab.active')?.dataset.tab || 'patterns';
  dom.modalTitle.textContent = title;
  dom.modalInstructions.textContent = goal;
  dom.modal.classList.remove('hidden');
}

dom.startGameBtn.addEventListener('click', () => {
  dom.modal.classList.add('hidden');
  if (_pendingGameId) {
    launchGame(_pendingGameId, _pendingCat);
    _pendingGameId = null;
  }
});

const GAME_LAUNCHERS = {
  'missing-link':      launchMissingLink,
  'shape-shifter':     launchShapeShifter,
  'lifecycle-shuffle': launchLifecycleShuffle,
  'living-or-not':     launchLivingOrNot,
  'subitize-safari':   launchSubitizeSafari,
  'big-and-small':     launchBigAndSmall,
  'letter-pop':        launchLetterPop,
  'first-sounds':      launchFirstSounds,
  'sight-word-spark':  launchSightWordSpark,
  'rhyme-time':        launchRhymeTime,
};

function launchGame(gameId, cat) {
  const launcher = GAME_LAUNCHERS[gameId];
  if (!launcher) return;
  dom.gameContainer.innerHTML = '';
  launcher(dom.gameContainer, cat, () => renderCategory(cat));
}

// Event Listeners
dom.navTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    setActiveTab(e.currentTarget);
  });
});

dom.homeBtn.addEventListener('click', () => {
  const mathTab = document.querySelector('[data-tab="math"]');
  setActiveTab(mathTab);
});

dom.newStudentBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to start as a new student? This will clear your progress.")) {
    clearSession();
    alert("Progress cleared! Welcome, new student! 🎉");
    location.reload();
  }
});

// Initial Render
renderCategory('math');
document.querySelector('[data-tab="math"]').classList.add('active');
