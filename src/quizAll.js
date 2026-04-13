/**
 * JuniorIQ — Quiz All Controller (quizAll.js)
 * Randomly selects 3 questions per category (15 total),
 * cycles through them seamlessly, then shows a radar-chart results screen.
 */

import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { recordAnswer, getRadarScores, getStats, clearSession } from './store.js';

// Register only the components we need (tree-shakeable)
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─────────────────────────────────────────────────────────────────────────────
// Question Bank — 4+ questions per category so 3 are randomly sampled each run
// ─────────────────────────────────────────────────────────────────────────────
const QUESTION_BANK = {
  math: [
    { prompt: 'What is 2 + 3?',       choices: ['4', '5', '6', '7'],       answer: '5'  },
    { prompt: 'What is 10 − 4?',      choices: ['5', '6', '7', '8'],       answer: '6'  },
    { prompt: 'How many sides does a triangle have?', choices: ['2', '3', '4', '5'], answer: '3' },
    { prompt: 'What is 3 + 4?',       choices: ['6', '7', '8', '9'],       answer: '7'  },
    { prompt: 'Which number is biggest?', choices: ['12', '9', '15', '11'], answer: '15' },
  ],
  letters: [
    { prompt: 'Which is the lowercase version of "A"?', choices: ['a', 'b', 'e', 'd'],  answer: 'a' },
    { prompt: 'What letter comes after "D"?',           choices: ['B', 'C', 'E', 'F'],   answer: 'E' },
    { prompt: 'Which letter starts the word "Sun"?',    choices: ['A', 'S', 'T', 'N'],   answer: 'S' },
    { prompt: 'Which is the lowercase version of "M"?', choices: ['n', 'm', 'w', 'u'],   answer: 'm' },
    { prompt: 'What letter comes before "Z"?',          choices: ['X', 'Y', 'W', 'V'],   answer: 'Y' },
  ],
  reading: [
    { prompt: 'Which picture matches the word "CAT"?',  choices: ['🐱', '🐶', '🐸', '🦋'], answer: '🐱' },
    { prompt: 'Which word rhymes with "HAT"?',          choices: ['dog', 'bat', 'sun', 'fig'], answer: 'bat' },
    { prompt: 'Which word is a sight word for "look"?', choices: ['lick', 'lake', 'look', 'lock'], answer: 'look' },
    { prompt: 'Which picture matches the word "SUN"?',  choices: ['🌙', '⭐', '☀️', '🌧️'],  answer: '☀️' },
    { prompt: 'Which word rhymes with "DOG"?',          choices: ['cat', 'log', 'pig', 'hen'], answer: 'log' },
  ],
  patterns: [
    { prompt: '🔴 🔵 🔴 🔵 — What comes next?',        choices: ['🟡', '🔴', '🟢', '🟣'], answer: '🔴' },
    { prompt: '⬡ ⬟ ⬡ ⬟ — What comes next?',           choices: ['⬡', '⬛', '⭕', '⬟'],    answer: '⬡'  },
    { prompt: '🐱 🐶 🐱 🐶 — What comes next?',        choices: ['🐸', '🐱', '🦊', '🐼'], answer: '🐱' },
    { prompt: '1 2 1 2 — What comes next?',             choices: ['3', '1', '4', '2'],      answer: '1'  },
    { prompt: 'Which shape is the odd one out? ⭕ ⭕ ⭕ ⬛', choices: ['⭕', '⬛', '🔵', '🟡'], answer: '⬛' },
  ],
  science: [
    { prompt: 'Is a dog a living thing?',               choices: ['Yes', 'No', 'Maybe', 'Sometimes'], answer: 'Yes' },
    { prompt: 'Which comes first in a butterfly\'s life?', choices: ['Butterfly', 'Cocoon', 'Egg', 'Caterpillar'], answer: 'Egg' },
    { prompt: 'Is a rock a living thing?',              choices: ['Yes', 'No', 'Sometimes', 'Always'],  answer: 'No'  },
    { prompt: 'What do plants need to grow?',           choices: ['Pizza', 'Sunlight', 'TV', 'Shoes'],  answer: 'Sunlight' },
    { prompt: 'Which is a living thing?',               choices: ['🪨 Rock', '🌊 Water', '🌱 Plant', '⛅ Cloud'], answer: '🌱 Plant' },
  ]
};

const CATEGORIES = ['math', 'letters', 'reading', 'patterns', 'science'];

const RADAR_LABELS = {
  math:     'Number Ninja',
  letters:  'Alphabet Ace',
  reading:  'Word Wizard',
  patterns: 'Logic Legend',
  science:  'Nature Navigator'
};

const CATEGORY_COLORS = {
  math:     '#007AFF',
  letters:  '#34C759',
  reading:  '#FF9F0A',
  patterns: '#AF52DE',
  science:  '#FF375F'
};

const CATEGORY_EMOJIS = {
  math: '🔢', letters: '🔤', reading: '📖', patterns: '🧩', science: '🧬'
};

const TIPS_BANK = {
  math: {
    grow: "Count everything! Blocks, snacks, and steps — practice makes numbers fun.",
    fluency: "Great counting! Now let's try to recognize small groups without counting each one.",
    excel: "Numbers are your superpower! Try simple addition with groups of toys."
  },
  letters: {
    grow: "Let's find letters in your favorite books! Can you spot your name's letters?",
    fluency: "You're getting fast! Let's practice matching 'Big' and 'Little' letters more.",
    excel: "Alphabet Ace! Try thinking of three words that start with each letter you see."
  },
  reading: {
    grow: "Read together every day! Point to words as you say them out loud.",
    fluency: "You're reading words! Let's look for these common words in signs and cereal boxes.",
    excel: "Word Wizard! Can you find rhyming words for everything in the room?"
  },
  patterns: {
    grow: "Look for patterns everywhere — on your shirt, the floor, or in your songs!",
    fluency: "Great logic! Try building patterns with colored blocks or LEGOs.",
    excel: "Logic Legend! Try creating your own complex patterns for a grown-up to solve."
  },
  science: {
    grow: "Explore outside! Talk about which things are alive (like trees) and which aren't.",
    fluency: "Nature Navigator! Let's look at a garden and see the lifecycles in action.",
    excel: "Junior Scientist! Keep asking 'Why?' and 'How?' about the world around you!"
  }
};

let quizQueue = [];
let currentQIndex = 0;
let questionStartTime = 0;
let activeChart = null;
let container = null;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue() {
  const queue = [];
  CATEGORIES.forEach(cat => {
    const pool = shuffle(QUESTION_BANK[cat]).slice(0, 3);
    pool.forEach(q => queue.push({ ...q, category: cat }));
  });
  return shuffle(queue);
}

function generateTips() {
  const scores = getRadarScores();
  return CATEGORIES.map(cat => {
    const stats = getStats(cat);
    const score = scores[cat];
    let type = 'grow';
    if (score >= 85) type = 'excel';
    else if (score >= 60) type = 'fluency';
    
    return {
      category: cat,
      emoji: CATEGORY_EMOJIS[cat],
      label: RADAR_LABELS[cat],
      tip: TIPS_BANK[cat][type],
      color: CATEGORY_COLORS[cat]
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Render: Launch Screen
// ─────────────────────────────────────────────────────────────────────────────
function renderLaunch() {
  container.innerHTML = `
    <div class="quiz-launch">
      <div class="quiz-launch-icon">⭐</div>
      <h2 class="category-header">Quiz All Challenge!</h2>
      <p class="quiz-launch-desc">
        15 questions across <strong>all 5 subjects</strong>.<br>
        Do your best and see your results on the map!
      </p>
      <div class="quiz-category-badges">
        ${CATEGORIES.map(c => `<span class="category-badge" style="background:${CATEGORY_COLORS[c]}">${CATEGORY_EMOJIS[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}</span>`).join('')}
      </div>
      <button id="quiz-start-btn" class="btn btn-primary quiz-start-btn">🚀 Let's Go!</button>
    </div>
  `;
  document.getElementById('quiz-start-btn').addEventListener('click', startQuiz);
}

// ─────────────────────────────────────────────────────────────────────────────
// Start Quiz
// ─────────────────────────────────────────────────────────────────────────────
function startQuiz() {
  quizQueue = buildQueue();
  currentQIndex = 0;
  renderQuestion();
}

// ─────────────────────────────────────────────────────────────────────────────
// Render: Question
// ─────────────────────────────────────────────────────────────────────────────
function renderQuestion() {
  const q = quizQueue[currentQIndex];
  const progress = currentQIndex + 1;
  const shuffledChoices = shuffle(q.choices);
  const color = CATEGORY_COLORS[q.category];

  container.innerHTML = `
    <div class="quiz-question-wrap">
      <div class="quiz-progress-bar-outer">
        <div class="quiz-progress-bar-inner" style="width:${(currentQIndex / 15) * 100}%; background:${color}"></div>
      </div>
      <div class="quiz-meta">
        <span class="category-badge" style="background:${color}">${CATEGORY_EMOJIS[q.category]} ${q.category.charAt(0).toUpperCase() + q.category.slice(1)}</span>
        <span class="quiz-counter">Question ${progress} of 15</span>
      </div>
      <div class="quiz-prompt-card">
        <p class="quiz-prompt">${q.prompt}</p>
      </div>
      <div class="quiz-choices">
        ${shuffledChoices.map((c, i) => `
          <button class="quiz-choice-btn" data-choice="${c}" id="choice-${i}">
            ${c}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  questionStartTime = Date.now();

  container.querySelectorAll('.quiz-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, q));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle Answer
// ─────────────────────────────────────────────────────────────────────────────
function handleAnswer(btn, q) {
  const responseTimeMs = Date.now() - questionStartTime;
  const isCorrect = btn.dataset.choice === q.answer;

  // Disable all buttons
  container.querySelectorAll('.quiz-choice-btn').forEach(b => {
    b.disabled = true;
    if (b.dataset.choice === q.answer) {
      b.classList.add('correct');
    } else if (b === btn && !isCorrect) {
      b.classList.add('incorrect');
    }
  });

  recordAnswer(q.category, isCorrect, responseTimeMs);

  // Show feedback overlay
  const feedback = document.createElement('div');
  feedback.className = `quiz-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  feedback.textContent = isCorrect ? '✅ Correct!' : `❌ The answer was: ${q.answer}`;
  container.querySelector('.quiz-question-wrap').appendChild(feedback);

  setTimeout(() => {
    currentQIndex++;
    if (currentQIndex < 15) {
      renderQuestion();
    } else {
      renderResults();
    }
  }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Render: Results Screen with Radar Chart
// ─────────────────────────────────────────────────────────────────────────────
function renderResults() {
  const scores = getRadarScores();
  const labels = CATEGORIES.map(c => RADAR_LABELS[c]);
  const dataPoints = CATEGORIES.map(c => scores[c]);
  const tips = generateTips();

  // Build summary rows
  const summaryRows = CATEGORIES.map(cat => {
    const stats = getStats(cat);
    const pct = stats.attempts > 0 ? Math.round(stats.accuracy * 100) : 0;
    const speed = stats.avgSpeedMs > 0 ? (stats.avgSpeedMs / 1000).toFixed(1) + 's' : '—';
    return `
      <tr>
        <td class="skill-name-cell">
          <span class="category-badge category-badge-sm" style="background:${CATEGORY_COLORS[cat]}">
            ${CATEGORY_EMOJIS[cat]} ${RADAR_LABELS[cat]}
          </span>
        </td>
        <td class="stat-cell stat-correct">✅ ${stats.correct}</td>
        <td class="stat-cell stat-incorrect">❌ ${stats.incorrect}</td>
        <td class="stat-cell">${pct}%</td>
        <td class="stat-cell">${speed}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="results-screen">
      <div class="results-header">
        <div class="results-trophy">🏆</div>
        <h2 class="category-header">Amazing Job!</h2>
        <p class="results-subtitle">Here's how you did across all subjects!</p>
      </div>

      <div class="results-body">
        <div class="radar-wrap">
          <canvas id="performance-radar" width="400" height="400"></canvas>
        </div>

        <div class="results-table-wrap">
          <h3 class="results-table-title">Your Performance Map</h3>
          <table class="results-table">
            <thead>
              <tr>
                <th class="skill-name-cell">Skill</th>
                <th>✅</th>
                <th>❌</th>
                <th>Acc</th>
                <th>Speed</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
        </div>
      </div>

      <div class="tips-section">
        <h3 class="tips-title">💡 Tips for Growth</h3>
        <div class="tips-grid">
          ${tips.map(t => `
            <div class="tip-card" style="border-left: 6px solid ${t.color}">
              <div class="tip-header">
                <span class="tip-emoji">${t.emoji}</span>
                <span class="tip-label">${t.label}</span>
              </div>
              <p class="tip-text">${t.tip}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="results-footer-btns">
        <button id="print-snapshot-btn" class="btn btn-success print-btn">📸 Print Snapshot</button>
        <button id="quiz-restart-btn" class="btn btn-primary quiz-restart-btn">🔄 Start Over</button>
      </div>
    </div>
  `;

  // Destroy any existing chart instance
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }

  // Build Radar Chart
  const ctx = document.getElementById('performance-radar').getContext('2d');
  activeChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Your Score',
        data: dataPoints,
        backgroundColor: 'rgba(0, 122, 255, 0.25)',
        borderColor: '#007AFF',
        borderWidth: 3,
        pointBackgroundColor: CATEGORIES.map(c => CATEGORY_COLORS[c]),
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 11,
        fill: true,
      }]
    },
    options: {
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { family: 'Fredoka', size: 13 },
            color: '#999',
            backdropColor: 'transparent',
          },
          pointLabels: {
            font: { family: 'Fredoka', size: 15, weight: '600' },
            color: '#333',
          },
          grid: { color: 'rgba(0,0,0,0.08)' },
          angleLines: { color: 'rgba(0,0,0,0.08)' },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Score: ${ctx.raw}/100`
          },
          bodyFont: { family: 'Fredoka', size: 14 },
          titleFont: { family: 'Fredoka', size: 14 },
        }
      }
    }
  });

  document.getElementById('quiz-restart-btn').addEventListener('click', () => {
    clearSession();
    if (activeChart) { activeChart.destroy(); activeChart = null; }
    renderLaunch();
  });

  document.getElementById('print-snapshot-btn').addEventListener('click', () => {
    window.print();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mount the Quiz All experience into a container element.
 * @param {HTMLElement} el
 */
export function launch(el) {
  container = el;
  renderLaunch();
}
