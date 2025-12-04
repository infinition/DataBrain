function renderGraphBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const content = block.content || { code: 'graph TD\n  A[Start] --> B{Is it?}\n  B -- Yes --> C[OK]\n  C --> D[Rethink]\n  D --> B\n  B -- No --> E[End]', type: 'mermaid' };

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                        <i data-lucide="git-fork" class="w-3.5 h-3.5"></i> Graph / Mindmap (Mermaid)
                    </label>
                    <a href="https://mermaid.js.org/intro/" target="_blank" class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <i data-lucide="help-circle" class="w-3 h-3"></i> Aide syntaxe
                    </a>
                </div>
                <div class="relative">
                    <textarea class="mermaid-input w-full bg-slate-900 border border-slate-600 text-slate-300 p-3 rounded-lg font-mono text-sm h-48 outline-none focus:border-indigo-500 resize-y" placeholder="Code Mermaid...">${content.code}</textarea>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 min-h-[100px] flex items-center justify-center overflow-auto">
                    <div class="mermaid-preview w-full flex justify-center">
                        ${content.code}
                    </div>
                </div>
            </div>
        `;

        const textarea = div.querySelector('.mermaid-input');
        const preview = div.querySelector('.mermaid-preview');

        // Debounce update
        let timeout;
        textarea.oninput = (e) => {
            const newCode = e.target.value;
            updateBlock(block.id, { ...content, code: newCode }, true); // Skip full re-render

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                preview.innerHTML = newCode;
                preview.removeAttribute('data-processed'); // Force re-render
                try {
                    mermaid.run({ nodes: [preview] });
                } catch (err) {
                    preview.innerHTML = `<span class="text-red-400 text-xs font-mono">${err.message}</span>`;
                }
            }, 1000);
        };

        // Initial render in edit mode
        setTimeout(() => {
            try {
                mermaid.run({ nodes: [preview] });
            } catch (e) { console.error(e); }
        }, 100);

    } else {
        div.innerHTML = `
            <div class="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 overflow-x-auto flex justify-center">
                <div class="mermaid">
                    ${content.code}
                </div>
            </div>
        `;

        // Render mermaid
        setTimeout(() => {
            const el = div.querySelector('.mermaid');
            if (el) {
                try {
                    mermaid.run({ nodes: [el] });
                } catch (e) {
                    el.innerHTML = `<div class="text-red-400 text-sm p-4 border border-red-500/30 rounded bg-red-500/10">Erreur de rendu Mermaid: ${e.message}</div>`;
                }
            }
        }, 50);
    }

    return div;
}

// Initialize mermaid config
if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
}
