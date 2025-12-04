function renderChartBlock(block) {
    const div = document.createElement('div');
    div.className = 'my-6';

    // Default chart config
    const defaultContent = {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Ventes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                }
            },
            plugins: {
                legend: { labels: { color: '#cbd5e1' } }
            }
        }
    };

    const content = block.content || { config: JSON.stringify(defaultContent, null, 2) };

    if (editMode) {
        div.innerHTML = `
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                        <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i> Graphique (Chart.js)
                    </label>
                    <a href="https://www.chartjs.org/docs/latest/" target="_blank" class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <i data-lucide="help-circle" class="w-3 h-3"></i> Doc Chart.js
                    </a>
                </div>
                <div class="relative">
                    <textarea class="chart-input w-full bg-slate-900 border border-slate-600 text-slate-300 p-3 rounded-lg font-mono text-sm h-64 outline-none focus:border-indigo-500 resize-y" placeholder="Configuration JSON Chart.js...">${content.config}</textarea>
                </div>
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 min-h-[200px] flex items-center justify-center relative">
                    <canvas class="chart-preview max-h-[300px]"></canvas>
                </div>
            </div>
        `;

        const textarea = div.querySelector('.chart-input');
        const canvas = div.querySelector('.chart-preview');
        let chartInstance = null;

        const renderPreview = (jsonStr) => {
            try {
                const config = JSON.parse(jsonStr);
                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(canvas, config);
            } catch (e) {
                console.warn("Invalid Chart JSON", e);
            }
        };

        // Initial render
        setTimeout(() => renderPreview(content.config), 100);

        // Debounce update
        let timeout;
        textarea.oninput = (e) => {
            const newConfig = e.target.value;
            updateBlock(block.id, { ...content, config: newConfig }, true); // Skip full re-render

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                renderPreview(newConfig);
            }, 800);
        };

    } else {
        div.innerHTML = `
            <div class="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 flex justify-center">
                <div class="w-full max-w-3xl min-h-[250px] aspect-video relative">
                    <canvas class="chart-canvas"></canvas>
                </div>
            </div>
        `;

        setTimeout(() => {
            const canvas = div.querySelector('.chart-canvas');
            if (canvas) {
                try {
                    const config = JSON.parse(content.config);
                    new Chart(canvas, config);
                } catch (e) {
                    div.innerHTML = `< div class="text-red-400 text-sm p-4 border border-red-500/30 rounded bg-red-500/10" > Erreur de rendu Chart.js: ${e.message}</div > `;
                }
            }
        }, 50);
    }

    return div;
}
