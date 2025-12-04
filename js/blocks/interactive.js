function renderQuizBlock(block) {
    const div = document.createElement('div');
    const questions = block.content.questions || [];
    if (editMode) {
        div.className = 'bg-slate-800 p-4 rounded-xl border border-slate-700 my-6 flex flex-col gap-3';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 text-indigo-400">
                    <i data-lucide="brain" class="w-4 h-4"></i> <span class="text-xs font-bold uppercase">Éditeur de Quiz (${questions.length} questions)</span>
                </div>
                <button class="import-json-btn text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
                    <i data-lucide="upload" class="w-3 h-3"></i> Import JSON
                </button>
            </div>
            <div class="space-y-4" id="quiz-editor-${block.id}"></div>
            <button class="add-q-btn w-full py-2 bg-slate-700 rounded text-xs text-slate-300 hover:text-white">+ Ajouter une question</button>
        `;

        // Import Logic
        div.querySelector('.import-json-btn').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const json = JSON.parse(ev.target.result);
                        if (Array.isArray(json) && json.length > 0 && json[0].question && json[0].options) {
                            const newQuestions = json.map(q => ({
                                question: q.question,
                                options: q.options.map(o => o.text),
                                correct: Math.max(0, q.options.findIndex(o => o.correct))
                            }));
                            updateBlock(block.id, { questions: [...questions, ...newQuestions] });
                            renderContent();
                        } else {
                            alert("Format JSON invalide pour un Quiz.");
                        }
                    } catch (err) {
                        alert("Erreur de lecture du fichier JSON.");
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };

        const editorContainer = div.querySelector(`#quiz-editor-${block.id}`);
        // Limit height and add scroll
        editorContainer.className = "space-y-4 relative overflow-hidden transition-all duration-300 ease-in-out";
        editorContainer.style.maxHeight = "400px";

        questions.forEach((q, qIdx) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'border border-slate-700 p-2 rounded bg-slate-900/50';
            qDiv.innerHTML = `
                <input type="text" class="q-input w-full bg-transparent border-b border-slate-700 mb-2 text-sm text-white focus:outline-none" value="${q.question}">
                <div class="space-y-1 options-container"></div>
                <div class="flex justify-between items-center mt-2">
                    <button class="add-opt-btn text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Ajouter option</button>
                    <button class="del-q-btn text-[10px] text-red-400 hover:underline">Supprimer question</button>
                </div>
            `;
            qDiv.querySelector('.q-input').oninput = (e) => { questions[qIdx].question = e.target.value; updateBlock(block.id, { questions }, true); };
            const optsContainer = qDiv.querySelector('.options-container');
            q.options.forEach((opt, oIdx) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'flex gap-2 items-center';
                optDiv.innerHTML = `
                    <div class="w-3 h-3 rounded-full border cursor-pointer ${q.correct === oIdx ? 'bg-green-500 border-green-500' : 'border-slate-500'}"></div>
                    <input type="text" class="opt-input flex-1 bg-transparent text-xs text-slate-400 border-none focus:outline-none" value="${opt}">
                    <button class="del-opt-btn text-slate-600 hover:text-red-400"><i data-lucide="x" class="w-3 h-3"></i></button>
                `;
                optDiv.querySelector('div').onclick = () => { questions[qIdx].correct = oIdx; updateBlock(block.id, { questions }); renderContent(); };
                optDiv.querySelector('.opt-input').oninput = (e) => { questions[qIdx].options[oIdx] = e.target.value; updateBlock(block.id, { questions }, true); };
                optDiv.querySelector('.del-opt-btn').onclick = () => {
                    questions[qIdx].options.splice(oIdx, 1);
                    if (questions[qIdx].correct >= questions[qIdx].options.length) {
                        questions[qIdx].correct = Math.max(0, questions[qIdx].options.length - 1);
                    }
                    updateBlock(block.id, { questions });
                    renderContent();
                };
                optsContainer.appendChild(optDiv);
            });

            qDiv.querySelector('.add-opt-btn').onclick = () => {
                questions[qIdx].options.push("Nouvelle option");
                updateBlock(block.id, { questions });
                renderContent();
            };

            qDiv.querySelector('.del-q-btn').onclick = () => { const newQs = questions.filter((_, i) => i !== qIdx); updateBlock(block.id, { questions: newQs }); renderContent(); };
            editorContainer.appendChild(qDiv);
        });

        // Check if content is long enough to need a "Show More" button
        if (questions.length > 3) { // Approximate check, can be refined based on actual height
            const expandBtnContainer = document.createElement('div');
            expandBtnContainer.className = 'absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent flex items-end justify-center pb-2 z-10';
            expandBtnContainer.innerHTML = `
                <button class="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full shadow-lg transition-all">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i> Voir tout le contenu
                </button>
            `;
            expandBtnContainer.querySelector('button').onclick = () => {
                editorContainer.style.maxHeight = 'none';
                expandBtnContainer.remove();
            };
            editorContainer.appendChild(expandBtnContainer);
        } else {
            editorContainer.style.maxHeight = 'none';
        }

        div.querySelector('.add-q-btn').onclick = () => { updateBlock(block.id, { questions: [...questions, { question: "Nouvelle question", options: ["A", "B"], correct: 0 }] }); renderContent(); };
    } else {
        div.className = 'my-6';
        if (questions.length === 0) { div.innerHTML = '<div class="p-4 bg-slate-800 rounded text-slate-500 text-xs">Quiz vide.</div>'; return div; }

        const btn = document.createElement('button');
        btn.className = 'w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-between transition-all group px-3';

        btn.innerHTML = `
    <div class="flex items-center gap-3">
        <div class="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform">
            <i data-lucide="brain" class="w-6 h-6"></i>
        </div>

        <div class="text-left">
            <h3 class="text-slate-200 font-bold text-sm">Lancer le Quiz</h3>
            <p class="text-slate-500 text-xs">${questions.length} questions</p>
        </div>
    </div>

    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-600 group-hover:text-slate-400"></i>
`;
        btn.onclick = () => startQuizSession(questions, block.id);
        div.appendChild(btn);
    }
    return div;
}

function renderFlashcardBlock(block) {
    const div = document.createElement('div');
    const cards = block.content || [];

    if (editMode) {
        div.className = 'p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 my-6';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-white font-bold flex items-center gap-2"><i data-lucide="layers" class="w-4.5 h-4.5"></i> Éditeur de Flashcards</h3>
                <button class="import-json-btn text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
                    <i data-lucide="upload" class="w-3 h-3"></i> Import JSON
                </button>
            </div>
            <div class="mt-4 space-y-2" id="fc-list-${block.id}"></div>
            <button class="add-fc-btn text-xs text-indigo-400 hover:text-white mt-2">+ Ajouter une carte</button>
        `;

        // Import Logic
        div.querySelector('.import-json-btn').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const json = JSON.parse(ev.target.result);
                        if (Array.isArray(json) && json.length > 0 && json[0].question && json[0].answer) {
                            updateBlock(block.id, [...cards, ...json]);
                            renderContent();
                        } else {
                            alert("Format JSON invalide pour des Flashcards.");
                        }
                    } catch (err) {
                        alert("Erreur de lecture du fichier JSON.");
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };

        const list = div.querySelector(`#fc-list-${block.id}`);
        // Limit height and add scroll
        list.className = "mt-4 space-y-2 relative overflow-hidden transition-all duration-300 ease-in-out";
        list.style.maxHeight = "400px";

        cards.forEach((c, i) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 p-2 bg-slate-800 rounded border border-slate-700 items-center';
            row.innerHTML = `
                <span class="text-xs text-slate-400 w-6">${i + 1}.</span>
                <input class="fc-q flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.question}" placeholder="Question">
                <input class="fc-a flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.answer}" placeholder="Réponse">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 cursor-pointer text-red-400 del-fc"></i>
            `;
            row.querySelector('.fc-q').oninput = (e) => { cards[i].question = e.target.value; updateBlock(block.id, cards, true); };
            row.querySelector('.fc-a').oninput = (e) => { cards[i].answer = e.target.value; updateBlock(block.id, cards, true); };
            row.querySelector('.del-fc').onclick = () => { const newCards = cards.filter((_, idx) => idx !== i); updateBlock(block.id, newCards); renderContent(); };
            list.appendChild(row);
        });

        // Check if content is long enough to need a "Show More" button
        if (cards.length > 5) { // Approximate check
            const expandBtnContainer = document.createElement('div');
            expandBtnContainer.className = 'absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent flex items-end justify-center pb-2 z-10';
            expandBtnContainer.innerHTML = `
                <button class="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full shadow-lg transition-all">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i> Voir tout le contenu
                </button>
            `;
            expandBtnContainer.querySelector('button').onclick = () => {
                list.style.maxHeight = 'none';
                expandBtnContainer.remove();
            };
            list.appendChild(expandBtnContainer);
        } else {
            list.style.maxHeight = 'none';
        }

        div.querySelector('.add-fc-btn').onclick = () => { updateBlock(block.id, [...cards, { question: "Nouvelle carte", answer: "Réponse" }]); renderContent(); };
    } else {
        div.className = 'my-6';
        if (cards.length === 0) { div.innerHTML = '<div class="text-center p-10 text-slate-500">Aucune flashcard.</div>'; return div; }

        const btn = document.createElement('button');
        btn.className = 'w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-between transition-all group px-3';

        btn.innerHTML = `
    <div class="flex items-center gap-3">
        <div class="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform">
            <i data-lucide="layers" class="w-6 h-6"></i>
        </div>

        <div class="text-left">
            <h3 class="text-slate-200 font-bold text-sm">Lancer les Flashcards</h3>
            <p class="text-slate-500 text-xs">${cards.length} cartes</p>
        </div>
    </div>

    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-600 group-hover:text-slate-400"></i>
`;

        btn.onclick = () => startFlashcardSession(cards, block.id);
        div.appendChild(btn);
    }
    return div;
}

function renderCustomWidgetBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';

    const defaultHtml = '<div class="p-4 bg-indigo-500 text-white rounded">Hello Widget!</div>';
    const defaultJs = 'console.log("Widget loaded");';
    const defaultCss = '';

    const content = {
        html: block.content.html || defaultHtml,
        css: block.content.css || defaultCss,
        js: block.content.js || defaultJs,
        align: block.content.align || 'center'
    };

    const getJustify = (align) => align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-indigo-400">
                        <i data-lucide="code" class="w-4 h-4"></i>
                        <span class="text-xs font-bold uppercase">Éditeur de Widget Custom</span>
                    </div>
                    <div class="flex items-center gap-3">
                         <div class="flex bg-slate-900 rounded p-1 border border-slate-600">
                            <button class="align-btn p-1 rounded hover:bg-slate-700 ${content.align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="left" title="Aligner à gauche"><i data-lucide="align-left" class="w-4 h-4"></i></button>
                            <button class="align-btn p-1 rounded hover:bg-slate-700 ${content.align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="center" title="Centrer"><i data-lucide="align-center" class="w-4 h-4"></i></button>
                            <button class="align-btn p-1 rounded hover:bg-slate-700 ${content.align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="right" title="Aligner à droite"><i data-lucide="align-right" class="w-4 h-4"></i></button>
                        </div>
                        <button class="refresh-btn text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded transition-colors">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs text-slate-500 font-bold uppercase">HTML</label>
                        <textarea class="widget-html w-full h-32 bg-slate-900 border border-slate-600 text-slate-300 p-2 rounded text-xs font-mono outline-none focus:border-indigo-500 resize-none">${content.html}</textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs text-slate-500 font-bold uppercase">CSS</label>
                        <textarea class="widget-css w-full h-32 bg-slate-900 border border-slate-600 text-slate-300 p-2 rounded text-xs font-mono outline-none focus:border-indigo-500 resize-none">${content.css}</textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs text-slate-500 font-bold uppercase">JS</label>
                        <textarea class="widget-js w-full h-32 bg-slate-900 border border-slate-600 text-slate-300 p-2 rounded text-xs font-mono outline-none focus:border-indigo-500 resize-none">${content.js}</textarea>
                    </div>
                </div>

                <div class="preview-container border-t border-slate-700 pt-4 mt-2">
                    <label class="text-xs text-slate-500 font-bold uppercase mb-2 block">Aperçu en direct</label>
                    <div class="iframe-wrapper w-full rounded-xl overflow-hidden bg-transparent border border-slate-700/50 min-h-[100px]"></div>
                </div>
            </div>
        `;

        const updateWidget = () => {
            updateBlock(block.id, {
                html: div.querySelector('.widget-html').value,
                css: div.querySelector('.widget-css').value,
                js: div.querySelector('.widget-js').value,
                align: content.align
            }, true);
        };

        const renderPreview = () => {
            const wrapper = div.querySelector('.iframe-wrapper');
            wrapper.innerHTML = '';

            const iframe = document.createElement('iframe');
            iframe.className = 'w-full border-0 bg-transparent block';
            iframe.style.minHeight = '200px';

            const currentHtml = div.querySelector('.widget-html').value;
            const currentCss = div.querySelector('.widget-css').value;
            const currentJs = div.querySelector('.widget-js').value;

            const srcDoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; font-family: sans-serif; background: transparent; display: flex; justify-content: ${getJustify(content.align)}; }
                        ${currentCss}
                    </style>
                </head>
                <body>
                    ${currentHtml}
                    <script>
                        try {
                            (function() {
                                this.shadowRoot = document;
                                ${currentJs}
                            }).call({ shadowRoot: document });
                        } catch (e) {
                            console.error("Widget JS Error:", e);
                        }
                    </script>
                </body>
                </html>
            `;

            iframe.srcdoc = srcDoc;
            iframe.onload = () => {
                const height = iframe.contentWindow.document.body.scrollHeight;
                iframe.style.height = (height + 20) + 'px';
            };

            wrapper.appendChild(iframe);
        };

        // Prevent drag propagation on the preview area to allow interaction (sliders, buttons)
        div.querySelector('.preview-container').onmousedown = (e) => e.stopPropagation();

        // Event Listeners
        div.querySelector('.widget-html').oninput = updateWidget;
        div.querySelector('.widget-css').oninput = updateWidget;
        div.querySelector('.widget-js').oninput = updateWidget;

        div.querySelector('.refresh-btn').onclick = renderPreview;

        // Alignment Buttons
        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => {
                content.align = btn.dataset.align;
                updateWidget(); // Save state
                // Update UI
                div.querySelectorAll('.align-btn').forEach(b => {
                    b.className = `align-btn p-1 rounded hover:bg-slate-700 ${b.dataset.align === content.align ? 'bg-indigo-600 text-white' : 'text-slate-400'}`;
                });
                renderPreview(); // Re-render preview with new alignment
            };
        });

        // Initial Render
        setTimeout(renderPreview, 100);

    } else {
        const iframe = document.createElement('iframe');
        iframe.className = 'w-full border-0 rounded-xl overflow-hidden bg-transparent';
        iframe.style.minHeight = '200px';

        const srcDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; font-family: sans-serif; background: transparent; display: flex; justify-content: ${getJustify(content.align)}; }
                    ${content.css}
                </style>
            </head>
            <body>
                ${content.html}
                <script>
                    try {
                        (function() {
                            this.shadowRoot = document;
                            ${content.js}
                        }).call({ shadowRoot: document });
                    } catch (e) {
                        console.error("Widget JS Error:", e);
                    }
                </script>
            </body>
            </html>
        `;

        iframe.srcdoc = srcDoc;

        // Auto-resize iframe height
        iframe.onload = () => {
            const height = iframe.contentWindow.document.body.scrollHeight;
            iframe.style.height = (height + 20) + 'px';
        };

        div.appendChild(iframe);
    }

    return div;
}

function renderTimelineBlock(block) {
    const div = document.createElement('div');
    const events = block.content.events || [];

    if (editMode) {
        div.className = 'bg-slate-800 p-4 rounded-xl border border-slate-700 my-6 flex flex-col gap-3';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 text-indigo-400">
                    <i data-lucide="calendar" class="w-4 h-4"></i> <span class="text-xs font-bold uppercase">Éditeur de Timeline (${events.length} événements)</span>
                </div>
            </div>
            <div class="space-y-4" id="timeline-editor-${block.id}"></div>
            <button class="add-event-btn w-full py-2 bg-slate-700 rounded text-xs text-slate-300 hover:text-white">+ Ajouter un événement</button>
        `;

        const editorContainer = div.querySelector(`#timeline-editor-${block.id}`);
        editorContainer.className = "space-y-2 relative overflow-hidden transition-all duration-300 ease-in-out";
        editorContainer.style.maxHeight = "400px";

        events.forEach((ev, idx) => {
            const row = document.createElement('div');
            row.className = 'flex flex-col gap-2 p-3 bg-slate-900/50 rounded border border-slate-700 relative group/item';
            row.innerHTML = `
                <div class="flex gap-2">
                    <input class="ev-date w-24 bg-transparent border-b border-slate-600 text-xs text-indigo-400 font-mono focus:outline-none" value="${ev.date}" placeholder="Date (ex: 2024)">
                    <input class="ev-title flex-1 bg-transparent border-b border-slate-600 text-xs text-white font-bold focus:outline-none" value="${ev.title}" placeholder="Titre">
                    <button class="del-event-btn text-slate-600 hover:text-red-400"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
                <textarea class="ev-desc w-full bg-transparent text-xs text-slate-400 focus:outline-none resize-none h-10" placeholder="Description...">${ev.description || ''}</textarea>
            `;

            row.querySelector('.ev-date').oninput = (e) => { events[idx].date = e.target.value; updateBlock(block.id, { events }, true); };
            row.querySelector('.ev-title').oninput = (e) => { events[idx].title = e.target.value; updateBlock(block.id, { events }, true); };
            row.querySelector('.ev-desc').oninput = (e) => { events[idx].description = e.target.value; updateBlock(block.id, { events }, true); };
            row.querySelector('.del-event-btn').onclick = () => {
                const newEvents = events.filter((_, i) => i !== idx);
                updateBlock(block.id, { events: newEvents });
                renderContent();
            };
            editorContainer.appendChild(row);
        });

        // Show More logic
        if (events.length > 3) {
            const expandBtnContainer = document.createElement('div');
            expandBtnContainer.className = 'absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent flex items-end justify-center pb-2 z-10';
            expandBtnContainer.innerHTML = `
                <button class="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full shadow-lg transition-all">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i> Voir tout
                </button>
            `;
            expandBtnContainer.querySelector('button').onclick = () => {
                editorContainer.style.maxHeight = 'none';
                expandBtnContainer.remove();
            };
            editorContainer.appendChild(expandBtnContainer);
        } else {
            editorContainer.style.maxHeight = 'none';
        }

        div.querySelector('.add-event-btn').onclick = () => {
            updateBlock(block.id, { events: [...events, { date: "2025", title: "Nouvel événement", description: "" }] });
            renderContent();
        };

    } else {
        div.className = 'my-8 pl-4 border-l-2 border-slate-800 ml-2 space-y-8';
        if (events.length === 0) {
            div.className = 'my-6';
            div.innerHTML = '<div class="text-center text-slate-500 text-xs italic">Timeline vide.</div>';
            return div;
        }

        events.forEach(ev => {
            const item = document.createElement('div');
            item.className = 'relative pl-6';
            item.innerHTML = `
                <div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-4 border-[#0f1117]"></div>
                <div class="flex flex-col">
                    <span class="text-xs font-mono text-indigo-400 mb-0.5">${ev.date}</span>
                    <h4 class="text-white font-bold text-sm mb-1">${ev.title}</h4>
                    ${ev.description ? `<p class="text-slate-400 text-xs leading-relaxed">${ev.description}</p>` : ''}
                </div>
            `;
            div.appendChild(item);
        });
    }
    return div;
}
