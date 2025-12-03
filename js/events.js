// --- Event Listeners ---

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

function setupEventListeners() {
    // Mobile Sidebar Toggle
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (mobileToggle) {
        mobileToggle.onclick = () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        };
    }

    if (overlay) {
        overlay.onclick = () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        };
    }

    // Note: addModuleBtn is now addFormationBtn in the new UI plan, but we'll keep addModuleBtn logic if element exists or add new listener
    if (addFormationBtn) addFormationBtn.onclick = addFormation;

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

        const isFile = e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');

        if (editMode && isFile) {
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

                // Try to parse as JSON first
                try {
                    const json = JSON.parse(text);
                    if (Array.isArray(json)) {
                        if (json.length > 0 && json[0].question && json[0].options) {
                            // Quiz
                            const questions = json.map(q => ({
                                question: q.question,
                                options: q.options.map(o => o.text),
                                correct: Math.max(0, q.options.findIndex(o => o.correct))
                            }));
                            addBlock('quiz', { questions });
                            return;
                        } else if (json.length > 0 && json[0].question && json[0].answer) {
                            // Flashcard
                            addBlock('flashcard', json);
                            return;
                        }
                    }
                } catch (e) {
                    // Not JSON, continue
                }

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
        } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const json = JSON.parse(ev.target.result);
                    // Detect type
                    if (Array.isArray(json)) {
                        if (json.length > 0 && json[0].question && json[0].options) {
                            // Quiz
                            const questions = json.map(q => ({
                                question: q.question,
                                options: q.options.map(o => o.text),
                                correct: Math.max(0, q.options.findIndex(o => o.correct))
                            }));
                            addBlock('quiz', { questions });
                        } else if (json.length > 0 && json[0].question && json[0].answer) {
                            // Flashcard
                            addBlock('flashcard', json);
                        } else {
                            // Fallback to code
                            addBlock('code', ev.target.result);
                        }
                    } else {
                        addBlock('code', ev.target.result);
                    }
                } catch (e) {
                    addBlock('code', ev.target.result);
                }
            };
            reader.readAsText(file);
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                addBlock('code', ev.target.result);
            };
            reader.readAsText(file);
        }
    });
}
