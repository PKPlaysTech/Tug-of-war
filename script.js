// Game State
let team1Score = 0;
let team2Score = 0;
const WINNING_SCORE = 5; // Win by leading by 5 points

let timerInterval = null;
let timeRemaining = 60;
let isGameOver = false;

// Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');

const team1NameInput = document.getElementById('team1-name');
const team2NameInput = document.getElementById('team2-name');
const timeLimitInput = document.getElementById('time-limit');

const displayTeam1Name = document.getElementById('display-team1-name');
const displayTeam2Name = document.getElementById('display-team2-name');

const t1ScoreDisplay = document.getElementById('t1-score');
const t2ScoreDisplay = document.getElementById('t2-score');

const t1HpDisplay = document.getElementById('t1-hp');
const t2HpDisplay = document.getElementById('t2-hp');

const t1Question = document.getElementById('t1-question');
const t1AnswerDisplay = document.getElementById('t1-answer');
const t1Keypad = document.getElementById('t1-keypad');

const t2Question = document.getElementById('t2-question');
const t2AnswerDisplay = document.getElementById('t2-answer');
const t2Keypad = document.getElementById('t2-keypad');

const tugContainer = document.getElementById('tug-container');
const winnerOverlay = document.getElementById('winner-overlay');
const winnerText = document.getElementById('winner-text');
const timerDisplay = document.getElementById('timer-display');

// State for each team
let t1State = { answerStr: "", correctValue: 0 };
let t2State = { answerStr: "", correctValue: 0 };

// Setup Keypads
function renderKeypad(container, teamId) {
    const keys = ['1','2','3','4','5','6','7','8','9','0','.','DEL','SUBMIT'];
    container.innerHTML = '';
    keys.forEach(k => {
        const btn = document.createElement('button');
        btn.classList.add('key-btn');
        btn.textContent = k;
        
        if (k === '0') btn.classList.add('key-zero');
        if (k === 'DEL') btn.classList.add('key-del');
        if (k === 'SUBMIT') {
            btn.classList.add('key-submit');
            btn.textContent = 'ENTER';
        }

        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleKeyPress(teamId, k); });
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleKeyPress(teamId, k); });

        container.appendChild(btn);
    });
}

function updateDisplay(teamId) {
    if (teamId === 1) {
        t1AnswerDisplay.textContent = t1State.answerStr;
    } else {
        t2AnswerDisplay.textContent = t2State.answerStr;
    }
}

function handleKeyPress(teamId, key) {
    let state = teamId === 1 ? t1State : t2State;
    
    if (key === 'DEL') {
        state.answerStr = state.answerStr.slice(0, -1);
        updateDisplay(teamId);
    } else if (key === 'SUBMIT') {
        checkAnswer(teamId);
    } else {
        // limit length
        if (state.answerStr.length < 6) {
            // Prevent multiple decimals
            if (key === '.' && state.answerStr.includes('.')) return;
            state.answerStr += key;
            updateDisplay(teamId);
        }
    }
}

// Math logic
function formatMoney(value) {
    return "$" + value.toFixed(2);
}

function generateQuestion() {
    const type = Math.random() > 0.5 ? 1 : 2;
    let a, b, answer;
    
    if (type === 1) {
        a = Math.floor(Math.random() * 9) + 1; // 1 to 9
        b = Math.floor(Math.random() * 9) + 1;
        answer = Math.round((a + b) * 100) / 100;
        return {
            text: `$${a} + $${b} = ?`,
            value: answer
        };
    } else {
        const dollarsA = Math.floor(Math.random() * 5); // 0 to 4
        const centsA = Math.random() > 0.5 ? 0.5 : 0;
        const dollarsB = Math.floor(Math.random() * 5);
        const centsB = Math.random() > 0.5 ? 0.5 : 0;
        
        a = dollarsA + centsA;
        if (a === 0) a = 0.5; // Avoid $0
        
        b = dollarsB + centsB;
        if (b === 0) b = 0.5;
        
        answer = Math.round((a + b) * 100) / 100;
        return {
            text: `${formatMoney(a)} + ${formatMoney(b)} = ?`,
            value: answer
        };
    }
}

function setQuestion(teamId) {
    const q = generateQuestion();
    if (teamId === 1) {
        t1Question.textContent = q.text;
        t1State.correctValue = q.value;
        t1State.answerStr = "";
        updateDisplay(1);
    } else {
        t2Question.textContent = q.text;
        t2State.correctValue = q.value;
        t2State.answerStr = "";
        updateDisplay(2);
    }
}

function checkAnswer(teamId) {
    if (isGameOver) return;
    const state = teamId === 1 ? t1State : t2State;
    const displayElement = teamId === 1 ? t1AnswerDisplay.parentElement : t2AnswerDisplay.parentElement;
    
    const numValue = parseFloat(state.answerStr);
    const correctAnswer = Math.round(state.correctValue * 100) / 100;
    
    // Check numerically with fixed precision to avoid floating point issues
    if (!isNaN(numValue) && numValue.toFixed(2) === correctAnswer.toFixed(2)) {
        // Correct
        if (teamId === 1) {
            team1Score++;
        } else {
            team2Score++;
        }
        
        updateGameState();
        
        const scoreDiff = team1Score - team2Score;
        if (scoreDiff >= WINNING_SCORE) {
            endGame(1);
        } else if (scoreDiff <= -WINNING_SCORE) {
            endGame(2);
        } else {
            setQuestion(teamId); // Next question
        }
    } else {
        // Wrong
        displayElement.classList.remove('error-shake');
        void displayElement.offsetWidth; // trigger reflow
        displayElement.classList.add('error-shake');
        state.answerStr = "";
        updateDisplay(teamId);
    }
}

function updateGameState() {
    // Update Score Displays
    t1ScoreDisplay.textContent = team1Score;
    t2ScoreDisplay.textContent = team2Score;
    
    const scoreDiff = team1Score - team2Score; // e.g. 5 means Team 1 is winning by 5
    
    // Update HP Displays. Distance to losing is 5.
    // If Blue leads by 5 (scoreDiff = -5), Red HP reaches 0.
    // If Red leads by 5 (scoreDiff = +5), Blue HP reaches 0.
    const t1Hp = WINNING_SCORE + scoreDiff;
    const t2Hp = WINNING_SCORE - scoreDiff;
    
    t1HpDisplay.textContent = t1Hp;
    t2HpDisplay.textContent = t2Hp;
    
    // Update Tug Position
    // The image moves based on net score difference.
    // Each point of difference moves the container by some percentage.
    const percentage = scoreDiff * (25 / WINNING_SCORE);
    
    // TranslateX positive means move right. But Team 1 (Red) is on the left.
    // So if Team 1 is winning, scoreDiff > 0. We want the rope to move LEFT.
    tugContainer.style.transform = `translateX(${-percentage}%)`;
}

// Timer Logic
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimer() {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);
    if (timeRemaining <= 0) {
        endGameOnTime();
    }
}

function endGameOnTime() {
    isGameOver = true;
    clearInterval(timerInterval);
    winnerOverlay.classList.remove('hidden');
    
    if (team1Score > team2Score) {
        winnerText.textContent = `${team1NameInput.value || 'TEAM RED'} WINS!`;
        winnerText.className = 'winner-red';
    } else if (team2Score > team1Score) {
        winnerText.textContent = `${team2NameInput.value || 'TEAM BLUE'} WINS!`;
        winnerText.className = 'winner-blue';
    } else {
        winnerText.textContent = "IT'S A TIE!";
        winnerText.className = ''; // Default style
    }
}

function endGame(winningTeamId) {
    isGameOver = true;
    clearInterval(timerInterval);
    winnerOverlay.classList.remove('hidden');
    if (winningTeamId === 1) {
        winnerText.textContent = `${team1NameInput.value || 'TEAM RED'} WINS!`;
        winnerText.className = 'winner-red';
    } else {
        winnerText.textContent = `${team2NameInput.value || 'TEAM BLUE'} WINS!`;
        winnerText.className = 'winner-blue';
    }
}

function initGame() {
    isGameOver = false;
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    winnerOverlay.classList.add('hidden');
    
    displayTeam1Name.textContent = team1NameInput.value || 'Team Red';
    displayTeam2Name.textContent = team2NameInput.value || 'Team Blue';
    
    // Reset Scores
    team1Score = 0;
    team2Score = 0;
    updateGameState();
    
    // Timer setup
    if (timerInterval) clearInterval(timerInterval);
    timeRemaining = parseInt(timeLimitInput.value) || 60;
    timerDisplay.textContent = formatTime(timeRemaining);
    timerInterval = setInterval(updateTimer, 1000);
    
    renderKeypad(t1Keypad, 1);
    renderKeypad(t2Keypad, 2);
    
    setQuestion(1);
    setQuestion(2);
}

startBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    winnerOverlay.classList.add('hidden');
    initGame();
});

// Auto-scale to fit screen
function resizeApp() {
    const app = document.getElementById('app-container');
    if (!app) return;
    // Base size is 1200x800, scale it down to fit the window with a 2% margin
    const scale = Math.min(window.innerWidth / 1200, window.innerHeight / 800) * 0.98;
    app.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', resizeApp);
// Call once on load
resizeApp();
