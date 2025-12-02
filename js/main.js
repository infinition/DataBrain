// --- Initialization ---
function init() {
    renderSidebar();
    renderContent();
    setupEventListeners();
    setupCustomizationListeners();
    populateLucidePicker();
    lucide.createIcons();
}

// Run
init();
