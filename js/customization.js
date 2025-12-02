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
