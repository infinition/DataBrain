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

            typesetMath(div);
        } catch (e) {
            div.textContent = block.content;
            console.error("Markdown parsing error:", e);
        }
    }
    return div;
}
