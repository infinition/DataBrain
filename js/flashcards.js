// --- Flashcards ---

function renderFlashcards(cards) {
    flashcardsView.innerHTML = '';
    if (editMode) {
        const container = document.createElement('div');
        container.className = 'p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50';
        container.innerHTML = `
            <h3 class="text-white font-bold mb-4 flex items-center gap-2"><i data-lucide="file-json" class="w-4.5 h-4.5"></i> Gestion Flashcards</h3>
            <div class="mt-4 space-y-2" id="fc-list"></div>
            <button class="add-fc-btn text-xs text-indigo-400 hover:text-white mt-2">+ Ajouter une carte</button>
        `;
        const list = container.querySelector('#fc-list');
        cards.forEach((c, i) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 p-2 bg-slate-800 rounded border border-slate-700 items-center';
            row.innerHTML = `
                <span class="text-xs text-slate-400 w-6">${i + 1}.</span>
                <input class="fc-q flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.question}">
                <input class="fc-a flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.answer}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 cursor-pointer text-red-400 del-fc"></i>
            `;
            row.querySelector('.fc-q').oninput = (e) => { cards[i].question = e.target.value; updateFlashcards(cards); };
            row.querySelector('.fc-a').oninput = (e) => { cards[i].answer = e.target.value; updateFlashcards(cards); };
            row.querySelector('.del-fc').onclick = () => { const newCards = cards.filter((_, idx) => idx !== i); updateFlashcards(newCards); renderContent(); };
            list.appendChild(row);
        });
        container.querySelector('.add-fc-btn').onclick = () => { updateFlashcards([...cards, { question: "New?", answer: "Ans" }]); renderContent(); };
        flashcardsView.appendChild(container);
    } else {
        if (cards.length === 0) { flashcardsView.innerHTML = '<div class="text-center p-10 text-slate-500">Aucune flashcard. Activez le mode éditeur pour en ajouter.</div>'; return; }
        let current = 0;
        let flipped = false;
        const renderCard = () => {
            flashcardsView.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col items-center justify-center h-full py-10';
            const cardDiv = document.createElement('div');
            cardDiv.className = 'relative w-full max-w-md h-64 perspective-1000 cursor-pointer group';
            cardDiv.onclick = () => { flipped = !flipped; renderCard(); };
            cardDiv.innerHTML = `
                <div class="relative w-full h-full duration-500 preserve-3d transition-transform ${flipped ? 'rotate-y-180' : ''}">
                    <div class="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center border border-indigo-500/30 ${flipped ? 'hidden' : 'flex'}">
                        <i data-lucide="brain" class="w-10 h-10 text-white/20 mb-4"></i>
                        <h3 class="text-xl font-bold text-white">${cards[current].question}</h3>
                        <p class="mt-4 text-indigo-200 text-xs">Clique pour révéler</p>
                    </div>
                    <div class="absolute w-full h-full backface-hidden bg-slate-800 rotate-y-180 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center border border-slate-600 ${flipped ? 'flex' : 'hidden'}">
                        <i data-lucide="check-circle" class="w-10 h-10 text-green-500/20 mb-4"></i>
                        <p class="text-lg text-white">${cards[current].answer}</p>
                    </div>
                </div>
            `;
            const controls = document.createElement('div');
            controls.className = 'flex items-center gap-4 mt-8';
            controls.innerHTML = `
                <button id="prev-card" class="p-2 rounded-full bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600" ${current === 0 ? 'disabled' : ''}>Précédent</button>
                <span class="text-slate-400 text-sm">${current + 1} / ${cards.length}</span>
                <button id="next-card" class="p-2 rounded-full bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600" ${current === cards.length - 1 ? 'disabled' : ''}>Suivant</button>
            `;
            controls.querySelector('#prev-card').onclick = (e) => { e.stopPropagation(); flipped = false; current = Math.max(0, current - 1); renderCard(); };
            controls.querySelector('#next-card').onclick = (e) => { e.stopPropagation(); flipped = false; current = Math.min(cards.length - 1, current + 1); renderCard(); };
            wrapper.appendChild(cardDiv);
            wrapper.appendChild(controls);
            flashcardsView.appendChild(wrapper);
            lucide.createIcons();
        };
        renderCard();
    }
}

function updateFlashcards(newCards) {
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.flashcards = newCards;
}
