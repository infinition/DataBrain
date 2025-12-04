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
            case 'audio': contentDiv = renderAudioBlock(block); break;
            case 'image': contentDiv = renderImageBlock(block); break;
            case 'math': contentDiv = renderMathBlock(block); break;
            case 'quiz': contentDiv = renderQuizBlock(block); break;
            case 'flashcard': contentDiv = renderFlashcardBlock(block); break;
            case 'custom-widget': contentDiv = renderCustomWidgetBlock(block); break;
            case 'jupyter': contentDiv = renderJupyterBlock(block); break;
            case 'embed': contentDiv = renderEmbedBlock(block); break;
            case 'timeline': contentDiv = renderTimelineBlock(block); break;
            case 'model3d': contentDiv = render3DBlock(block); break;
            case 'graph': contentDiv = renderGraphBlock(block); break;
            case 'chart': contentDiv = renderChartBlock(block); break;
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
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="audio" title="Audio"><i data-lucide="music" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="image" title="Image"><i data-lucide="image" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="math" title="Math"><i data-lucide="sigma" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="quiz" title="Quiz"><i data-lucide="brain" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="flashcard" title="Flashcards"><i data-lucide="layers" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="custom-widget" title="Widget Custom"><i data-lucide="code" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="jupyter" title="Jupyter Notebook"><i data-lucide="play-circle" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="embed" title="Embed / Fichier"><i data-lucide="paperclip" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="timeline" title="Timeline"><i data-lucide="calendar" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="model3d" title="Modèle 3D"><i data-lucide="box" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="graph" title="Graph / Mindmap"><i data-lucide="git-fork" class="w-5 h-5"></i></button>
            <button class="add-btn p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-all hover:-translate-y-1" data-type="chart" title="Graphique"><i data-lucide="bar-chart-2" class="w-5 h-5"></i></button>
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
                        : type === 'audio' ? { title: "Nouvel audio", src: "" }
                            : type === 'image' ? { src: "", caption: "" }
                                : type === 'math' ? { latex: "E = mc^2" }
                                    : type === 'custom-widget' ? { html: "<div>Hello</div>", css: "div { color: blue; }", js: "console.log('Hi');" }
                                        : type === 'jupyter' ? { code: "import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.plot(x, y)\nplt.title('Sinus Wave')\nplt.show()" }
                                            : type === 'embed' ? { src: "", title: "Nouveau fichier", type: "auto" }
                                                : type === 'timeline' ? { events: [{ date: "2024", title: "Début", description: "Description..." }] }
                                                    : type === 'model3d' ? { src: "", title: "Nouveau modèle 3D", autoRotate: false }
                                                        : type === 'graph' ? { code: "graph TD\n  A[Start] --> B{Is it?}\n  B -- Yes --> C[OK]\n  C --> D[Rethink]\n  D --> B\n  B -- No --> E[End]", type: "mermaid" }
                                                            : type === 'chart' ? { config: JSON.stringify({ type: 'bar', data: { labels: ['A', 'B', 'C'], datasets: [{ label: 'Data', data: [10, 20, 30], backgroundColor: ['#6366f1', '#8b5cf6', '#d946ef'] }] }, options: { scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#cbd5e1' } }, x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#cbd5e1' } } }, plugins: { legend: { labels: { color: '#cbd5e1' } } } } }, null, 2) }
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
