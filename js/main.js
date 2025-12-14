// --- Initialization ---
async function init() {
    // 1. Load Data from Persistence
    const loadedData = await Persistence.loadData();
    if (loadedData) {
        formations = loadedData;
        // Reset active state if needed, or validate IDs
        // For now, we assume the structure is valid
        if (formations.length > 0) {
            activeFormationId = formations[0].id;
            if (formations[0].modules.length > 0) {
                activeModuleId = formations[0].modules[0].id;
                if (formations[0].modules[0].chapters.length > 0) {
                    activeChapterId = formations[0].modules[0].chapters[0].id;
                    if (formations[0].modules[0].chapters[0].subChapters.length > 0) {
                        activeSubId = formations[0].modules[0].chapters[0].subChapters[0].id;
                    }
                }
            }
        }
    }

    // 2. Render UI
    renderSidebar();
    renderContent();
    setupEventListeners();
    setupCustomizationListeners();
    populateLucidePicker();
    lucide.createIcons();

    // 3. Setup Persistence & Settings
    setupPersistence();
}

async function saveFormations() {
    // Deep clone to avoid modifying the in-memory state (which needs blocks for rendering)
    const formationsClone = JSON.parse(JSON.stringify(formations));

    // Recursive function to strip blocks and save content
    async function processItem(item) {
        if (item.blocks && item.blocks.length > 0) {
            // Save content to separate file
            await Persistence.saveContent(item.id, item.blocks);
            // Remove blocks from the clone to keep structure light
            item.blocks = [];
            // We can also add a flag 'hasContent' if needed, but checking file existence on load is enough
        }

        if (item.modules) {
            for (const m of item.modules) await processItem(m);
        }
        if (item.chapters) {
            for (const c of item.chapters) await processItem(c);
        }
        if (item.subChapters) {
            for (const s of item.subChapters) await processItem(s);
        }
    }

    // Process all formations
    for (const f of formationsClone) {
        await processItem(f);
    }

    // Save the lightweight structure
    await Persistence.saveData(formationsClone);
    console.log("Formations structure and content saved.");
}

function setupPersistence() {
    // Auto-save every 30 seconds
    setInterval(async () => {
        await saveFormations();
    }, 30000);

    // Save on Ctrl+S
    document.addEventListener('keydown', async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            await saveFormations();
            showNotification("Sauvegardé !");
        }
    });

    // Settings Modal Logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const storagePathInput = document.getElementById('storage-path-input');
    const settingsStatus = document.getElementById('settings-status');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            // Load current config
            const config = await Persistence.getConfig();
            if (config) {
                storagePathInput.value = config.isDefault ? '' : config.storagePath;
            }
            settingsModal.classList.remove('hidden');
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            settingsStatus.classList.add('hidden');
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const path = storagePathInput.value.trim();
            const result = await Persistence.setStoragePath(path);

            if (result && !result.error) {
                settingsStatus.textContent = "Configuration enregistrée !";
                settingsStatus.classList.remove('hidden', 'text-red-500');
                settingsStatus.classList.add('text-green-500');
                setTimeout(() => {
                    settingsModal.classList.add('hidden');
                    settingsStatus.classList.add('hidden');
                }, 1000);
            } else {
                settingsStatus.textContent = "Erreur : " + (result?.error || "Inconnue");
                settingsStatus.classList.remove('hidden', 'text-green-500');
                settingsStatus.classList.add('text-red-500');
            }
        });
    }
}

function showNotification(message) {
    // Simple notification
    const div = document.createElement('div');
    div.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}

// Run
init();
