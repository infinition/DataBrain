// --- Content Rendering ---

function renderContent() {
    const activeData = findActiveData();

    if (!activeData) return;
    const { path, activeItem } = activeData;

    // Update Header Title (formerly Breadcrumbs)
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    if (breadcrumbsContainer) {
        breadcrumbsContainer.innerHTML = '';
        breadcrumbsContainer.classList.remove('overflow-x-auto', 'no-scrollbar');
        breadcrumbsContainer.classList.add('overflow-hidden');

        const title = activeItem.title;
        const titleEl = document.createElement('h1');
        titleEl.textContent = title;
        titleEl.className = 'font-bold text-white whitespace-nowrap truncate transition-all duration-300';

        // Calculate Available Width
        const header = document.querySelector('header');
        const buttons = document.getElementById('toggle-edit-mode').parentElement;
        const mobileToggle = document.getElementById('mobile-sidebar-toggle');

        // Get widths
        const headerWidth = header.clientWidth;
        const buttonsWidth = buttons.offsetWidth;
        const toggleWidth = (mobileToggle && getComputedStyle(mobileToggle).display !== 'none') ? mobileToggle.offsetWidth : 0;

        // Padding and Gaps (approx 80px safety margin)
        const availableWidth = headerWidth - buttonsWidth - toggleWidth - 80;
        const textLength = title.length;

        // Heuristic sizing (Avg char width ~11px for lg, ~10px for base, ~8.5px for sm, ~7px for xs)
        if (textLength * 11 > availableWidth) {
            if (textLength * 10 > availableWidth) {
                if (textLength * 8.5 > availableWidth) {
                    titleEl.classList.add('text-xs');
                } else {
                    titleEl.classList.add('text-sm');
                }
            } else {
                titleEl.classList.add('text-base');
            }
        } else {
            titleEl.classList.add('text-lg');
        }

        breadcrumbsContainer.appendChild(titleEl);
    }

    // Check if active item is a folder
    const isFolder = activeItem.type === 'folder' || (!activeItem.type && activeItem.subChapters); // Legacy check for chapters/modules acting as folders

    if (isFolder) {
        // Folder View
        learnView.classList.add('hidden');
        // flashcardsView.classList.add('hidden'); // Removed as flashcardsView is no longer used


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

    // Always render learnView
    learnView.classList.remove('hidden');

    renderBlocks(activeItem.blocks || []);

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
