// --- Pyodide Worker Setup ---
const pyodideWorker = new Worker('js/pyodide.worker.js');
const pendingExecutions = new Map();

pyodideWorker.onmessage = (event) => {
    const { id, results, plot, error } = event.data;
    const callbacks = pendingExecutions.get(id);
    if (callbacks) {
        callbacks(results, plot, error);
        pendingExecutions.delete(id);
    }
};

function runPythonCode(id, code, callback) {
    pendingExecutions.set(id, callback);
    pyodideWorker.postMessage({ id, code });
}

function renderCodeBlock(block) {
    const div = document.createElement('div');
    div.className = 'border border-slate-700 rounded-lg overflow-hidden bg-[#1e1e1e] my-4 shadow-lg group';

    let codeContent = block.content;
    let language = 'python'; // Default

    if (typeof block.content === 'object' && block.content !== null) {
        codeContent = block.content.code || '';
        language = block.content.language || 'python';
    }

    // Manual Language Selection (Dropdown)
    const languages = ['python', 'javascript', 'html', 'css', 'java', 'cpp', 'sql', 'json', 'bash', 'markdown'];

    // Ensure language is valid
    if (!languages.includes(language)) {
        // Try to map common aliases or fallback
        if (language === 'js') language = 'javascript';
        else if (language === 'py') language = 'python';
        else if (language === 'sh') language = 'bash';
    }

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-700';

    // Language Options
    const langOptions = languages.map(lang => `<option value="${lang}" ${lang === language ? 'selected' : ''}>${lang.toUpperCase()}</option>`).join('');

    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xs text-orange-400 font-mono">In [ ]:</span>
            <select class="language-select bg-transparent text-xs text-slate-400 uppercase border-none outline-none cursor-pointer hover:text-white transition-colors">
                ${langOptions}
            </select>
        </div>
        <div class="flex items-center gap-2">
            <button class="copy-code-btn flex items-center gap-1 text-slate-400 hover:text-white p-1 rounded transition-colors" title="Copier le code">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button class="run-code-btn flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors">
                <i data-lucide="play" class="w-3 h-3"></i> Run
            </button>
        </div>
    `;

    // Language Change Handler
    header.querySelector('.language-select').onchange = (e) => {
        const newLang = e.target.value;
        const newContent = typeof block.content === 'object' ? { ...block.content, language: newLang } : { code: codeContent, language: newLang };
        updateBlock(block.id, newContent);
    };
    const body = document.createElement('div');
    body.className = 'relative';
    if (editMode) {
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-48 bg-[#1e1e1e] text-slate-300 p-4 font-mono text-sm outline-none resize-none border-b border-slate-700 focus:border-indigo-500';
        textarea.value = codeContent;
        textarea.spellcheck = false;
        textarea.oninput = (e) => {
            const newContent = typeof block.content === 'object' ? { ...block.content, code: e.target.value } : e.target.value;
            updateBlock(block.id, newContent, true);
        };
        body.appendChild(textarea);
    } else {
        const pre = document.createElement('div');
        pre.className = 'p-4 font-mono text-sm text-gray-300 overflow-x-auto relative transition-all duration-300 ease-in-out custom-scrollbar';

        // Limit height by default (approx 20 lines)
        pre.style.maxHeight = '400px';
        pre.style.overflowY = 'hidden';

        // Use highlight.js if available
        if (window.hljs) {
            const highlighted = hljs.highlight(codeContent, { language: language, ignoreIllegals: true }).value;
            pre.innerHTML = `<pre><code class="hljs language-${language}" style="white-space: pre;">${highlighted}</code></pre>`;
        } else {
            pre.innerHTML = `<pre style="white-space: pre;">${codeContent}</pre>`;
        }
        body.appendChild(pre);

        // Check if content is long enough to need a "Show More" button
        const lineCount = codeContent.split('\n').length;
        if (lineCount > 20) {
            const expandBtnContainer = document.createElement('div');
            expandBtnContainer.className = 'absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#1e1e1e] to-transparent flex items-end justify-center pb-2';
            expandBtnContainer.innerHTML = `
                <button class="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full shadow-lg transition-all">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i> Voir tout le code
                </button>
            `;
            expandBtnContainer.querySelector('button').onclick = () => {
                pre.style.maxHeight = 'none';
                expandBtnContainer.remove();
            };
            body.appendChild(expandBtnContainer);
        } else {
            pre.style.maxHeight = 'none';
        }
    }
    const outputDiv = document.createElement('div');
    outputDiv.className = 'hidden bg-[#252526] border-t border-slate-700 p-4 font-mono text-sm';
    outputDiv.innerHTML = `<span class="text-xs text-red-400 block mb-2">Out [1]:</span><pre class="text-white">Process finished with exit code 0\n> Execution successful.</pre>`;

    // Copy Button Logic
    header.querySelector('.copy-code-btn').onclick = () => {
        navigator.clipboard.writeText(codeContent).then(() => {
            const btn = header.querySelector('.copy-code-btn');
            btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i>`;
                lucide.createIcons();
            }, 2000);
        });
    };

    header.querySelector('.run-code-btn').onclick = () => {
        const btn = header.querySelector('.run-code-btn');

        if (language.toLowerCase() === 'python') {
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Running...`;
            lucide.createIcons();

            outputDiv.innerHTML = '';
            outputDiv.classList.remove('hidden');

            // Get code to run
            let codeToRun = codeContent;
            if (editMode) {
                const textarea = body.querySelector('textarea');
                if (textarea) codeToRun = textarea.value;
            }

            runPythonCode(block.id, codeToRun, (results, plot, error) => {
                btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
                lucide.createIcons();

                if (error) {
                    outputDiv.innerHTML += `<div class="text-red-400 whitespace-pre-wrap">${error}</div>`;
                }
                if (results) {
                    outputDiv.innerHTML += `<div class="text-white whitespace-pre-wrap">${results}</div>`;
                }
                if (plot) {
                    outputDiv.innerHTML += `<img src="data:image/png;base64,${plot}" class="mt-2 rounded bg-white p-1"/>`;
                }
                if (!error && !results && !plot) {
                    outputDiv.innerHTML += `<div class="text-slate-500 italic">No output</div>`;
                }
            });
        } else if (language.toLowerCase() === 'javascript') {
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Running...`;
            lucide.createIcons();

            outputDiv.innerHTML = '';
            outputDiv.classList.remove('hidden');

            // Get code to run
            let codeToRun = codeContent;
            if (editMode) {
                const textarea = body.querySelector('textarea');
                if (textarea) codeToRun = textarea.value;
            }

            // Execute JS
            setTimeout(() => {
                try {
                    const logs = [];
                    const originalLog = console.log;
                    console.log = (...args) => {
                        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
                        originalLog.apply(console, args);
                    };

                    // Run code
                    // Use new Function to run in global scope but we want to capture logs
                    // We wrap it in a function
                    new Function(codeToRun)();

                    console.log = originalLog; // Restore

                    btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
                    lucide.createIcons();

                    if (logs.length > 0) {
                        outputDiv.innerHTML += `<div class="text-white whitespace-pre-wrap">${logs.join('\n')}</div>`;
                    } else {
                        outputDiv.innerHTML += `<div class="text-slate-500 italic">Code executed (no output)</div>`;
                    }

                } catch (err) {
                    btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
                    lucide.createIcons();
                    outputDiv.innerHTML += `<div class="text-red-400 whitespace-pre-wrap">${err.toString()}</div>`;
                }
            }, 100);

        } else {
            // Default mock behavior for other languages
            btn.innerHTML = `<i data-lucide="cpu" class="w-3 h-3 animate-spin"></i> Run`;
            lucide.createIcons();
            setTimeout(() => {
                outputDiv.classList.remove('hidden');
                outputDiv.innerHTML = `<span class="text-xs text-yellow-400 block mb-2">Info:</span><pre class="text-slate-300">Execution simulation for ${language}. Real execution is currently only supported for Python.</pre>`;
                btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
                lucide.createIcons();
            }, 600);
        }
    };
    div.appendChild(header);
    div.appendChild(body);
    div.appendChild(outputDiv);
    return div;
}

function renderJupyterBlock(block) {
    const div = document.createElement('div');
    div.className = 'border border-slate-700 rounded-lg overflow-hidden bg-[#1e1e1e] my-4 shadow-lg group';

    let codeContent = block.content;
    if (typeof block.content === 'object' && block.content !== null) {
        codeContent = block.content.code || '';
    }

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-700';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xs text-orange-400 font-mono">In [ ]:</span>
            <span class="text-xs text-slate-400">Jupyter (Python 3.10)</span>
        </div>
        <div class="flex items-center gap-2">
            <button class="run-code-btn flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors">
                <i data-lucide="play" class="w-3 h-3"></i> Run
            </button>
        </div>
    `;

    const body = document.createElement('div');
    body.className = 'relative';

    let textarea; // Reference for edit mode

    if (editMode) {
        textarea = document.createElement('textarea');
        textarea.className = 'w-full h-48 bg-[#1e1e1e] text-slate-300 p-4 font-mono text-sm outline-none resize-none border-b border-slate-700 focus:border-indigo-500';
        textarea.value = codeContent;
        textarea.spellcheck = false;
        textarea.oninput = (e) => {
            const newContent = typeof block.content === 'object' ? { ...block.content, code: e.target.value } : e.target.value;
            updateBlock(block.id, newContent, true);
        };
        body.appendChild(textarea);
    } else {
        const pre = document.createElement('div');
        pre.className = 'p-4 font-mono text-sm text-gray-300 overflow-x-auto custom-scrollbar';
        if (window.hljs) {
            const highlighted = hljs.highlight(codeContent, { language: 'python', ignoreIllegals: true }).value;
            pre.innerHTML = `<pre><code class="hljs language-python" style="white-space: pre;">${highlighted}</code></pre>`;
        } else {
            pre.innerHTML = `<pre style="white-space: pre;">${codeContent}</pre>`;
        }
        body.appendChild(pre);
    }

    const outputDiv = document.createElement('div');
    outputDiv.className = 'hidden bg-[#252526] border-t border-slate-700 p-4 font-mono text-sm';

    header.querySelector('.run-code-btn').onclick = () => {
        const btn = header.querySelector('.run-code-btn');
        btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Running...`;
        lucide.createIcons();

        outputDiv.innerHTML = '';
        outputDiv.classList.remove('hidden');

        // Get code to run
        const codeToRun = editMode ? textarea.value : codeContent;

        runPythonCode(block.id, codeToRun, (results, plot, error) => {
            btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run`;
            lucide.createIcons();

            if (error) {
                outputDiv.innerHTML += `<div class="text-red-400 whitespace-pre-wrap">${error}</div>`;
            }
            if (results) {
                outputDiv.innerHTML += `<div class="text-white whitespace-pre-wrap">${results}</div>`;
            }
            if (plot) {
                outputDiv.innerHTML += `<img src="data:image/png;base64,${plot}" class="mt-2 rounded bg-white p-1"/>`;
            }
            if (!error && !results && !plot) {
                outputDiv.innerHTML += `<div class="text-slate-500 italic">No output</div>`;
            }
        });
    };

    div.appendChild(header);
    div.appendChild(body);
    div.appendChild(outputDiv);
    return div;
}
