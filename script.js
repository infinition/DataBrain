// --- Données Initiales ---

const generateId = () => Math.random().toString(36).substr(2, 9);

let formations = [
    {
        id: 'f1',
        title: 'Formation Data Scientist',
        isOpen: true,
        modules: [
            {
                id: 'm1',
                title: 'Module 1 : Data Science',
                icon: 'folder',
                isOpen: true,
                chapters: [
                    {
                        id: 'c1',
                        title: 'Introduction',
                        isOpen: true,
                        subChapters: [
                            {
                                id: 'sc1',
                                title: 'Bienvenue',
                                type: 'page',
                                isCompleted: false,
                                isOpen: true,
                                subChapters: [], // Nested sub-chapters
                                flashcards: [
                                    { question: "Qu'est-ce que Pandas ?", answer: "Une librairie Python pour la manipulation de données." }
                                ],
                                blocks: [
                                    { id: 'b1', type: 'text', content: "Bienvenue dans votre Learning Hub. Activez le 'Mode Édition' pour glisser-déposer des fichiers ou structurer votre cours." },
                                    {
                                        id: 'b2',
                                        type: 'quiz',
                                        content: {
                                            questions: [
                                                { question: "Python est-il typé dynamiquement ?", options: ["Oui", "Non"], correct: 0 }
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// --- State ---
let activeFormationId = 'f1';
let activeModuleId = 'm1';
let activeChapterId = 'c1';
let activeSubId = 'sc1';
let activeTab = 'learn'; // 'learn' | 'flashcards'
let editMode = false;
let dragActive = false;

// --- DOM Elements ---
const sidebarContent = document.getElementById('sidebar-content');
const addFormationBtn = document.getElementById('add-formation-btn');
const tabLearn = document.getElementById('tab-learn');
const tabFlashcards = document.getElementById('tab-flashcards');
const toggleEditModeBtn = document.getElementById('toggle-edit-mode');
const editModeText = document.getElementById('edit-mode-text');
const learnView = document.getElementById('learn-view');
const flashcardsView = document.getElementById('flashcards-view');
const addBlockControls = document.getElementById('add-block-controls');
const mainContainer = document.getElementById('main-container');
const dragOverlay = document.getElementById('drag-overlay');

// --- Customization State ---
let customizationTarget = null; // { type, id, formId, modId, chapId }

// --- DOM Elements (Customization) ---
const customModal = document.getElementById('customization-modal');
const closeCustomModalBtn = document.getElementById('close-custom-modal');
const saveCustomBtn = document.getElementById('save-custom-btn');
const iconTabs = document.querySelectorAll('.icon-tab');
const lucidePicker = document.getElementById('lucide-picker');
const emojiPicker = document.getElementById('emoji-picker');
const emojiInput = document.getElementById('emoji-input');
const colorPicker = document.getElementById('color-picker');
const colorValue = document.getElementById('color-value');
const resetColorBtn = document.getElementById('reset-color-btn');

// --- Initialization ---
function init() {
    renderSidebar();
    renderContent();
    setupEventListeners();
    setupCustomizationListeners();
    populateLucidePicker();
    lucide.createIcons();
}

// --- Rendering ---

function renderSidebar() {
    sidebarContent.innerHTML = '';
    formations.forEach(formation => {
        const formationDiv = document.createElement('div');
        formationDiv.className = 'mb-6 border-b border-slate-800 pb-4';

        // Formation Header
        const formHeader = document.createElement('div');
        formHeader.className = 'flex items-center justify-between px-2 py-1 text-indigo-400 hover:text-indigo-300 group mb-2';
        formHeader.innerHTML = `
            <div class="flex items-center gap-2 cursor-pointer formation-toggle" data-id="${formation.id}">
                <i data-lucide="${formation.isOpen ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4"></i>
                <span class="text-sm font-bold uppercase tracking-wider" style="${formation.color ? `color: ${formation.color}` : ''}">${formation.title}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="formation" data-id="${formation.id}" title="Personnaliser">
                    <i data-lucide="palette" class="w-3.5 h-3.5"></i>
                </button>
                <button class="text-slate-500 hover:text-green-400 add-module-btn" data-id="${formation.id}" title="Ajouter Module">
                    <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        formationDiv.appendChild(formHeader);

        if (formation.isOpen) {
            formation.modules.forEach(module => {
                const moduleDiv = document.createElement('div');
                moduleDiv.className = 'mb-2 ml-2';

                // Module Header
                const modHeader = document.createElement('div');
                modHeader.className = 'flex items-center justify-between px-2 py-1 text-slate-400 hover:text-white group';

                // Icon Logic
                let iconHtml = `<i data-lucide="${module.isOpen ? 'chevron-down' : 'chevron-right'}" class="w-3.5 h-3.5"></i>`;
                if (module.icon) {
                    if (module.icon.length > 2) { // Lucide icon name
                        iconHtml += `<i data-lucide="${module.icon}" class="w-3.5 h-3.5 ml-1"></i>`;
                    } else { // Emoji
                        iconHtml += `<span class="ml-1 text-sm">${module.icon}</span>`;
                    }
                }

                modHeader.innerHTML = `
                    <div class="flex items-center gap-2 cursor-pointer module-toggle" data-form-id="${formation.id}" data-id="${module.id}">
                        ${iconHtml}
                        <span class="text-xs font-semibold" style="${module.color ? `color: ${module.color}` : ''}">${module.title}</span>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="module" data-form-id="${formation.id}" data-id="${module.id}" title="Personnaliser">
                            <i data-lucide="palette" class="w-3 h-3"></i>
                        </button>
                        <button class="text-slate-500 hover:text-green-400 add-chapter-btn" data-form-id="${formation.id}" data-id="${module.id}" title="Ajouter Chapitre">
                            <i data-lucide="folder-plus" class="w-3 h-3"></i>
                        </button>
                    </div>
                `;
                moduleDiv.appendChild(modHeader);

                if (module.isOpen) {
                    module.chapters.forEach(chapter => {
                        const chapDiv = document.createElement('div');
                        chapDiv.className = 'ml-4 border-l border-slate-800 pl-2 mt-1';

                        const chapHeader = document.createElement('div');
                        chapHeader.className = 'flex items-center justify-between px-2 py-1 text-slate-400 hover:text-white group text-sm';

                        // Icon Logic
                        let chapIconHtml = `<i data-lucide="${chapter.isOpen ? 'book-open' : 'book'}" class="w-3 h-3"></i>`;
                        if (chapter.icon) {
                            if (chapter.icon.length > 2) {
                                chapIconHtml = `<i data-lucide="${chapter.icon}" class="w-3 h-3"></i>`;
                            } else {
                                chapIconHtml = `<span class="text-xs">${chapter.icon}</span>`;
                            }
                        }

                        chapHeader.innerHTML = `
                            <div class="flex items-center gap-2 cursor-pointer chapter-toggle" data-form-id="${formation.id}" data-mod-id="${module.id}" data-id="${chapter.id}">
                                ${chapIconHtml} <span style="${chapter.color ? `color: ${chapter.color}` : ''}">${chapter.title}</span>
                            </div>
                            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="chapter" data-form-id="${formation.id}" data-mod-id="${module.id}" data-id="${chapter.id}" title="Personnaliser">
                                    <i data-lucide="palette" class="w-3 h-3"></i>
                                </button>
                                <button class="text-slate-500 hover:text-indigo-400 add-sub-btn" data-type="folder" data-form-id="${formation.id}" data-mod-id="${module.id}" data-chap-id="${chapter.id}" title="Ajouter Sous-chapitre (Dossier)">
                                    <i data-lucide="folder-plus" class="w-3 h-3"></i>
                                </button>
                                <button class="text-slate-500 hover:text-indigo-400 add-sub-btn" data-type="page" data-form-id="${formation.id}" data-mod-id="${module.id}" data-chap-id="${chapter.id}" title="Ajouter Page">
                                    <i data-lucide="file-plus" class="w-3 h-3"></i>
                                </button>
                            </div>
                        `;
                        chapDiv.appendChild(chapHeader);

                        if (chapter.isOpen) {
                            const subList = document.createElement('div');
                            subList.className = 'ml-2 mt-1 space-y-0.5';

                            // Recursive render for sub-chapters
                            renderSubChaptersRecursive(chapter.subChapters, subList, formation.id, module.id, chapter.id);

                            chapDiv.appendChild(subList);
                        }
                        moduleDiv.appendChild(chapDiv);
                    });
                }
                formationDiv.appendChild(moduleDiv);
            });
        }
        sidebarContent.appendChild(formationDiv);
    });
    lucide.createIcons();
    attachSidebarListeners();
}

function renderSubChaptersRecursive(subChapters, container, formId, modId, chapId) {
    subChapters.forEach(sub => {
        const subItemWrapper = document.createElement('div');
        subItemWrapper.className = 'pl-2';

        const subItem = document.createElement('div');
        subItem.className = `flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors group ${activeSubId === sub.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`;

        // Icon based on type (default to folder if undefined for backward compatibility, or check subChapters length)
        const isFolder = sub.type === 'folder' || (sub.subChapters && sub.subChapters.length > 0) || !sub.type;

        let iconName = isFolder ? (sub.isOpen ? 'folder-open' : 'folder') : 'file-text';
        let iconHtml = `<i data-lucide="${iconName}" class="w-3 h-3 ${sub.isCompleted ? 'text-green-400' : 'text-slate-500'}"></i>`;

        if (sub.icon) {
            if (sub.icon.length > 2) {
                iconHtml = `<i data-lucide="${sub.icon}" class="w-3 h-3 ${sub.isCompleted ? 'text-green-400' : 'text-slate-500'}"></i>`;
            } else {
                iconHtml = `<span class="text-xs w-3 text-center inline-block">${sub.icon}</span>`;
            }
        }

        // Content part of the row
        const contentSpan = document.createElement('div');
        contentSpan.className = 'flex items-center gap-2 flex-1';
        contentSpan.innerHTML = `
            ${isFolder ? `<i data-lucide="${sub.isOpen ? 'chevron-down' : 'chevron-right'}" class="w-3 h-3 sub-toggle" data-id="${sub.id}"></i>` : '<div class="w-3"></div>'}
            ${iconHtml}
            <span class="truncate" style="${sub.color ? `color: ${sub.color}` : ''}">${sub.title}</span>
        `;
        contentSpan.onclick = (e) => {
            if (e.target.classList.contains('sub-toggle')) return; // Let the toggle handle it

            activeFormationId = formId;
            activeModuleId = modId;
            activeChapterId = chapId;
            activeSubId = sub.id;

            if (isFolder) {
                toggleOpen('sub', sub.id);
            } else {
                renderSidebar();
            }
            renderContent();
        };

        // Actions part of the row
        const actionsSpan = document.createElement('div');
        actionsSpan.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100';

        actionsSpan.innerHTML = `
            <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="sub" data-id="${sub.id}" title="Personnaliser">
                <i data-lucide="palette" class="w-3 h-3"></i>
            </button>
        `;

        // Only show add buttons if it's a folder
        if (isFolder) {
            actionsSpan.innerHTML += `
                <button class="text-slate-500 hover:text-indigo-400 add-nested-btn" data-type="folder" data-id="${sub.id}" title="Ajouter sous-chapitre imbriqué">
                    <i data-lucide="folder-plus" class="w-3 h-3"></i>
                </button>
                <button class="text-slate-500 hover:text-indigo-400 add-nested-btn" data-type="page" data-id="${sub.id}" title="Ajouter page imbriquée">
                    <i data-lucide="file-plus" class="w-3 h-3"></i>
                </button>
            `;
        }

        subItem.appendChild(contentSpan);
        subItem.appendChild(actionsSpan);
        subItemWrapper.appendChild(subItem);

        // Nested container
        if (sub.isOpen && sub.subChapters && sub.subChapters.length > 0) {
            const nestedContainer = document.createElement('div');
            nestedContainer.className = 'ml-2 border-l border-slate-800 pl-1';
            renderSubChaptersRecursive(sub.subChapters, nestedContainer, formId, modId, chapId);
            subItemWrapper.appendChild(nestedContainer);
        }

        container.appendChild(subItemWrapper);
    });
}

function attachSidebarListeners() {
    // Formation Toggle
    document.querySelectorAll('.formation-toggle').forEach(el => {
        el.onclick = (e) => toggleOpen('formation', e.currentTarget.dataset.id);
    });
    // Module Toggle
    document.querySelectorAll('.module-toggle').forEach(el => {
        el.onclick = (e) => toggleOpen('module', e.currentTarget.dataset.id, e.currentTarget.dataset.formId);
    });
    // Chapter Toggle
    document.querySelectorAll('.chapter-toggle').forEach(el => {
        el.onclick = (e) => toggleOpen('chapter', e.currentTarget.dataset.id, e.currentTarget.dataset.formId, e.currentTarget.dataset.modId);
    });
    // SubChapter Toggle (for nested)
    document.querySelectorAll('.sub-toggle').forEach(el => {
        el.onclick = (e) => {
            e.stopPropagation();
            toggleOpen('sub', e.currentTarget.dataset.id);
        };
    });

    // Add Buttons
    if (addFormationBtn) addFormationBtn.onclick = addFormation;

    document.querySelectorAll('.add-module-btn').forEach(el => {
        el.onclick = (e) => addModule(e.currentTarget.dataset.id);
    });
    document.querySelectorAll('.add-chapter-btn').forEach(el => {
        el.onclick = (e) => addChapter(e.currentTarget.dataset.formId, e.currentTarget.dataset.id);
    });
    document.querySelectorAll('.add-sub-btn').forEach(el => {
        el.onclick = (e) => addSubChapter(e.currentTarget.dataset.formId, e.currentTarget.dataset.modId, e.currentTarget.dataset.chapId, e.currentTarget.dataset.type);
    });
    document.querySelectorAll('.add-nested-btn').forEach(el => {
        el.onclick = (e) => {
            e.stopPropagation();
            addNestedSubChapter(e.currentTarget.dataset.id, e.currentTarget.dataset.type);
        };
    });

    // Customize Buttons
    document.querySelectorAll('.customize-btn').forEach(el => {
        el.onclick = (e) => {
            e.stopPropagation();
            openCustomizationModal(e.currentTarget.dataset);
        };
    });
}

function renderContent() {
    const activeData = findActiveData();

    if (!activeData) return;
    const { path, activeItem } = activeData;

    // Update Breadcrumbs
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    if (breadcrumbsContainer) {
        breadcrumbsContainer.innerHTML = '';
        path.forEach((item, index) => {
            const span = document.createElement('span');
            span.className = index === path.length - 1 ? 'text-white font-medium' : 'hover:text-slate-300 cursor-pointer';
            span.textContent = item.title;
            // Optional: Add click handler to navigate back
            breadcrumbsContainer.appendChild(span);

            if (index < path.length - 1) {
                const separator = document.createElement('i');
                separator.setAttribute('data-lucide', 'chevron-right');
                separator.className = 'w-3.5 h-3.5 text-slate-600';
                breadcrumbsContainer.appendChild(separator);
            }
        });
        lucide.createIcons();
    }

    // Check if active item is a folder
    const isFolder = activeItem.type === 'folder' || (!activeItem.type && activeItem.subChapters); // Legacy check for chapters/modules acting as folders

    if (isFolder) {
        // Folder View
        learnView.classList.add('hidden');
        flashcardsView.classList.add('hidden');
        addBlockControls.classList.add('hidden');

        // Show a "Folder Empty State" or list of children
        // For now, just clear the view or show a message
        learnView.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                <i data-lucide="folder-open" class="w-16 h-16 mb-4 opacity-20"></i>
                <p>Sélectionnez une page pour voir le contenu.</p>
            </div>
        `;
        learnView.classList.remove('hidden'); // Show the message
        lucide.createIcons();

        // Hide Edit Mode toggle for folders as they don't have content to edit
        toggleEditModeBtn.classList.add('hidden');
        return;
    }

    // Page View
    toggleEditModeBtn.classList.remove('hidden');

    // Update Tabs UI
    if (activeTab === 'learn') {
        tabLearn.className = 'px-3 py-1 rounded text-xs font-medium transition-all bg-indigo-600 text-white';
        tabFlashcards.className = 'px-3 py-1 rounded text-xs font-medium transition-all text-slate-400';
        learnView.classList.remove('hidden');
        flashcardsView.classList.add('hidden');
        if (editMode) addBlockControls.classList.remove('hidden');
        else addBlockControls.classList.add('hidden');
        renderBlocks(activeItem.blocks || []);
    } else {
        tabLearn.className = 'px-3 py-1 rounded text-xs font-medium transition-all text-slate-400';
        tabFlashcards.className = 'px-3 py-1 rounded text-xs font-medium transition-all bg-indigo-600 text-white';
        learnView.classList.add('hidden');
        flashcardsView.classList.remove('hidden');
        addBlockControls.classList.add('hidden');
        renderFlashcards(activeItem.flashcards || []);
    }

    // Update Edit Mode Button State
    const importBtn = document.getElementById('import-btn');
    if (editMode) {
        toggleEditModeBtn.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-indigo-500/20 border-indigo-500 text-indigo-400';
        editModeText.textContent = 'Édition';
        if (importBtn) importBtn.classList.remove('hidden');
    } else {
        toggleEditModeBtn.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium transition-colors';
        editModeText.textContent = 'Lecture';
        if (importBtn) importBtn.classList.add('hidden');
    }
}

function renderBlocks(blocks) {
    learnView.innerHTML = '';
    blocks.forEach(block => {
        const blockWrapper = document.createElement('div');
        blockWrapper.className = 'group relative';

        // Delete Button (Edit Mode)
        if (editMode) {
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'absolute -left-10 top-0 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity';
            deleteBtn.innerHTML = `<button class="p-1.5 bg-slate-800 text-red-500 hover:bg-red-900/50 rounded border border-slate-700"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>`;
            deleteBtn.onclick = () => deleteBlock(block.id);
            blockWrapper.appendChild(deleteBtn);
        }

        // Content
        let contentDiv;
        switch (block.type) {
            case 'text': contentDiv = renderTextBlock(block); break;
            case 'code': contentDiv = renderCodeBlock(block); break;
            case 'video': contentDiv = renderVideoBlock(block); break;
            case 'image': contentDiv = renderImageBlock(block); break;
            case 'quiz': contentDiv = renderQuizBlock(block); break;
            default: contentDiv = document.createElement('div');
        }
        blockWrapper.appendChild(contentDiv);
        learnView.appendChild(blockWrapper);
    });
    lucide.createIcons();
}

// --- Block Renderers ---

function renderTextBlock(block) {
    const div = document.createElement('div');
    if (editMode) {
        div.className = 'p-2 border border-dashed border-slate-700 rounded bg-slate-800/20';
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full bg-transparent text-slate-300 p-2 outline-none h-auto min-h-[100px]';
        textarea.value = block.content;
        textarea.oninput = (e) => updateBlock(block.id, e.target.value);
        div.appendChild(textarea);
    } else {
        div.className = 'prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap';
        div.textContent = block.content;
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
            </div>
            <div class="space-y-4" id="quiz-editor-${block.id}"></div>
            <button class="add-q-btn w-full py-2 bg-slate-700 rounded text-xs text-slate-300 hover:text-white">+ Ajouter une question</button>
        `;
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

// --- Logic Helpers ---

// Helper to find data recursively
function findSubChapterRecursive(subChapters, targetId) {
    for (const sub of subChapters) {
        if (sub.id === targetId) return sub;
        if (sub.subChapters && sub.subChapters.length > 0) {
            const found = findSubChapterRecursive(sub.subChapters, targetId);
            if (found) return found;
        }
    }
    return null;
}

function findActiveData() {
    const formation = formations.find(f => f.id === activeFormationId);
    if (!formation) return null;

    const path = [formation];
    let activeItem = formation;

    const module = formation.modules.find(m => m.id === activeModuleId);
    if (module) {
        path.push(module);
        activeItem = module;

        const chapter = module.chapters.find(c => c.id === activeChapterId);
        if (chapter) {
            path.push(chapter);
            activeItem = chapter;

            // Recursive search for sub-chapter
            if (activeSubId) {
                // Helper to find sub and build path
                function findSubAndPath(subs, targetId, currentPath) {
                    for (const sub of subs) {
                        if (sub.id === targetId) {
                            return { found: sub, path: [...currentPath, sub] };
                        }
                        if (sub.subChapters && sub.subChapters.length > 0) {
                            const result = findSubAndPath(sub.subChapters, targetId, [...currentPath, sub]);
                            if (result) return result;
                        }
                    }
                    return null;
                }

                const result = findSubAndPath(chapter.subChapters, activeSubId, []);
                if (result) {
                    path.push(...result.path);
                    activeItem = result.found;
                }
            }
        }
    }

    return { formation, module, chapter: path.find(p => p.chapters), sub: activeItem, activeItem, path };
}

function toggleOpen(type, id, formId, modId) {
    if (type === 'formation') {
        formations = formations.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f);
    } else if (type === 'module') {
        formations = formations.map(f => {
            if (f.id !== formId) return f;
            return {
                ...f,
                modules: f.modules.map(m => m.id === id ? { ...m, isOpen: !m.isOpen } : m)
            };
        });
    } else if (type === 'chapter') {
        formations = formations.map(f => {
            if (f.id !== formId) return f;
            return {
                ...f,
                modules: f.modules.map(m => {
                    if (m.id !== modId) return m;
                    return {
                        ...m,
                        chapters: m.chapters.map(c => c.id === id ? { ...c, isOpen: !c.isOpen } : c)
                    };
                })
            };
        });
    } else if (type === 'sub') {
        // Recursive toggle
        function toggleSubRecursive(subs) {
            return subs.map(s => {
                if (s.id === id) return { ...s, isOpen: !s.isOpen };
                if (s.subChapters) return { ...s, subChapters: toggleSubRecursive(s.subChapters) };
                return s;
            });
        }

        formations = formations.map(f => ({
            ...f,
            modules: f.modules.map(m => ({
                ...m,
                chapters: m.chapters.map(c => ({
                    ...c,
                    subChapters: toggleSubRecursive(c.subChapters)
                }))
            }))
        }));
    }
    renderSidebar();
}

function addFormation() {
    const title = prompt("Nom de la nouvelle formation ?");
    if (!title) return;
    const newForm = { id: generateId(), title, isOpen: true, modules: [] };
    formations.push(newForm);
    activeFormationId = newForm.id;
    renderSidebar();
}

function addModule(formId) {
    const title = prompt("Nom du nouveau module ?");
    if (!title) return;
    formations = formations.map(f => {
        if (f.id !== formId) return f;
        return {
            ...f,
            modules: [...f.modules, { id: generateId(), title, icon: 'folder', isOpen: true, chapters: [] }]
        };
    });
    renderSidebar();
}

function addChapter(formId, modId) {
    const title = prompt("Nom du nouveau chapitre ?");
    if (!title) return;
    formations = formations.map(f => {
        if (f.id !== formId) return f;
        return {
            ...f,
            modules: f.modules.map(m => {
                if (m.id !== modId) return m;
                return {
                    ...m,
                    chapters: [...m.chapters, { id: generateId(), title, isOpen: true, subChapters: [] }]
                };
            })
        };
    });
    renderSidebar();
}

function addSubChapter(formId, modId, chapId, type) {
    const title = prompt(type === 'folder' ? "Nom du sous-chapitre (dossier) ?" : "Nom de la page ?");
    if (!title) return;
    const newSubId = generateId();
    formations = formations.map(f => {
        if (f.id !== formId) return f;
        return {
            ...f,
            modules: f.modules.map(m => {
                if (m.id !== modId) return m;
                return {
                    ...m,
                    chapters: m.chapters.map(c => {
                        if (c.id !== chapId) return c;
                        return {
                            ...c,
                            subChapters: [...c.subChapters, {
                                id: newSubId,
                                title,
                                type: type, // 'folder' or 'page'
                                isCompleted: false,
                                isOpen: true,
                                subChapters: [],
                                blocks: [],
                                flashcards: []
                            }]
                        };
                    })
                };
            })
        };
    });
    activeSubId = newSubId;
    renderSidebar();
    renderContent();
}

function addNestedSubChapter(parentId, type) {
    const title = prompt(type === 'folder' ? "Nom du sous-chapitre imbriqué (dossier) ?" : "Nom de la page imbriquée ?");
    if (!title) return;
    const newSubId = generateId();

    function addRecursive(subs) {
        return subs.map(s => {
            if (s.id === parentId) {
                return {
                    ...s,
                    isOpen: true,
                    subChapters: [...(s.subChapters || []), {
                        id: newSubId,
                        title,
                        type: type, // 'folder' or 'page'
                        isCompleted: false,
                        isOpen: true,
                        subChapters: [],
                        blocks: [],
                        flashcards: []
                    }]
                };
            }
            if (s.subChapters) return { ...s, subChapters: addRecursive(s.subChapters) };
            return s;
        });
    }

    formations = formations.map(f => ({
        ...f,
        modules: f.modules.map(m => ({
            ...m,
            chapters: m.chapters.map(c => ({
                ...c,
                subChapters: addRecursive(c.subChapters)
            }))
        }))
    }));

    activeSubId = newSubId;
    renderSidebar();
    renderContent();
}

function updateBlock(blockId, newContent) {
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.blocks = activeData.sub.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
}

function updateFlashcards(newCards) {
    const activeData = findActiveData();
    if (!activeData) return;
    activeData.sub.flashcards = newCards;
}

function addBlock(type, content) {
    const activeData = findActiveData();
    if (!activeData) return;

    const defaultContent = type === 'text' ? "Nouveau texte..."
        : type === 'code' ? "print('Code')"
            : type === 'quiz' ? { questions: [{ question: "Question?", options: ["A", "B"], correct: 0 }] }
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

// --- Event Listeners ---

function setupEventListeners() {
    // Note: addModuleBtn is now addFormationBtn in the new UI plan, but we'll keep addModuleBtn logic if element exists or add new listener
    if (addFormationBtn) addFormationBtn.onclick = addFormation;

    tabLearn.onclick = () => {
        activeTab = 'learn';
        renderContent();
    };

    tabFlashcards.onclick = () => {
        activeTab = 'flashcards';
        renderContent();
    };

    toggleEditModeBtn.onclick = () => {
        editMode = !editMode;
        renderContent();
    };

    // Add Block Buttons
    document.querySelectorAll('.add-block-btn').forEach(btn => {
        btn.onclick = () => addBlock(btn.dataset.type);
    });

    // Drag & Drop
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    mainContainer.ondragenter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (editMode) {
            dragActive = true;
            dragOverlay.classList.remove('hidden');
            dragOverlay.classList.remove('pointer-events-none');
        }
    };

    dragOverlay.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;
        dragOverlay.classList.add('hidden');
        dragOverlay.classList.add('pointer-events-none');
    };

    dragOverlay.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    dragOverlay.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;
        dragOverlay.classList.add('hidden');
        dragOverlay.classList.add('pointer-events-none');

        if (!editMode) {
            alert("Activez le mode édition pour importer des fichiers.");
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    // File Input & Import Button
    const fileInput = document.getElementById('file-input');
    const importBtn = document.getElementById('import-btn');

    if (importBtn) {
        importBtn.onclick = () => fileInput.click();
    }

    if (fileInput) {
        fileInput.onchange = (e) => {
            if (fileInput.files && fileInput.files.length > 0) {
                handleFiles(Array.from(fileInput.files));
                fileInput.value = ''; // Reset
            }
        };
    }

    // Paste Support
    document.addEventListener('paste', (e) => {
        if (!editMode) return;

        // Handle Files (Images, etc.)
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            handleFiles(Array.from(e.clipboardData.files));
        }
        // Handle Text/Code if not pasting into an input/textarea
        else if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            const text = e.clipboardData.getData('text');
            if (text) {
                e.preventDefault();
                // Simple heuristic: if it looks like code or is long, make a code block, else text
                if (text.includes('def ') || text.includes('function') || text.includes('import ') || text.includes('console.log') || text.includes('{')) {
                    addBlock('code', text);
                } else {
                    addBlock('text', text);
                }
            }
        }
    });
}

function handleFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            addBlock('image', { src: url, caption: file.name });
        } else if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            addBlock('video', { title: file.name, src: url });
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                addBlock('code', ev.target.result);
            };
            reader.readAsText(file);
        }
    });
}

// --- Customization Functions ---

function openCustomizationModal(dataset) {
    customizationTarget = { ...dataset };
    customModal.classList.remove('hidden');

    // Find current data to populate modal
    let currentIcon = '';
    let currentColor = '';

    // Helper to find item by ID
    const findItem = () => {
        if (dataset.type === 'formation') return formations.find(f => f.id === dataset.id);
        const form = formations.find(f => f.id === dataset.formId);
        if (dataset.type === 'module') return form?.modules.find(m => m.id === dataset.id);
        const mod = form?.modules.find(m => m.id === dataset.modId);
        if (dataset.type === 'chapter') return mod?.chapters.find(c => c.id === dataset.id);
        const chap = mod?.chapters.find(c => c.id === dataset.chapId || c.id === dataset.modId); // Fallback logic might be needed
        // For sub-chapters, we need recursive search or pass full path. 
        // Simplified: we rely on the fact that we have the object in memory if we just rendered it, 
        // but for robustness let's use a recursive finder or just default to empty.
        // Actually, let's use a robust finder.
        if (dataset.type === 'sub') {
            // We need to find the sub-chapter. Since we don't have full path in dataset for sub (only id), 
            // we iterate all formations to find it.
            for (const f of formations) {
                for (const m of f.modules) {
                    for (const c of m.chapters) {
                        const sub = findSubChapterRecursive(c.subChapters, dataset.id);
                        if (sub) return sub;
                    }
                }
            }
        }
        return null;
    };

    const item = findItem();
    if (item) {
        currentIcon = item.icon || '';
        currentColor = item.color || '';
    }

    // Set Color
    colorPicker.value = currentColor || '#000000';
    colorValue.textContent = currentColor || 'Défaut';

    // Set Icon Tab
    // Simple heuristic: if it's a known lucide icon, show lucide tab, else emoji
    // For now default to Lucide tab
    iconTabs[0].click();
    emojiInput.value = currentIcon.length <= 2 ? currentIcon : '';
}

function saveCustomization() {
    if (!customizationTarget) return;

    const { type, id, formId, modId, chapId } = customizationTarget;
    const newColor = colorValue.textContent === 'Défaut' ? undefined : colorPicker.value;

    // Determine selected icon
    let newIcon = undefined;
    const activeTab = document.querySelector('.icon-tab.active');
    if (activeTab.dataset.tab === 'lucide') {
        const selected = lucidePicker.querySelector('.selected');
        if (selected) newIcon = selected.dataset.icon;
    } else {
        if (emojiInput.value) newIcon = emojiInput.value;
    }

    // Update Data
    if (type === 'formation') {
        formations = formations.map(f => f.id === id ? { ...f, color: newColor, icon: newIcon } : f);
    } else if (type === 'module') {
        formations = formations.map(f => {
            if (f.id !== formId) return f;
            return {
                ...f,
                modules: f.modules.map(m => m.id === id ? { ...m, color: newColor, icon: newIcon } : m)
            };
        });
    } else if (type === 'chapter') {
        formations = formations.map(f => {
            if (f.id !== formId) return f;
            return {
                ...f,
                modules: f.modules.map(m => {
                    if (m.id !== modId) return m;
                    return {
                        ...m,
                        chapters: m.chapters.map(c => c.id === id ? { ...c, color: newColor, icon: newIcon } : c)
                    };
                })
            };
        });
    } else if (type === 'sub') {
        function updateSubRecursive(subs) {
            return subs.map(s => {
                if (s.id === id) return { ...s, color: newColor, icon: newIcon };
                if (s.subChapters) return { ...s, subChapters: updateSubRecursive(s.subChapters) };
                return s;
            });
        }
        formations = formations.map(f => ({
            ...f,
            modules: f.modules.map(m => ({
                ...m,
                chapters: m.chapters.map(c => ({
                    ...c,
                    subChapters: updateSubRecursive(c.subChapters)
                }))
            }))
        }));
    }

    customModal.classList.add('hidden');
    renderSidebar();
}

function setupCustomizationListeners() {
    closeCustomModalBtn.onclick = () => customModal.classList.add('hidden');
    saveCustomBtn.onclick = saveCustomization;

    iconTabs.forEach(tab => {
        tab.onclick = () => {
            iconTabs.forEach(t => {
                t.classList.remove('active', 'bg-indigo-600', 'text-white');
                t.classList.add('text-slate-400', 'hover:text-white');
            });
            tab.classList.add('active', 'bg-indigo-600', 'text-white');
            tab.classList.remove('text-slate-400', 'hover:text-white');

            if (tab.dataset.tab === 'lucide') {
                lucidePicker.classList.remove('hidden');
                emojiPicker.classList.add('hidden');
            } else {
                lucidePicker.classList.add('hidden');
                emojiPicker.classList.remove('hidden');
            }
        };
    });

    colorPicker.oninput = (e) => {
        colorValue.textContent = e.target.value;
    };

    resetColorBtn.onclick = () => {
        colorPicker.value = '#000000';
        colorValue.textContent = 'Défaut';
    };
}

function populateLucidePicker() {
    const icons = ['folder', 'file', 'book', 'star', 'heart', 'settings', 'user', 'code', 'database', 'cloud', 'sun', 'moon', 'zap', 'activity', 'box', 'briefcase', 'calendar', 'camera', 'check', 'circle', 'clipboard', 'clock', 'compass', 'cpu', 'credit-card', 'disc', 'dollar-sign', 'download', 'droplet', 'edit', 'eye', 'file-text', 'film', 'filter', 'flag', 'folder-plus', 'gift', 'globe', 'grid', 'hash', 'headphones', 'home', 'image', 'inbox', 'info', 'key', 'layers', 'layout', 'life-buoy', 'link', 'list', 'lock', 'mail', 'map', 'map-pin', 'menu', 'message-circle', 'mic', 'monitor', 'moon', 'music', 'navigation', 'package', 'paperclip', 'pause', 'phone', 'pie-chart', 'play', 'plus', 'power', 'printer', 'radio', 'refresh-cw', 'save', 'scissors', 'search', 'server', 'settings', 'share', 'shield', 'shopping-bag', 'shopping-cart', 'shuffle', 'sidebar', 'smartphone', 'smile', 'speaker', 'square', 'star', 'stop-circle', 'sun', 'sunrise', 'sunset', 'tablet', 'tag', 'target', 'terminal', 'thermometer', 'thumbs-down', 'thumbs-up', 'toggle-left', 'toggle-right', 'tool', 'trash', 'trash-2', 'trello', 'trending-down', 'trending-up', 'triangle', 'truck', 'tv', 'twitter', 'type', 'umbrella', 'underline', 'unlock', 'upload', 'user', 'user-check', 'user-minus', 'user-plus', 'user-x', 'users', 'video', 'voicemail', 'volume', 'volume-1', 'volume-2', 'volume-x', 'watch', 'wifi', 'wifi-off', 'wind', 'x', 'x-circle', 'x-octagon', 'x-square', 'youtube', 'zap', 'zap-off', 'zoom-in', 'zoom-out'];

    lucidePicker.innerHTML = '';
    icons.forEach(iconName => {
        const div = document.createElement('div');
        div.className = 'p-2 rounded hover:bg-slate-700 cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-500';
        div.dataset.icon = iconName;
        div.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 text-slate-300"></i>`;
        div.onclick = () => {
            lucidePicker.querySelectorAll('div').forEach(d => d.classList.remove('selected', 'bg-indigo-600'));
            div.classList.add('selected', 'bg-indigo-600');
        };
        lucidePicker.appendChild(div);
    });
    lucide.createIcons();
}

// Run
init();
