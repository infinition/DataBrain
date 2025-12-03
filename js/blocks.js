// Configure Marked to add IDs to headings
if (typeof marked !== 'undefined') {
    const renderer = {
        heading(text, level) {
            const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            return `<h${level} id="${escapedText}">${text}</h${level}>`;
        }
    };
    marked.use({ renderer });
} else {
    console.error("Marked.js library is not loaded.");
}

// --- Block Renderers ---

function renderBlocks(blocks) {
    learnView.innerHTML = '';
    blocks.forEach(block => {
        const blockWrapper = document.createElement('div');
        blockWrapper.className = 'group relative transition-all duration-200';
        blockWrapper.dataset.id = block.id;

        // Edit Mode Controls (Delete & Drag)
        if (editMode) {
            blockWrapper.setAttribute('draggable', 'true');

            // Drag Events
            blockWrapper.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.id);
                e.dataTransfer.effectAllowed = 'move';
                blockWrapper.classList.add('opacity-40');
            });

            blockWrapper.addEventListener('dragend', () => {
                blockWrapper.classList.remove('opacity-40');
                document.querySelectorAll('.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
                document.querySelectorAll('.drag-over-bottom').forEach(el => el.classList.remove('drag-over-bottom'));
            });

            blockWrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const rect = blockWrapper.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                blockWrapper.classList.remove('drag-over-top', 'drag-over-bottom');
                if (e.clientY < midY) {
                    blockWrapper.classList.add('drag-over-top');
                } else {
                    blockWrapper.classList.add('drag-over-bottom');
                }
            });

            blockWrapper.addEventListener('dragleave', () => {
                blockWrapper.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            blockWrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                blockWrapper.classList.remove('drag-over-top', 'drag-over-bottom');
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId !== block.id) {
                    const rect = blockWrapper.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const position = e.clientY < midY ? 'before' : 'after';
                    reorderBlocks(draggedId, block.id, position);
                }
            });

            const controls = document.createElement('div');
            controls.className = 'absolute -left-10 top-0 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity';

            // Drag Handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'p-1.5 bg-slate-800 text-slate-400 cursor-grab active:cursor-grabbing rounded border border-slate-700 flex items-center justify-center';
            dragHandle.innerHTML = `<i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i>`;
            controls.appendChild(dragHandle);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'p-1.5 bg-slate-800 text-red-500 hover:bg-red-900/50 rounded border border-slate-700';
            deleteBtn.innerHTML = `<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>`;
            deleteBtn.onclick = () => deleteBlock(block.id);
            controls.appendChild(deleteBtn);

            blockWrapper.appendChild(controls);
        }

        // Content
        let contentDiv;
        switch (block.type) {
            case 'text': contentDiv = renderTextBlock(block); break;
            case 'code': contentDiv = renderCodeBlock(block); break;
            case 'video': contentDiv = renderVideoBlock(block); break;
            case 'image': contentDiv = renderImageBlock(block); break;
            case 'quiz': contentDiv = renderQuizBlock(block); break;
            case 'flashcard': contentDiv = renderFlashcardBlock(block); break;
            default: contentDiv = document.createElement('div');
        }
        blockWrapper.appendChild(contentDiv);
        learnView.appendChild(blockWrapper);
    });
    lucide.createIcons();
}

function reorderBlocks(draggedId, targetId, position) {
    const activeData = findActiveData();
    if (!activeData) return;

    const blocks = activeData.sub.blocks;
    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged block
    const [draggedBlock] = blocks.splice(draggedIndex, 1);

    // Calculate new index
    // Note: If we removed an item before the target, the target index shifted down by 1
    let newTargetIndex = blocks.findIndex(b => b.id === targetId);

    if (position === 'after') {
        newTargetIndex++;
    }

    blocks.splice(newTargetIndex, 0, draggedBlock);
    renderContent();
}

function renderTextBlock(block) {
    const div = document.createElement('div');
    // Track the last active textarea for toolbar actions
    let lastActiveTextarea = null;

    if (editMode) {
        div.className = 'border border-dashed border-slate-700 rounded-xl bg-slate-900/30 flex flex-col transition-colors hover:border-indigo-500/50 relative group/editor min-h-[100px]';

        // --- Toolbar ---
        const toolbar = document.createElement('div');
        toolbar.className = 'sticky top-0 z-10 flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-900/80 backdrop-blur-md overflow-x-auto rounded-t-xl';
        // Prevent drag start from toolbar
        toolbar.onmousedown = (e) => e.stopPropagation();

        const createBtn = (icon, action, tooltip) => {
            const btn = document.createElement('button');
            btn.className = 'p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors';
            btn.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i>`;
            btn.title = tooltip;
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent block focus logic
                action();
            };
            return btn;
        };

        const insertFormat = (startTag, endTag = '') => {
            // Use the focused textarea or the last active one
            let activeInput = div.querySelector('textarea:focus') || lastActiveTextarea;

            // If still none, default to the first one
            if (!activeInput) {
                activeInput = div.querySelector('textarea');
            }

            if (activeInput) {
                const start = activeInput.selectionStart;
                const end = activeInput.selectionEnd;
                const text = activeInput.value;
                const before = text.substring(0, start);
                const selected = text.substring(start, end);
                const after = text.substring(end);

                const newText = before + startTag + selected + endTag + after;
                activeInput.value = newText;

                // Trigger input event to resize/update
                activeInput.dispatchEvent(new Event('input'));
                activeInput.focus();
                activeInput.setSelectionRange(start + startTag.length, end + startTag.length);
            }
        };

        toolbar.appendChild(createBtn('bold', () => insertFormat('**', '**'), 'Gras'));
        toolbar.appendChild(createBtn('italic', () => insertFormat('*', '*'), 'Italique'));
        toolbar.appendChild(createBtn('heading-1', () => insertFormat('# '), 'Titre 1'));
        toolbar.appendChild(createBtn('heading-2', () => insertFormat('## '), 'Titre 2'));
        toolbar.appendChild(createBtn('heading-3', () => insertFormat('### '), 'Titre 3'));
        toolbar.appendChild(createBtn('list', () => insertFormat('- '), 'Liste à puces'));
        toolbar.appendChild(createBtn('check-square', () => insertFormat('- [ ] '), 'Task List'));
        toolbar.appendChild(createBtn('code', () => insertFormat('`', '`'), 'Code inline'));
        toolbar.appendChild(createBtn('link', () => insertFormat('[', '](url)'), 'Lien'));
        toolbar.appendChild(createBtn('image', () => insertFormat('![Alt](', ')'), 'Image'));

        div.appendChild(toolbar);

        // --- Content Container ---
        const container = document.createElement('div');
        container.className = 'flex flex-col p-4';

        // 1. Group lines into "Chunks" (Paragraphs/Blocks)
        const rawLines = block.content.split('\n');
        const chunks = [];
        let currentChunk = [];
        let inCodeBlock = false;

        rawLines.forEach((line, index) => {
            const isCodeFence = line.trim().startsWith('```');
            if (isCodeFence) inCodeBlock = !inCodeBlock;

            if (inCodeBlock) {
                currentChunk.push(line);
            } else {
                if (line.trim() === '') {
                    // Empty line -> End current chunk, push empty chunk
                    if (currentChunk.length > 0) {
                        chunks.push({ lines: currentChunk, type: 'content' });
                        currentChunk = [];
                    }
                    chunks.push({ lines: [line], type: 'empty' });
                } else {
                    // Content line -> Add to current chunk
                    currentChunk.push(line);
                }
            }
        });
        if (currentChunk.length > 0) chunks.push({ lines: currentChunk, type: 'content' });

        // 2. Render Chunks
        const renderChunk = (chunkIndex, focus = false) => {
            const chunk = chunks[chunkIndex];
            const chunkContent = chunk.lines.join('\n');
            const chunkDiv = document.createElement('div');

            chunkDiv.dataset.chunkIndex = chunkIndex;

            if (chunk.type === 'empty') {
                chunkDiv.className = 'min-h-[1em]';
                chunkDiv.innerHTML = '<br>';
            } else {
                chunkDiv.className = 'min-h-[1.5em] relative group/chunk';
            }

            // Edit Mode (Textarea)
            const createInput = () => {
                const input = document.createElement('textarea');
                input.className = 'w-full bg-transparent text-slate-300 outline-none font-mono text-sm resize-none overflow-hidden block';
                input.value = chunkContent;
                input.rows = Math.max(1, chunk.lines.length);

                // Prevent drag/click propagation
                input.onmousedown = (e) => e.stopPropagation();
                input.onclick = (e) => e.stopPropagation();
                input.ondblclick = (e) => e.stopPropagation();

                const adjustHeight = () => {
                    input.style.height = 'auto';
                    input.style.height = input.scrollHeight + 'px';
                };

                input.onfocus = () => {
                    lastActiveTextarea = input;
                    const wrapper = div.closest('.group');
                    if (wrapper) wrapper.setAttribute('draggable', 'false');
                };

                let isUpdating = false;

                // Save & Preview on Blur
                input.onblur = () => {
                    if (isUpdating) return;
                    isUpdating = true;

                    setTimeout(() => {
                        const activeEl = document.activeElement;
                        const isToolbar = activeEl && div.contains(activeEl) && activeEl.tagName === 'BUTTON';
                        const isAnotherChunk = activeEl && div.contains(activeEl) && activeEl.tagName === 'TEXTAREA';

                        if (isToolbar) {
                            isUpdating = false;
                            return;
                        }

                        if (document.activeElement !== input) {
                            // Ensure the node is still in the DOM before trying to replace it
                            if (!chunkDiv.parentNode) {
                                isUpdating = false;
                                return;
                            }

                            const newLines = input.value.split('\n');
                            chunks[chunkIndex].lines = newLines;

                            const allLines = chunks.flatMap(c => c.lines);
                            updateBlock(block.id, allLines.join('\n'), true);

                            const hasNewBlanks = newLines.some(l => l.trim() === '');
                            if (hasNewBlanks) {
                                renderContent();
                            } else {
                                const newChunkDiv = renderChunk(chunkIndex);
                                if (chunkDiv.parentNode === container) {
                                    container.replaceChild(newChunkDiv, chunkDiv);
                                }
                            }

                            if (!isAnotherChunk) {
                                const wrapper = div.closest('.group');
                                if (wrapper) wrapper.setAttribute('draggable', 'true');
                            }
                        }
                        isUpdating = false;
                    }, 150);
                };

                input.oninput = () => adjustHeight();
                setTimeout(adjustHeight, 0);
                return input;
            };

            // Preview Mode (HTML)
            const createPreview = () => {
                const preview = document.createElement('div');
                preview.className = 'prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed cursor-text [&>*]:my-0';

                if (chunk.type === 'empty') {
                    preview.innerHTML = '<br>';
                } else {
                    try {
                        preview.innerHTML = marked.parse(chunkContent);
                        preview.querySelectorAll('a[href^="#"]').forEach(anchor => {
                            anchor.addEventListener('click', function (e) {
                                e.preventDefault();
                                const targetId = this.getAttribute('href').substring(1);
                                const targetElement = document.getElementById(targetId);
                                if (targetElement) {
                                    targetElement.scrollIntoView({ behavior: 'smooth' });
                                }
                            });
                        });
                    } catch (e) {
                        preview.textContent = chunkContent;
                    }
                }
                return preview;
            };

            if (focus) {
                const input = createInput();
                chunkDiv.appendChild(input);
                setTimeout(() => input.focus(), 0);
            } else {
                const preview = createPreview();
                chunkDiv.appendChild(preview);

                chunkDiv.onclick = (e) => {
                    e.stopPropagation();
                    chunkDiv.innerHTML = '';
                    const input = createInput();
                    chunkDiv.appendChild(input);
                    input.focus();
                };
            }

            return chunkDiv;
        };

        chunks.forEach((_, i) => {
            container.appendChild(renderChunk(i));
        });

        div.onclick = (e) => {
            if (e.target === div || e.target === container) {
                chunks.push({ lines: [""], type: 'empty' });
                const newChunkIndex = chunks.length - 1;

                const allLines = chunks.flatMap(c => c.lines);
                updateBlock(block.id, allLines.join('\n'), true);

                const newChunk = renderChunk(newChunkIndex, true);
                container.appendChild(newChunk);
            }
        };

        div.appendChild(container);
    } else {
        div.className = 'prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed';
        try {
            div.innerHTML = marked.parse(block.content, { breaks: true });
            div.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        } catch (e) {
            div.textContent = block.content;
            console.error("Markdown parsing error:", e);
        }
    }
    return div;
}

function renderCodeBlock(block) {
    const div = document.createElement('div');
    div.className = 'border border-slate-700 rounded-lg overflow-hidden bg-[#1e1e1e] my-4 shadow-lg group';
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-700';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xs text-orange-400 font-mono">In [ ]:</span>
            <span class="text-xs text-slate-400">Python 3.10</span>
        </div>
        <button class="run-code-btn flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors">
            <i data-lucide="play" class="w-3 h-3"></i> Run
        </button>
    `;
    const body = document.createElement('div');
    body.className = 'relative';
    if (editMode) {
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-48 bg-[#1e1e1e] text-slate-300 p-4 font-mono text-sm outline-none resize-none border-b border-slate-700 focus:border-indigo-500';
        textarea.value = block.content;
        textarea.spellcheck = false;
        textarea.oninput = (e) => updateBlock(block.id, e.target.value);
        body.appendChild(textarea);
    } else {
        const pre = document.createElement('div');
        pre.className = 'p-4 font-mono text-sm text-gray-300 overflow-x-auto';
        pre.innerHTML = `<pre>${block.content}</pre>`;
        body.appendChild(pre);
    }
    const outputDiv = document.createElement('div');
    outputDiv.className = 'hidden bg-[#252526] border-t border-slate-700 p-4 font-mono text-sm';
    outputDiv.innerHTML = `<span class="text-xs text-red-400 block mb-2">Out [1]:</span><pre class="text-white">Process finished with exit code 0\n> Execution successful.</pre>`;
    header.querySelector('.run-code-btn').onclick = () => {
        const btn = header.querySelector('.run-code-btn');
        btn.innerHTML = `<i data-lucide="cpu" class="w-3 h-3 animate-spin"></i> Run`;
        lucide.createIcons();
        setTimeout(() => {
            outputDiv.classList.remove('hidden');
            btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
            lucide.createIcons();
        }, 600);
    };
    div.appendChild(header);
    div.appendChild(body);
    div.appendChild(outputDiv);
    return div;
}

function renderVideoBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="video" class="w-3.5 h-3.5"></i> Configuration Vidéo</label>
                <input type="text" class="video-title-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="Titre de la vidéo" value="${block.content.title}">
                <input type="text" class="video-src-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="URL de la vidéo" value="${block.content.src}">
            </div>
        `;
        div.querySelector('.video-title-input').oninput = (e) => updateBlock(block.id, { ...block.content, title: e.target.value });
        div.querySelector('.video-src-input').oninput = (e) => updateBlock(block.id, { ...block.content, src: e.target.value });
    } else {
        div.innerHTML = `
            <div class="aspect-video bg-black rounded-xl flex flex-col items-center justify-center border border-slate-700 relative group cursor-pointer shadow-lg overflow-hidden">
                ${block.content.src ? `<video src="${block.content.src}" controls class="w-full h-full object-contain"></video>` : `
                <div class="flex flex-col items-center justify-center">
                    <i data-lucide="play-circle" class="w-16 h-16 text-white/50 mb-2"></i>
                    <span class="text-slate-500 text-xs">Aucune source vidéo</span>
                </div>`}
                <div class="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm backdrop-blur-md">${block.content.title}</div>
            </div>
        `;
    }
    return div;
}

function renderImageBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="image" class="w-3.5 h-3.5"></i> Configuration Image</label>
                <input type="text" class="img-src-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm" placeholder="URL de l'image" value="${block.content.src}">
                <input type="text" class="img-cap-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm" placeholder="Légende" value="${block.content.caption}">
            </div>
        `;
        div.querySelector('.img-src-input').oninput = (e) => updateBlock(block.id, { ...block.content, src: e.target.value });
        div.querySelector('.img-cap-input').oninput = (e) => updateBlock(block.id, { ...block.content, caption: e.target.value });
    } else {
        div.innerHTML = `
            <figure class="flex flex-col items-center">
                <img src="${block.content.src}" alt="content" class="rounded-xl max-h-[500px] object-contain border border-slate-700 bg-slate-900" />
                ${block.content.caption ? `<figcaption class="text-slate-500 text-xs mt-2 italic">${block.content.caption}</figcaption>` : ''}
            </figure>
        `;
    }
    return div;
}

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
        questions.forEach((q, qIdx) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'border border-slate-700 p-2 rounded bg-slate-900/50';
            qDiv.innerHTML = `
                <input type="text" class="q-input w-full bg-transparent border-b border-slate-700 mb-2 text-sm text-white focus:outline-none" value="${q.question}">
                <div class="space-y-1 options-container"></div>
                <button class="del-q-btn text-[10px] text-red-400 mt-2 hover:underline">Supprimer question</button>
            `;
            qDiv.querySelector('.q-input').oninput = (e) => { questions[qIdx].question = e.target.value; updateBlock(block.id, { questions }); };
            const optsContainer = qDiv.querySelector('.options-container');
            q.options.forEach((opt, oIdx) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'flex gap-2 items-center';
                optDiv.innerHTML = `
                    <div class="w-3 h-3 rounded-full border cursor-pointer ${q.correct === oIdx ? 'bg-green-500 border-green-500' : 'border-slate-500'}"></div>
                    <input type="text" class="opt-input flex-1 bg-transparent text-xs text-slate-400 border-none focus:outline-none" value="${opt}">
                `;
                optDiv.querySelector('div').onclick = () => { questions[qIdx].correct = oIdx; updateBlock(block.id, { questions }); renderContent(); };
                optDiv.querySelector('.opt-input').oninput = (e) => { questions[qIdx].options[oIdx] = e.target.value; updateBlock(block.id, { questions }); };
                optsContainer.appendChild(optDiv);
            });
            qDiv.querySelector('.del-q-btn').onclick = () => { const newQs = questions.filter((_, i) => i !== qIdx); updateBlock(block.id, { questions: newQs }); renderContent(); };
            editorContainer.appendChild(qDiv);
        });
        div.querySelector('.add-q-btn').onclick = () => { updateBlock(block.id, { questions: [...questions, { question: "Nouvelle question", options: ["A", "B"], correct: 0 }] }); renderContent(); };
    } else {
        div.className = 'bg-slate-800/50 p-6 rounded-xl border border-slate-700 my-6 shadow-sm';
        let currentQ = 0;
        const renderQuizPlay = () => {
            if (questions.length === 0) { div.innerHTML = '<div class="p-4 bg-slate-800 rounded text-slate-500 text-xs">Quiz vide.</div>'; return; }
            const activeQ = questions[currentQ];
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2"><i data-lucide="brain" class="w-5 h-5 text-indigo-400"></i><h3 class="font-semibold text-white">Quiz</h3></div>
                    <span class="text-xs text-slate-500">Question ${currentQ + 1} / ${questions.length}</span>
                </div>
                <p class="text-slate-300 mb-4 font-medium">${activeQ.question}</p>
                <div class="space-y-2 mb-4 options-list"></div>
                <div class="flex justify-end next-btn-container"></div>
            `;
            const optsList = div.querySelector('.options-list');
            activeQ.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left p-3 rounded-lg text-sm transition-all border bg-slate-700/30 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-slate-300';
                btn.textContent = opt;
                btn.onclick = () => {
                    const isCorrect = idx === activeQ.correct;
                    btn.className = isCorrect ? 'w-full text-left p-3 rounded-lg text-sm transition-all border bg-green-900/20 border-green-500 text-green-200' : 'w-full text-left p-3 rounded-lg text-sm transition-all border bg-red-900/20 border-red-500 text-red-200';
                    const allBtns = optsList.querySelectorAll('button');
                    allBtns.forEach(b => b.disabled = true);
                    const nextContainer = div.querySelector('.next-btn-container');
                    if (currentQ < questions.length - 1) {
                        const nextBtn = document.createElement('button');
                        nextBtn.className = 'px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500';
                        nextBtn.innerHTML = 'Question Suivante &rarr;';
                        nextBtn.onclick = () => { currentQ++; renderQuizPlay(); };
                        nextContainer.appendChild(nextBtn);
                    } else { nextContainer.innerHTML = '<span class="text-green-400 text-sm font-bold">Quiz Terminé !</span>'; }
                };
                optsList.appendChild(btn);
            });
            lucide.createIcons();
        };
        renderQuizPlay();
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
        cards.forEach((c, i) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 p-2 bg-slate-800 rounded border border-slate-700 items-center';
            row.innerHTML = `
                <span class="text-xs text-slate-400 w-6">${i + 1}.</span>
                <input class="fc-q flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.question}" placeholder="Question">
                <input class="fc-a flex-1 bg-transparent border-b border-slate-600 text-xs text-white" value="${c.answer}" placeholder="Réponse">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 cursor-pointer text-red-400 del-fc"></i>
            `;
            row.querySelector('.fc-q').oninput = (e) => { cards[i].question = e.target.value; updateBlock(block.id, cards); };
            row.querySelector('.fc-a').oninput = (e) => { cards[i].answer = e.target.value; updateBlock(block.id, cards); };
            row.querySelector('.del-fc').onclick = () => { const newCards = cards.filter((_, idx) => idx !== i); updateBlock(block.id, newCards); renderContent(); };
            list.appendChild(row);
        });
        div.querySelector('.add-fc-btn').onclick = () => { updateBlock(block.id, [...cards, { question: "Nouvelle carte", answer: "Réponse" }]); renderContent(); };
    } else {
        div.className = 'my-6';
        if (cards.length === 0) { div.innerHTML = '<div class="text-center p-10 text-slate-500">Aucune flashcard.</div>'; return div; }

        let current = 0;
        let flipped = false;

        const renderCard = () => {
            div.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col items-center justify-center py-4';

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
                <button id="prev-card-${block.id}" class="p-2 rounded-full bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600" ${current === 0 ? 'disabled' : ''}>Précédent</button>
                <span class="text-slate-400 text-sm">${current + 1} / ${cards.length}</span>
                <button id="next-card-${block.id}" class="p-2 rounded-full bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600" ${current === cards.length - 1 ? 'disabled' : ''}>Suivant</button>
            `;

            controls.querySelector(`#prev-card-${block.id}`).onclick = (e) => { e.stopPropagation(); flipped = false; current = Math.max(0, current - 1); renderCard(); };
            controls.querySelector(`#next-card-${block.id}`).onclick = (e) => { e.stopPropagation(); flipped = false; current = Math.min(cards.length - 1, current + 1); renderCard(); };

            wrapper.appendChild(cardDiv);
            wrapper.appendChild(controls);
            div.appendChild(wrapper);
            lucide.createIcons();
        };
        renderCard();
    }
    return div;
}

function updateBlock(blockId, newContent, skipRender = false) {
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.blocks = activeData.sub.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
    if (!skipRender) renderContent();
}

function addBlock(type, content) {
    const activeData = findActiveData();
    if (!activeData) return;

    const defaultContent = type === 'text' ? "Nouveau texte..."
        : type === 'code' ? "print('Code')"
            : type === 'quiz' ? { questions: [{ question: "Question?", options: ["A", "B"], correct: 0 }] }
                : type === 'flashcard' ? [{ question: "Question?", answer: "Réponse" }]
                    : type === 'video' ? { title: "Nouvelle vidéo", src: "" }
                        : type === 'image' ? { src: "", caption: "" }
                            : {};

    const newBlock = {
        id: generateId(),
        type,
        content: content || defaultContent
    };
    activeData.sub.blocks.push(newBlock);
    renderContent();
}

function deleteBlock(blockId) {
    if (!confirm("Supprimer ce bloc ?")) return;
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.blocks = activeData.sub.blocks.filter(b => b.id !== blockId);
    renderContent();
}
