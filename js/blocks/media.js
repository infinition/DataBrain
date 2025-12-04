function renderVideoBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const align = block.content.align || 'center';
    const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="video" class="w-3.5 h-3.5"></i> Configuration Vidéo</label>
                    <div class="flex bg-slate-900 rounded p-1 border border-slate-600">
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="left" title="Aligner à gauche"><i data-lucide="align-left" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="center" title="Centrer"><i data-lucide="align-center" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="right" title="Aligner à droite"><i data-lucide="align-right" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <input type="text" class="video-title-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="Titre de la vidéo" value="${block.content.title}">
                <input type="text" class="video-src-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="URL de la vidéo" value="${block.content.src}">
            </div>
        `;
        div.querySelector('.video-title-input').oninput = (e) => updateBlock(block.id, { ...block.content, title: e.target.value }, true);
        div.querySelector('.video-src-input').oninput = (e) => updateBlock(block.id, { ...block.content, src: e.target.value }, true);
        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => { updateBlock(block.id, { ...block.content, align: btn.dataset.align }); };
        });
    } else {
        div.style.display = 'flex';
        div.style.justifyContent = justify;

        const src = block.content.src || '';
        let videoContent = '';
        let isYoutube = false;

        // Check for YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const youtubeMatch = src.match(youtubeRegex);

        if (youtubeMatch && youtubeMatch[1]) {
            isYoutube = true;
            const videoId = youtubeMatch[1];
            videoContent = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    title="${block.content.title || 'YouTube video'}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen 
                    class="w-full h-full absolute top-0 left-0"
                ></iframe>
            `;
        } else if (src) {
            videoContent = `<video src="${src}" controls class="w-full h-full object-contain"></video>`;
        } else {
            videoContent = `
                <div class="flex flex-col items-center justify-center">
                    <i data-lucide="play-circle" class="w-16 h-16 text-white/50 mb-2"></i>
                    <span class="text-slate-500 text-xs">Aucune source vidéo</span>
                </div>`;
        }

        div.innerHTML = `
            <div class="aspect-video bg-black rounded-xl flex flex-col items-center justify-center border border-slate-700 relative group cursor-pointer shadow-lg overflow-hidden w-full max-w-3xl">
                ${videoContent}
                ${(!isYoutube && block.content.title) ? `<div class="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm backdrop-blur-md pointer-events-none">${block.content.title}</div>` : ''}
            </div>
        `;
    }
    return div;
}

function renderImageBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const align = block.content.align || 'center';
    const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="image" class="w-3.5 h-3.5"></i> Configuration Image</label>
                    <div class="flex bg-slate-900 rounded p-1 border border-slate-600">
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="left" title="Aligner à gauche"><i data-lucide="align-left" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="center" title="Centrer"><i data-lucide="align-center" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="right" title="Aligner à droite"><i data-lucide="align-right" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <input type="text" class="img-src-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm" placeholder="URL de l'image" value="${block.content.src}">
                <input type="text" class="img-cap-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm" placeholder="Légende" value="${block.content.caption}">
            </div>
        `;
        div.querySelector('.img-src-input').oninput = (e) => updateBlock(block.id, { ...block.content, src: e.target.value }, true);
        div.querySelector('.img-cap-input').oninput = (e) => updateBlock(block.id, { ...block.content, caption: e.target.value }, true);
        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => { updateBlock(block.id, { ...block.content, align: btn.dataset.align }); };
        });
    } else {
        div.style.display = 'flex';
        div.style.justifyContent = justify;
        div.innerHTML = `
            <figure class="flex flex-col items-center">
                <img src="${block.content.src}" alt="content" class="rounded-xl max-h-[500px] object-contain border border-slate-700 bg-slate-900" />
                ${block.content.caption ? `<figcaption class="text-slate-500 text-xs mt-2 italic">${block.content.caption}</figcaption>` : ''}
            </figure>
        `;
    }
    return div;
}

function renderAudioBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const align = block.content.align || 'center';
    const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><i data-lucide="music" class="w-3.5 h-3.5"></i> Configuration Audio</label>
                    <div class="flex bg-slate-900 rounded p-1 border border-slate-600">
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="left" title="Aligner à gauche"><i data-lucide="align-left" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="center" title="Centrer"><i data-lucide="align-center" class="w-4 h-4"></i></button>
                        <button class="align-btn p-1 rounded hover:bg-slate-700 ${align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}" data-align="right" title="Aligner à droite"><i data-lucide="align-right" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <input type="text" class="audio-title-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="Titre de l'audio" value="${block.content.title || ''}">
                <div class="flex gap-2">
                    <input type="text" class="audio-src-input flex-1 bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="URL du fichier audio" value="${block.content.src || ''}">
                    <button class="upload-btn bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors" title="Uploader un fichier"><i data-lucide="upload" class="w-4 h-4"></i></button>
                    <input type="file" class="hidden-file-input hidden" accept="audio/*">
                </div>
            </div>
        `;

        div.querySelector('.audio-title-input').oninput = (e) => updateBlock(block.id, { ...block.content, title: e.target.value }, true);
        div.querySelector('.audio-src-input').oninput = (e) => updateBlock(block.id, { ...block.content, src: e.target.value }, true);

        const fileInput = div.querySelector('.hidden-file-input');
        div.querySelector('.upload-btn').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    updateBlock(block.id, { ...block.content, src: ev.target.result });
                };
                reader.readAsDataURL(file);
            }
        };

        div.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => { updateBlock(block.id, { ...block.content, align: btn.dataset.align }); };
        });

    } else {
        div.style.display = 'flex';
        div.style.justifyContent = justify;
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2 w-full max-w-md shadow-lg">
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <i data-lucide="music" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm">${block.content.title || 'Audio sans titre'}</h3>
                    </div>
                </div>
                ${block.content.src ? `<audio controls src="${block.content.src}" class="w-full"></audio>` : '<div class="text-slate-500 text-xs italic">Aucune source audio.</div>'}
            </div>
        `;
    }
    return div;
}

function renderEmbedBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const content = block.content || { src: '', title: '', type: 'auto' };

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                        <i data-lucide="paperclip" class="w-3.5 h-3.5"></i> Configuration Embed
                    </label>
                    <select class="type-select bg-slate-900 border border-slate-600 text-white text-xs px-2 py-1 rounded outline-none focus:border-indigo-500">
                        <option value="auto" ${content.type === 'auto' ? 'selected' : ''}>Auto-détection</option>
                        <option value="pdf" ${content.type === 'pdf' ? 'selected' : ''}>PDF</option>
                        <option value="google" ${content.type === 'google' ? 'selected' : ''}>Google Docs/Sheets/Slides</option>
                        <option value="office" ${content.type === 'office' ? 'selected' : ''}>Microsoft Office Online</option>
                        <option value="csv" ${content.type === 'csv' ? 'selected' : ''}>CSV (Tableau interactif)</option>
                        <option value="epub" ${content.type === 'epub' ? 'selected' : ''}>EPUB / eBook</option>
                        <option value="iframe" ${content.type === 'iframe' ? 'selected' : ''}>Iframe Générique</option>
                    </select>
                </div>
                <input type="text" class="embed-title-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="Titre du fichier" value="${content.title || ''}">
                <input type="text" class="embed-src-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="URL du fichier ou lien embed" value="${content.src || ''}">
                <p class="text-[10px] text-slate-500">Supporte : PDF, Google Docs, Office Online, CSV, EPUB, etc.</p>
            </div>
        `;

        div.querySelector('.embed-title-input').oninput = (e) => updateBlock(block.id, { ...content, title: e.target.value }, true);
        div.querySelector('.embed-src-input').oninput = (e) => updateBlock(block.id, { ...content, src: e.target.value }, true);
        div.querySelector('.type-select').onchange = (e) => updateBlock(block.id, { ...content, type: e.target.value });

    } else {
        const src = content.src || '';
        let type = content.type;

        // Auto-detect type if 'auto'
        if (type === 'auto' && src) {
            const lowerSrc = src.toLowerCase();
            if (lowerSrc.endsWith('.pdf')) type = 'pdf';
            else if (lowerSrc.includes('docs.google.com') || lowerSrc.includes('drive.google.com')) type = 'google';
            else if (lowerSrc.includes('office.live.com') || lowerSrc.endsWith('.docx') || lowerSrc.endsWith('.xlsx') || lowerSrc.endsWith('.pptx')) type = 'office';
            else if (lowerSrc.endsWith('.csv')) type = 'csv';
            else if (lowerSrc.endsWith('.epub')) type = 'epub';
            else type = 'iframe';
        }

        div.innerHTML = `
            <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg w-full h-[600px] relative group">
                <div class="bg-slate-900/80 backdrop-blur p-3 border-b border-slate-700 flex items-center justify-between absolute top-0 left-0 right-0 z-10">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${getIconForType(type)}" class="w-4 h-4 text-indigo-400"></i>
                        <span class="text-sm font-bold text-slate-200">${content.title || 'Fichier intégré'}</span>
                    </div>
                    <a href="${src}" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        <i data-lucide="external-link" class="w-3 h-3"></i> Ouvrir
                    </a>
                </div>
                <div class="flex-1 bg-slate-900 pt-12 h-full relative">
                    ${renderEmbedContent(type, src)}
                </div>
            </div>
        `;
    }
    return div;
}

function getIconForType(type) {
    switch (type) {
        case 'pdf': return 'file-text';
        case 'google': return 'file';
        case 'office': return 'file-spreadsheet';
        case 'csv': return 'table';
        case 'epub': return 'book-open';
        default: return 'paperclip';
    }
}

function renderEmbedContent(type, src) {
    if (!src) return '<div class="flex items-center justify-center h-full text-slate-500 text-sm">Aucune source définie</div>';

    switch (type) {
        case 'pdf':
            return `<iframe src="${src}" class="w-full h-full border-0"></iframe>`;

        case 'google':
            return `<iframe src="${src}" class="w-full h-full border-0"></iframe>`;

        case 'office':
            if (src.includes('view.officeapps.live.com')) {
                return `<iframe src="${src}" class="w-full h-full border-0"></iframe>`;
            }
            return `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}" class="w-full h-full border-0"></iframe>`;

        case 'csv':
            const csvId = 'csv-' + Math.random().toString(36).substr(2, 9);
            setTimeout(() => {
                fetch(src)
                    .then(r => r.text())
                    .then(csvText => {
                        const rows = csvText.trim().split('\\n').map(r => r.split(','));
                        const table = document.getElementById(csvId);
                        if (table && rows.length > 0) {
                            let html = '<thead class="bg-slate-800 text-slate-300 sticky top-0"><tr>';
                            rows[0].forEach(h => html += `<th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider border-b border-slate-700">${h}</th>`);
                            html += '</tr></thead><tbody class="bg-slate-900 divide-y divide-slate-800">';
                            rows.slice(1).forEach(row => {
                                html += '<tr>';
                                row.forEach(cell => html += `<td class="px-4 py-2 text-sm text-slate-400 whitespace-nowrap">${cell}</td>`);
                                html += '</tr>';
                            });
                            html += '</tbody>';
                            table.innerHTML = html;
                        }
                    })
                    .catch(err => {
                        const container = document.getElementById(csvId)?.parentElement;
                        if (container) container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-red-400 text-sm gap-2"><i data-lucide="alert-circle" class="w-6 h-6"></i> Erreur de chargement du CSV (CORS ou introuvable).</div>`;
                        lucide.createIcons();
                    });
            }, 100);
            return `<div class="w-full h-full overflow-auto custom-scrollbar"><table id="${csvId}" class="min-w-full divide-y divide-slate-700"></table></div>`;

        case 'epub':
            return `<iframe src="${src}" class="w-full h-full border-0"></iframe>`;

        default:
            return `<iframe src="${src}" class="w-full h-full border-0"></iframe>`;
    }
}

function render3DBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';
    const content = block.content || { src: '', title: '', autoRotate: false };

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                        <i data-lucide="box" class="w-3.5 h-3.5"></i> Configuration 3D (GLTF/GLB)
                    </label>
                    <div class="flex items-center gap-2">
                        <label class="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" class="auto-rotate-check" ${content.autoRotate ? 'checked' : ''}>
                            Auto-rotation par défaut
                        </label>
                    </div>
                </div>
                <input type="text" class="model-title-input bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="Titre du modèle" value="${content.title || ''}">
                <div class="flex gap-2">
                    <input type="text" class="model-src-input flex-1 bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm outline-none focus:border-indigo-500" placeholder="URL du fichier .glb ou .gltf" value="${content.src || ''}">
                    <button class="upload-btn bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors" title="Uploader un fichier"><i data-lucide="upload" class="w-4 h-4"></i></button>
                    <input type="file" class="hidden-file-input hidden" accept=".glb,.gltf">
                </div>
                <p class="text-[10px] text-slate-500">Formats supportés : .glb, .gltf. Utilisez des liens directs (ex: raw github, cdn).</p>
            </div>
        `;

        div.querySelector('.model-title-input').oninput = (e) => updateBlock(block.id, { ...content, title: e.target.value }, true);
        div.querySelector('.model-src-input').oninput = (e) => updateBlock(block.id, { ...content, src: e.target.value }, true);
        div.querySelector('.auto-rotate-check').onchange = (e) => updateBlock(block.id, { ...content, autoRotate: e.target.checked });

        const fileInput = div.querySelector('.hidden-file-input');
        div.querySelector('.upload-btn').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    updateBlock(block.id, { ...content, src: ev.target.result });
                };
                reader.readAsDataURL(file);
            }
        };

    } else {
        const src = content.src;
        if (!src) {
            div.innerHTML = `
                <div class="bg-slate-800 rounded-xl border border-slate-700 p-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <i data-lucide="box" class="w-8 h-8 opacity-50"></i>
                    <span class="text-sm">Aucun modèle 3D chargé</span>
                </div>`;
            return div;
        }

        div.innerHTML = `
            <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative group w-full h-[500px]">
                <div class="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded text-white text-sm font-bold pointer-events-none">
                    ${content.title || 'Modèle 3D'}
                </div>
                <div class="iframe-container w-full h-full"></div>
                
                <!-- Controls Overlay -->
                <div class="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end pointer-events-none">
                    
                    <!-- Left Controls: View Modes -->
                    <div class="flex gap-2 pointer-events-auto">
                        <button class="turntable-btn bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg backdrop-blur shadow-lg transition-colors border border-slate-700" title="Turntable (Rotation)">
                            <i data-lucide="${content.autoRotate ? 'pause' : 'play'}" class="w-4 h-4"></i>
                        </button>
                        
                        <div class="relative group/menu">
                            <button class="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-2 rounded-lg backdrop-blur shadow-lg transition-colors border border-slate-700 flex items-center gap-2 text-xs font-medium">
                                <i data-lucide="layers" class="w-4 h-4"></i> <span class="current-mode-text">Rendu</span>
                            </button>
                            <div class="absolute bottom-full left-0 mb-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover/menu:block">
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="default">Rendu</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="wireframe">Fil de fer</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="albedo">Albedo (Base)</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="normal">Normal Map</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="roughness">Roughness</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="metalness">Metalness</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="emissive">Emissive</button>
                                <button class="view-mode-btn w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white" data-mode="ao">Ambient Occlusion</button>
                            </div>
                        </div>
                    </div>

                    <!-- Right Controls: Reset & Fullscreen -->
                    <div class="flex gap-2 pointer-events-auto">
                        <button class="reset-view-btn bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full backdrop-blur shadow-lg transition-colors border border-slate-700" title="Réinitialiser la vue">
                            <i data-lucide="refresh-ccw" class="w-4 h-4"></i>
                        </button>
                        <button class="fullscreen-btn bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full backdrop-blur shadow-lg transition-colors border border-slate-700" title="Plein écran">
                            <i data-lucide="maximize" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const container = div.querySelector('.iframe-container');
        const iframe = document.createElement('iframe');
        iframe.className = 'w-full h-full border-0';

        // Three.js Viewer Logic inside iframe
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>body { margin: 0; overflow: hidden; background: #0f1117; }</style>
                <script type="importmap">
                  {
                    "imports": {
                      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
                    }
                  }
                </script>
            </head>
            <body>
                <div id="loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-family: sans-serif; font-size: 12px;">Chargement...</div>
                <script type="module">
                    import * as THREE from 'three';
                    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
                    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
                    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
                    camera.position.set(5, 2, 5);

                    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    document.body.appendChild(renderer.domElement);

                    const pmremGenerator = new THREE.PMREMGenerator(renderer);
                    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;
                    controls.autoRotate = ${content.autoRotate};
                    controls.target.set(0, 0, 0);
                    controls.update();

                    let originalMaterials = new Map();
                    let loadedModel = null;

                    const loader = new GLTFLoader();
                    loader.load('${src}', function (gltf) {
                        const model = gltf.scene;
                        loadedModel = model;
                        
                        // Center and scale model
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 3 / maxDim;
                        model.scale.setScalar(scale);
                        
                        box.setFromObject(model);
                        box.getCenter(center);
                        model.position.sub(center);

                        // Save original materials
                        model.traverse((child) => {
                            if (child.isMesh) {
                                originalMaterials.set(child.uuid, child.material);
                            }
                        });

                        scene.add(model);
                        document.getElementById('loader').style.display = 'none';

                    }, undefined, function (error) {
                        console.error(error);
                        document.getElementById('loader').innerText = 'Erreur de chargement';
                        document.getElementById('loader').style.color = '#ff6b6b';
                    });

                    window.addEventListener('resize', onWindowResize);

                    function onWindowResize() {
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                    }

                    function animate() {
                        requestAnimationFrame(animate);
                        controls.update();
                        renderer.render(scene, camera);
                    }

                    animate();

                    // --- Exposed Functions for Parent ---

                    window.resetView = () => {
                        camera.position.set(5, 2, 5);
                        controls.target.set(0, 0, 0);
                        controls.update();
                    };

                    window.toggleRotation = (active) => {
                        controls.autoRotate = active;
                    };

                    window.setRenderMode = (mode) => {
                        if (!loadedModel) return;

                        loadedModel.traverse((child) => {
                            if (child.isMesh) {
                                const original = originalMaterials.get(child.uuid);
                                if (!original) return;

                                if (mode === 'default') {
                                    child.material = original;
                                    child.material.wireframe = false;
                                } else if (mode === 'wireframe') {
                                    child.material = original;
                                    child.material.wireframe = true;
                                } else {
                                    // Debug Views (Albedo, Normal, etc.)
                                    // We use a basic material to show the texture directly without lighting interference
                                    const debugMat = new THREE.MeshBasicMaterial({ wireframe: false });
                                    
                                    if (mode === 'albedo') {
                                        debugMat.map = original.map || null;
                                        debugMat.color = original.map ? new THREE.Color(0xffffff) : original.color;
                                    } else if (mode === 'normal') {
                                        debugMat.map = original.normalMap || null;
                                        if (!debugMat.map) debugMat.color.setHex(0x8080ff); // Default normal color
                                    } else if (mode === 'roughness') {
                                        debugMat.map = original.roughnessMap || null;
                                        if (!debugMat.map) {
                                            const val = original.roughness !== undefined ? original.roughness : 0.5;
                                            debugMat.color.setScalar(val);
                                        }
                                    } else if (mode === 'metalness') {
                                        debugMat.map = original.metalnessMap || null;
                                        if (!debugMat.map) {
                                            const val = original.metalness !== undefined ? original.metalness : 0.0;
                                            debugMat.color.setScalar(val);
                                        }
                                    } else if (mode === 'emissive') {
                                        debugMat.map = original.emissiveMap || null;
                                        if (!debugMat.map) {
                                            debugMat.color = original.emissive || new THREE.Color(0x000000);
                                        }
                                    } else if (mode === 'ao') {
                                        debugMat.map = original.aoMap || null;
                                        if (!debugMat.map) {
                                            debugMat.color.setScalar(1.0); // White = no occlusion
                                        }
                                    }
                                    
                                    child.material = debugMat;
                                }
                            }
                        });
                    };
                </script>
            </body>
            </html>
        `;

        iframe.srcdoc = htmlContent;
        container.appendChild(iframe);

        // --- UI Event Listeners ---

        // Reset View
        div.querySelector('.reset-view-btn').onclick = () => {
            if (iframe.contentWindow && iframe.contentWindow.resetView) iframe.contentWindow.resetView();
        };

        // Fullscreen
        div.querySelector('.fullscreen-btn').onclick = () => {
            if (div.requestFullscreen) div.requestFullscreen();
        };

        // Turntable
        const turntableBtn = div.querySelector('.turntable-btn');
        let isRotating = content.autoRotate;
        turntableBtn.onclick = () => {
            isRotating = !isRotating;
            turntableBtn.innerHTML = `<i data-lucide="${isRotating ? 'pause' : 'play'}" class="w-4 h-4"></i>`;
            lucide.createIcons();
            if (iframe.contentWindow && iframe.contentWindow.toggleRotation) {
                iframe.contentWindow.toggleRotation(isRotating);
            }
        };

        // View Modes
        const modeText = div.querySelector('.current-mode-text');
        div.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.dataset.mode;
                modeText.textContent = btn.textContent;
                if (iframe.contentWindow && iframe.contentWindow.setRenderMode) {
                    iframe.contentWindow.setRenderMode(mode);
                }
            };
        });
    }
    return div;
}
