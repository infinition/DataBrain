function typesetMath(element) {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        window.MathJax.typesetPromise([element]).catch((err) => console.log('MathJax error:', err));
    }
}

function renderMathBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const align = block.content.align || 'center';
    const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="sigma" class="w-3.5 h-3.5"></i> Éditeur LaTeX</label>
                    <div class="flex bg-slate-900 rounded p-1 border border-slate-600">
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="left" title="Aligner à gauche"><i data-lucide="align-left" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="center" title="Centrer"><i data-lucide="align-center" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="right" title="Aligner à droite"><i data-lucide="align-right" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <textarea class="math-input w-full h-32 bg-slate-900 border border-slate-600 text-slate-300 p-2 rounded text-sm font-mono outline-none focus:border-indigo-500 resize-none" placeholder="Entrez votre formule LaTeX ici... ex: E = mc^2">${block.content.latex || ''}</textarea>
                <div class="text-xs text-slate-500">Aperçu :</div>
                <div class="math-preview p-4 bg-slate-900 rounded border border-slate-700 flex justify-center overflow-x-auto">
                    $$${block.content.latex || ''}$$
                </div>
            </div>
        `;

        const textarea = div.querySelector('.math-input');
        const preview = div.querySelector('.math-preview');

        textarea.oninput = (e) => {
            const latex = e.target.value;
            updateBlock(block.id, { ...block.content, latex: latex }, true); // Skip render to keep focus
            preview.innerHTML = `$$${latex}$$`;
            typesetMath(preview);
        };

        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => { updateBlock(block.id, { ...block.content, align: btn.dataset.align }); };
        });

        typesetMath(preview);

    } else {
        div.style.display = 'flex';
        div.style.justifyContent = justify;
        div.innerHTML = `
            <div class="overflow-x-auto py-2 px-4">
                $$${block.content.latex || ''}$$
            </div>
        `;
        typesetMath(div);
    }
    return div;
}
