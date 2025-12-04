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

    // Helper to insert zone
    const addZone = (index) => {
        if (editMode) {
            learnView.appendChild(renderInsertionZone(index));
        }
    };

    blocks.forEach((block, index) => {
        addZone(index);

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
            // Mobile: Overlay top, always visible. Desktop: Left side, visible on hover.
            controls.className = 'absolute top-0 left-0 right-0 h-full z-20 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 md:-left-10 md:right-auto md:w-10 transition-opacity';

            const stickyControls = document.createElement('div');
            // Mobile: Horizontal spread. Desktop: Vertical stack.
            stickyControls.className = 'sticky top-0 flex justify-between p-2 w-full pointer-events-none md:flex-col md:w-auto md:p-0 md:gap-1';
            controls.appendChild(stickyControls);

            // Drag Handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'p-1.5 bg-slate-800/90 text-slate-400 cursor-grab active:cursor-grabbing rounded-lg border border-slate-700 flex items-center justify-center shadow-sm backdrop-blur-sm pointer-events-auto';
            dragHandle.innerHTML = `<i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i>`;
            stickyControls.appendChild(dragHandle);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'p-1.5 bg-slate-800/90 text-red-500 hover:bg-red-900/50 rounded-lg border border-slate-700 shadow-sm backdrop-blur-sm pointer-events-auto';
            deleteBtn.innerHTML = `<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>`;
            deleteBtn.onclick = () => deleteBlock(block.id);
            stickyControls.appendChild(deleteBtn);

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

    // Add final zone
    addZone(blocks.length);

    lucide.createIcons();
}

function renderInsertionZone(index) {
    const container = document.createElement('div');
    container.className = 'h-4 -my-2 relative z-10 group/zone flex items-center justify-center cursor-pointer transition-all hover:h-12';

    // Invisible hit area that becomes visible on hover
    const line = document.createElement('div');
    line.className = 'w-full h-0.5 bg-indigo-500/0 group-hover/zone:bg-indigo-500/50 transition-colors rounded-full relative flex items-center justify-center';

    const plusBtn = document.createElement('div');
    plusBtn.className = 'w-6 h-6 bg-indigo-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover/zone:opacity-100 transition-all transform scale-0 group-hover/zone:scale-100 shadow-lg';
    plusBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i>';

    line.appendChild(plusBtn);
    container.appendChild(line);

    container.onclick = (e) => {
        e.stopPropagation();
        // Replace zone with panel
        const panel = renderAddBlockPanel(index);
        container.replaceWith(panel);
        lucide.createIcons();
    };

    return container;
}

function renderAddBlockPanel(index) {
    const div = document.createElement('div');
    div.className = 'my-4 border-2 border-dashed border-indigo-500/30 rounded-xl p-6 bg-slate-900/40 text-center animate-in fade-in zoom-in duration-200';
    div.innerHTML = `
        <div class="mb-4 text-sm text-slate-400 font-medium">Ajouter un bloc ou glisser un fichier</div>
        <div class="flex justify-center gap-3 flex-wrap">
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="text" title="Texte"><i data-lucide="type" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="code" title="Code"><i data-lucide="terminal" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="video" title="Vidéo"><i data-lucide="video" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="image" title="Image"><i data-lucide="image" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="quiz" title="Quiz"><i data-lucide="brain" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="flashcard" title="Flashcards"><i data-lucide="layers" class="w-5 h-5"></i></button>
        </div>
        <button class="cancel-btn mt-4 text-xs text-slate-500 hover:text-red-400 underline">Annuler</button>
    `;

    div.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => addBlock(btn.dataset.type, null, index);
    });

    div.querySelector('.cancel-btn').onclick = () => {
        // Revert to zone
        div.replaceWith(renderInsertionZone(index));
        lucide.createIcons();
    };

    return div;
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
                        preview.innerHTML = marked.parse(chunkContent, { breaks: true });
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

    let codeContent = block.content;
    let language = 'python'; // Default

    if (typeof block.content === 'object' && block.content !== null) {
        codeContent = block.content.code || '';
        language = block.content.language || 'python';
    }

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-700';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xs text-orange-400 font-mono">In [ ]:</span>
            <span class="text-xs text-slate-400 uppercase">${language}</span>
        </div>
        <div class="flex items-center gap-2">
            <button class="copy-code-btn flex items-center gap-1 text-slate-400 hover:text-white p-1 rounded transition-colors" title="Copier le code">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button class="run-code-btn flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors">
                <i data-lucide="play" class="w-3 h-3"></i> Run
            </button>
        </div>
    `;
    const body = document.createElement('div');
    body.className = 'relative';
    if (editMode) {
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-48 bg-[#1e1e1e] text-slate-300 p-4 font-mono text-sm outline-none resize-none border-b border-slate-700 focus:border-indigo-500';
        textarea.value = codeContent;
        textarea.spellcheck = false;
        textarea.oninput = (e) => {
            const newContent = typeof block.content === 'object' ? { ...block.content, code: e.target.value } : e.target.value;
            updateBlock(block.id, newContent);
        };
        body.appendChild(textarea);
    } else {
        const pre = document.createElement('div');
        pre.className = 'p-4 font-mono text-sm text-gray-300 overflow-x-auto relative transition-all duration-300 ease-in-out custom-scrollbar';

        // Limit height by default (approx 20 lines)
        pre.style.maxHeight = '400px';
        pre.style.overflowY = 'hidden';

        // Use highlight.js if available
        if (window.hljs) {
            const highlighted = hljs.highlight(codeContent, { language: language, ignoreIllegals: true }).value;
            pre.innerHTML = `<pre><code class="hljs language-${language}" style="white-space: pre;">${highlighted}</code></pre>`;
        } else {
            pre.innerHTML = `<pre style="white-space: pre;">${codeContent}</pre>`;
        }
        body.appendChild(pre);

        // Check if content is long enough to need a "Show More" button
        const lineCount = codeContent.split('\n').length;
        if (lineCount > 20) {
            const expandBtnContainer = document.createElement('div');
            expandBtnContainer.className = 'absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent flex items-end justify-center pb-2';
            expandBtnContainer.innerHTML = `
                <button class="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full shadow-lg transition-all">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i> Voir tout le code
                </button>
            `;
            expandBtnContainer.querySelector('button').onclick = () => {
                pre.style.maxHeight = 'none';
                expandBtnContainer.remove();
            };
            body.appendChild(expandBtnContainer);
        } else {
            pre.style.maxHeight = 'none';
        }
    }
    const outputDiv = document.createElement('div');
    outputDiv.className = 'hidden bg-[#252526] border-t border-slate-700 p-4 font-mono text-sm';
    outputDiv.innerHTML = `<span class="text-xs text-red-400 block mb-2">Out [1]:</span><pre class="text-white">Process finished with exit code 0\n> Execution successful.</pre>`;

    // Copy Button Logic
    header.querySelector('.copy-code-btn').onclick = () => {
        navigator.clipboard.writeText(codeContent).then(() => {
            const btn = header.querySelector('.copy-code-btn');
            btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i>`;
                lucide.createIcons();
            }, 2000);
        });
    };

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
            qDiv.querySelector('.q-input').oninput = (e) => { questions[qIdx].question = e.target.value; updateBlock(block.id, { questions }); };
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
                optDiv.querySelector('.opt-input').oninput = (e) => { questions[qIdx].options[oIdx] = e.target.value; updateBlock(block.id, { questions }); };
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
            row.querySelector('.fc-q').oninput = (e) => { cards[i].question = e.target.value; updateBlock(block.id, cards); };
            row.querySelector('.fc-a').oninput = (e) => { cards[i].answer = e.target.value; updateBlock(block.id, cards); };
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

function updateBlock(blockId, newContent, skipRender = false) {
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.blocks = activeData.sub.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
    if (!skipRender) renderContent();
}

function addBlock(type, content, index = -1) {
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

    if (index === -1) {
        activeData.sub.blocks.push(newBlock);
    } else {
        activeData.sub.blocks.splice(index, 0, newBlock);
    }
    renderContent();
}

function deleteBlock(blockId) {
    if (!confirm("Supprimer ce bloc ?")) return;
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.blocks = activeData.sub.blocks.filter(b => b.id !== blockId);
    renderContent();
}
