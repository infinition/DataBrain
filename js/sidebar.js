// --- Rendering ---

function renderSidebar() {
    sidebarContent.innerHTML = '';

    // Mobile-only Add Formation Button (at the top)
    const mobileAddBtn = document.createElement('button');
    mobileAddBtn.className = 'md:hidden w-full mb-4 flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-xs font-medium';
    mobileAddBtn.innerHTML = `<i data-lucide="plus" class="w-4 h-4"></i> Ajouter une formation`;
    mobileAddBtn.onclick = addFormation;
    sidebarContent.appendChild(mobileAddBtn);

    formations.forEach(formation => {
        const formationDiv = document.createElement('div');
        formationDiv.className = 'mb-6 border-b border-slate-800 pb-4';

        // Drag Attributes
        formationDiv.setAttribute('draggable', 'true');
        formationDiv.dataset.id = formation.id;
        formationDiv.dataset.type = 'formation';

        // Formation Header
        const formHeader = document.createElement('div');
        formHeader.className = 'flex items-center justify-between px-2 py-1 text-indigo-400 hover:text-indigo-300 group mb-2';

        // Icon Logic
        let iconHtml = `<i data-lucide="${formation.isOpen ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4 flex-shrink-0"></i>`;
        if (formation.icon) {
            if (formation.icon.length > 2) { // Lucide icon name
                iconHtml += `<i data-lucide="${formation.icon}" class="w-4 h-4 ml-2"></i>`;
            } else { // Emoji
                iconHtml += `<span class="ml-2 text-sm">${formation.icon}</span>`;
            }
        }

        formHeader.innerHTML = `
            <div class="flex items-center gap-2 cursor-pointer formation-toggle flex-1 min-w-0" data-id="${formation.id}">
                ${iconHtml}
                <span class="text-sm font-bold uppercase tracking-wider break-words" style="${formation.color ? `color: ${formation.color}` : ''}">${formation.title}</span>
            </div>
            <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 ml-2">
                <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="formation" data-id="${formation.id}" title="Personnaliser">
                    <i data-lucide="palette" class="w-4 h-4"></i>
                </button>
                <button class="text-slate-500 hover:text-green-400 add-module-btn" data-id="${formation.id}" title="Ajouter Module">
                    <i data-lucide="folder-plus" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        formationDiv.appendChild(formHeader);

        if (formation.isOpen) {
            formation.modules.forEach(module => {
                const moduleDiv = document.createElement('div');
                moduleDiv.className = 'mb-2 ml-2';

                // Drag Attributes
                moduleDiv.setAttribute('draggable', 'true');
                moduleDiv.dataset.id = module.id;
                moduleDiv.dataset.type = 'module';

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
                    <div class="flex items-center gap-2 cursor-pointer module-toggle flex-1 min-w-0" data-form-id="${formation.id}" data-id="${module.id}">
                        ${iconHtml}
                        <span class="text-xs font-semibold break-words" style="${module.color ? `color: ${module.color}` : ''}">${module.title}</span>
                    </div>
                    <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 ml-2">
                        <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="module" data-form-id="${formation.id}" data-id="${module.id}" title="Personnaliser">
                            <i data-lucide="palette" class="w-4 h-4"></i>
                        </button>
                        <button class="text-slate-500 hover:text-green-400 add-chapter-btn" data-form-id="${formation.id}" data-id="${module.id}" title="Ajouter Chapitre">
                            <i data-lucide="folder-plus" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
                moduleDiv.appendChild(modHeader);

                if (module.isOpen) {
                    module.chapters.forEach(chapter => {
                        const chapDiv = document.createElement('div');
                        chapDiv.className = 'ml-4 border-l border-slate-800 pl-2 mt-1';

                        // Drag Attributes
                        chapDiv.setAttribute('draggable', 'true');
                        chapDiv.dataset.id = chapter.id;
                        chapDiv.dataset.type = 'chapter';

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
                            <div class="flex items-center gap-2 cursor-pointer chapter-toggle flex-1 min-w-0" data-form-id="${formation.id}" data-mod-id="${module.id}" data-id="${chapter.id}">
                                ${chapIconHtml} <span class="break-words" style="${chapter.color ? `color: ${chapter.color}` : ''}">${chapter.title}</span>
                            </div>
                            <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 ml-2">
                                <button class="text-slate-500 hover:text-pink-400 customize-btn" data-type="chapter" data-form-id="${formation.id}" data-mod-id="${module.id}" data-id="${chapter.id}" title="Personnaliser">
                                    <i data-lucide="palette" class="w-4 h-4"></i>
                                </button>
                                <button class="text-slate-500 hover:text-indigo-400 add-sub-btn" data-type="folder" data-form-id="${formation.id}" data-mod-id="${module.id}" data-chap-id="${chapter.id}" title="Ajouter Sous-chapitre (Dossier)">
                                    <i data-lucide="folder-plus" class="w-4 h-4"></i>
                                </button>
                                <button class="text-slate-500 hover:text-indigo-400 add-sub-btn" data-type="page" data-form-id="${formation.id}" data-mod-id="${module.id}" data-chap-id="${chapter.id}" title="Ajouter Page">
                                    <i data-lucide="file-plus" class="w-4 h-4"></i>
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
    attachDragListeners(); // New drag listeners
}

function renderSubChaptersRecursive(subChapters, container, formId, modId, chapId) {
    subChapters.forEach(sub => {
        const subItemWrapper = document.createElement('div');
        subItemWrapper.className = 'pl-2';

        // Drag Attributes
        subItemWrapper.setAttribute('draggable', 'true');
        subItemWrapper.dataset.id = sub.id;
        subItemWrapper.dataset.type = 'sub';

        const isActive = activeSubId === sub.id;
        const subItem = document.createElement('div');
        subItem.className = `flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors group ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`;

        // Icon based on type (default to folder if undefined for backward compatibility, or check subChapters length)
        const isFolder = sub.type === 'folder' || (sub.subChapters && sub.subChapters.length > 0) || !sub.type;

        let iconName = isFolder ? (sub.isOpen ? 'folder-open' : 'folder') : 'file-text';

        let iconColorClass = 'text-slate-500';
        if (isActive) {
            iconColorClass = 'text-white';
        } else if (sub.isCompleted) {
            iconColorClass = 'text-green-400';
        }

        let iconHtml = `<i data-lucide="${iconName}" class="w-3 h-3 ${iconColorClass}"></i>`;

        if (sub.icon) {
            if (sub.icon.length > 2) {
                iconHtml = `<i data-lucide="${sub.icon}" class="w-3 h-3 ${iconColorClass}"></i>`;
            } else {
                iconHtml = `<span class="text-xs w-3 text-center inline-block">${sub.icon}</span>`;
            }
        }

        // Content part of the row
        const contentSpan = document.createElement('div');
        contentSpan.className = 'flex items-center gap-2 flex-1';
        contentSpan.innerHTML = `
            ${isFolder ? `<i data-lucide="${sub.isOpen ? 'chevron-down' : 'chevron-right'}" class="w-3 h-3 sub-toggle flex-shrink-0" data-id="${sub.id}"></i>` : '<div class="w-3 flex-shrink-0"></div>'}
            ${iconHtml}
            <span class="break-words" style="${sub.color ? `color: ${sub.color}` : ''}">${sub.title}</span>
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
        actionsSpan.className = 'flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 ml-2';


        const btnBaseClass = isActive ? 'text-indigo-200' : 'text-slate-500';
        const btnHoverPalette = isActive ? 'hover:text-white' : 'hover:text-pink-400';
        const btnHoverAdd = isActive ? 'hover:text-white' : 'hover:text-indigo-400';

        actionsSpan.innerHTML = `
            <button class="${btnBaseClass} ${btnHoverPalette} customize-btn" data-type="sub" data-id="${sub.id}" title="Personnaliser">
                <i data-lucide="palette" class="w-4 h-4"></i>
            </button>
        `;

        // Only show add buttons if it's a folder
        if (isFolder) {
            actionsSpan.innerHTML += `
                <button class="${btnBaseClass} ${btnHoverAdd} add-nested-btn" data-type="folder" data-id="${sub.id}" title="Ajouter sous-chapitre imbriqué">
                    <i data-lucide="folder-plus" class="w-4 h-4"></i>
                </button>
                <button class="${btnBaseClass} ${btnHoverAdd} add-nested-btn" data-type="page" data-id="${sub.id}" title="Ajouter page imbriquée">
                    <i data-lucide="file-plus" class="w-4 h-4"></i>
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

// --- Drag & Drop Logic ---

function attachDragListeners() {
    const draggables = document.querySelectorAll('#sidebar [draggable="true"]');

    draggables.forEach(el => {
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('dragleave', handleDragLeave);
        el.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({
        id: e.currentTarget.dataset.id,
        type: e.currentTarget.dataset.type
    }));
    e.currentTarget.classList.add('opacity-50');
}

function handleDragEnd(e) {
    e.stopPropagation();
    e.currentTarget.classList.remove('opacity-50');
    document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-inside').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-inside');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Reset classes
    target.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-inside');

    // Determine drop zone
    // Top 25% -> Before
    // Bottom 25% -> After
    // Middle 50% -> Inside (if valid container)

    if (y < height * 0.25) {
        target.classList.add('drag-over-top');
    } else if (y > height * 0.75) {
        target.classList.add('drag-over-bottom');
    } else {
        target.classList.add('drag-over-inside');
    }
}

function handleDragLeave(e) {
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-inside');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-inside');

    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const draggedId = data.id;
    const targetId = target.dataset.id;

    if (draggedId === targetId) return;

    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position;
    if (y < height * 0.25) position = 'before';
    else if (y > height * 0.75) position = 'after';
    else position = 'inside';

    moveSidebarItem(draggedId, targetId, position);
}

function moveSidebarItem(draggedId, targetId, position) {
    // 1. Find and remove dragged item
    const { item, parentArray: sourceArray } = findItemAndParent(draggedId, formations);
    if (!item) return;

    // Remove from source
    const sourceIndex = sourceArray.indexOf(item);
    sourceArray.splice(sourceIndex, 1);

    // 2. Find target location
    // We need to find the array containing the targetId, OR the item itself if dropping inside

    if (position === 'inside') {
        const { item: targetItem } = findItemAndParent(targetId, formations);
        if (targetItem) {
            // Determine where to put it
            // Formations -> Modules
            // Modules -> Chapters
            // Chapters -> SubChapters
            // SubChapters -> SubChapters

            let targetList;
            if (targetItem.modules) targetList = targetItem.modules;
            else if (targetItem.chapters) targetList = targetItem.chapters;
            else if (targetItem.subChapters) targetList = targetItem.subChapters;

            if (targetList) {
                targetList.push(item);
                // Auto-open target
                targetItem.isOpen = true;
            } else {
                // Fallback: insert after if cannot go inside
                const { parentArray: targetArray } = findItemAndParent(targetId, formations);
                const targetIndex = targetArray.findIndex(i => i.id === targetId);
                targetArray.splice(targetIndex + 1, 0, item);
            }
        }
    } else {
        // Before or After
        const { parentArray: targetArray } = findItemAndParent(targetId, formations);
        if (targetArray) {
            const targetIndex = targetArray.findIndex(i => i.id === targetId);
            const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
            targetArray.splice(insertIndex, 0, item);
        } else {
            // Should not happen if targetId exists
            // Put it back?
            sourceArray.splice(sourceIndex, 0, item);
        }
    }

    renderSidebar();
}

function findItemAndParent(id, list) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            return { item: list[i], parentArray: list };
        }

        if (list[i].modules) {
            const result = findItemAndParent(id, list[i].modules);
            if (result) return result;
        }
        if (list[i].chapters) {
            const result = findItemAndParent(id, list[i].chapters);
            if (result) return result;
        }
        if (list[i].subChapters) {
            const result = findItemAndParent(id, list[i].subChapters);
            if (result) return result;
        }
    }
    return null;
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
