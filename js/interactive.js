
// --- INTERACTIVE MODULES (Ported from Infinition) ---
let currentScore = 0;
let sessionType = ''; // 'flashcard' or 'quiz'
let currentId = '';
let quizIndex = 0;
let cardIndex = 0;
let currentData = [];

// Helper for randomization
function shuffleArray(array) {
    const arr = [...array]; // Create a copy to avoid mutating original data
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startFlashcardSession(data, id) {
    currentData = shuffleArray(data);
    cardIndex = 0;
    currentScore = 0;
    sessionType = 'flashcard';
    currentId = id;

    const modal = document.getElementById('interactive-modal');
    modal.style.display = 'flex';
    // Force reflow
    void modal.offsetWidth;
    // modal.classList.add('active'); // If using transitions
    renderFC();
}

function renderFC() {
    const card = currentData[cardIndex];
    const progress = ((cardIndex) / currentData.length) * 100;
    const prevScore = localStorage.getItem('score_' + currentId);
    const prevText = prevScore ? `Previous: ${prevScore}` : 'First Try';

    const html = `
        <div class="fc-container">
            <div class="fc-top-info">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div>Card ${cardIndex + 1}</div>
                    <div class="fc-counter-badge">${cardIndex + 1}/${currentData.length}</div>
                </div>
                <div style="font-size:0.8rem; color:#888;">${prevText}</div>
                <div onclick="finishSession(true)" style="cursor:pointer; padding:5px; font-size:1.2rem;"><i data-lucide="x" class="w-6 h-6"></i></div>
            </div>
            <div class="fc-progress-bg"><div class="fc-progress-fill" style="width:${progress}%"></div></div>
            <div class="fc-status"><i data-lucide="check-circle" class="w-4 h-4"></i> Learning Mode</div>
            <div class="fc-scene" onclick="this.querySelector('.fc-card').classList.toggle('flipped')">
                <div class="fc-stack-2"></div><div class="fc-stack-1"></div>
                <div class="fc-card">
                    <div class="fc-face"><div class="fc-q-badge"><div class="fc-q-icon"><i data-lucide="help-circle" class="w-5 h-5"></i></div>Question</div><div class="fc-text">${card.question}</div><div class="fc-tap-hint"><i data-lucide="mouse-pointer-click" class="w-4 h-4"></i> Tap to flip</div></div>
                    <div class="fc-face fc-back"><div class="fc-text" style="color:var(--neon-green)">${card.answer}</div></div>
                </div>
            </div>
            <div class="fc-controls">
                <button class="fc-action-btn fc-btn-no" onclick="nextFC(false)"><i data-lucide="x" class="w-8 h-8"></i></button>
                <button class="fc-action-btn fc-btn-yes" onclick="nextFC(true)"><i data-lucide="check" class="w-8 h-8"></i></button>
            </div>
        </div>`;
    document.getElementById('modal-content-area').innerHTML = html;
    lucide.createIcons();
}

function nextFC(isCorrect) {
    if (isCorrect) currentScore++;

    if (cardIndex < currentData.length - 1) {
        cardIndex++;
        renderFC();
    } else {
        finishSession();
    }
}

function startQuizSession(data, id) {
    currentData = shuffleArray(data);
    quizIndex = 0;
    currentScore = 0;
    sessionType = 'quiz';
    currentId = id;

    const modal = document.getElementById('interactive-modal');
    modal.style.display = 'flex';
    // Force reflow
    void modal.offsetWidth;
    // modal.classList.add('active');
    renderQuiz();
}

function renderQuiz() {
    const q = currentData[quizIndex];
    const progress = ((quizIndex) / currentData.length) * 100;
    const prevScore = localStorage.getItem('score_' + currentId);
    const prevText = prevScore ? `Previous: ${prevScore}` : 'First Try';

    // Randomize options
    const shuffledOptions = shuffleArray(q.options.map((opt, i) => ({ text: opt, originalIndex: i })));

    const html = `
        <div class="qz-container">
            <div class="qz-top-bar">
                <div style="display:flex; gap:10px; align-items:center;">
                    <span>Quiz Mode</span>
                    <div class="fc-counter-badge">${quizIndex + 1}/${currentData.length}</div>
                </div>
                <div style="font-size:0.8rem; color:#888;">${prevText}</div>
                <div style="cursor:pointer;" onclick="finishSession(true)"><i data-lucide="x" class="w-6 h-6"></i></div>
            </div>
            <div class="qz-progress-bg"><div class="qz-progress-fill" style="width:${progress}%"></div></div>
            <div class="qz-question-box"><div class="qz-label"><i data-lucide="help-circle" class="w-4 h-4"></i> Question ${quizIndex + 1}</div><div class="qz-text">${q.question}</div></div>
            <div class="qz-options">
                ${shuffledOptions.map((opt, i) => `
                    <div class="qz-option" data-original-index="${opt.originalIndex}" onclick="submitQuizAnswer(this, ${opt.originalIndex === q.correct})">
                        <div class="qz-letter">${String.fromCharCode(65 + i)}</div>
                        <div>${opt.text}</div>
                    </div>`).join('')}
            </div>
        </div>`;
    document.getElementById('modal-content-area').innerHTML = html;
    lucide.createIcons();
}

function submitQuizAnswer(el, isCorrect) {
    // Prevent multiple clicks
    if (el.parentElement.classList.contains('answered')) return;
    el.parentElement.classList.add('answered');

    if (isCorrect) {
        el.classList.add('correct');
        currentScore++;
    } else {
        el.classList.add('wrong');
        // Highlight correct answer
        const options = el.parentElement.querySelectorAll('.qz-option');
        const correctIndex = currentData[quizIndex].correct;

        options.forEach(opt => {
            if (parseInt(opt.dataset.originalIndex) === correctIndex) {
                opt.classList.add('correct');
            }
        });
    }

    setTimeout(() => {
        if (quizIndex < currentData.length - 1) {
            quizIndex++;
            renderQuiz();
        } else {
            finishSession();
        }
    }, 1000);
}

function finishSession(earlyExit = false) {
    const currentIndex = sessionType === 'flashcard' ? cardIndex : quizIndex;
    // If early exit, we count only up to the current index (exclusive of the current one if not answered, but simplistic approach: just use currentIndex as total attempted if we consider current one skipped)
    // Actually, if I am at question 5 (index 4), and I quit, I have completed 4 questions.
    // If I finish normally, I am at index 9 (last one), and I just answered it, so total is 10.

    // When called from nextFC/submitQuizAnswer, we are at the last index, but we just answered it.
    // Wait, in nextFC: if (cardIndex < length - 1) cardIndex++ else finishSession().
    // So if length is 10. Last index is 9.
    // I answer card 9. nextFC called. cardIndex is 9. 9 is not < 9. finishSession called.
    // currentIndex is 9. total = 10. Correct.

    // If I am at card 5 (index 4). I click X.
    // finishSession(true) called.
    // currentIndex is 4.
    // I haven't answered card 5.
    // So total should be 4.

    let total = currentIndex + 1;
    if (earlyExit) {
        total = currentIndex;
    }

    // Avoid division by zero
    if (total === 0) { closeInteractiveModal(); return; }

    const scoreStr = `${currentScore}/${total}`;
    const prevScoreStr = localStorage.getItem('score_' + currentId);

    // Save new score
    localStorage.setItem('score_' + currentId, scoreStr);

    let comparisonMsg = "Well done!";
    if (prevScoreStr) {
        const prevScoreVal = parseInt(prevScoreStr.split('/')[0]);
        if (currentScore > prevScoreVal) comparisonMsg = "Better than last time! 🚀";
        else if (currentScore < prevScoreVal) comparisonMsg = "Keep practicing! 💪";
        else comparisonMsg = "Consistent performance! 👍";
    }

    const html = `
        <div style="text-align:center; color:white; padding:40px; font-family:var(--ui-font);">
            <h2 style="font-family:var(--cyber-font); margin-bottom:20px; color:var(--neon-blue); font-size: 2rem; font-weight: bold;">Session Complete</h2>
            <div style="font-size:3rem; font-weight:bold; margin-bottom:10px;">${scoreStr}</div>
            <div style="color:#aaa; margin-bottom:30px;">${comparisonMsg}</div>
            <button class="action-btn btn-flash" style="margin:0 auto; padding:10px 30px; font-size:1.2rem;" onclick="closeInteractiveModal()">Exit</button>
        </div>`;

    document.getElementById('modal-content-area').innerHTML = html;
}

function closeInteractiveModal() {
    const modal = document.getElementById('interactive-modal');
    modal.style.display = 'none';
    // Refresh content to show updated scores if needed
    renderContent();
}
