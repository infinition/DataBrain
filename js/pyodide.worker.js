importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;

async function loadPyodideAndPackages() {
    try {
        pyodide = await loadPyodide();
        await pyodide.loadPackage(["micropip", "numpy", "matplotlib", "scipy", "scikit-learn"]);

        // Setup matplotlib backend to Agg to capture plots
        await pyodide.runPythonAsync(`
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
            import io, base64
            
            def get_plot_base64():
                if not plt.get_fignums():
                    return None
                buf = io.BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                img_str = base64.b64encode(buf.read()).decode('utf-8')
                plt.clf() 
                return img_str
        `);
    } catch (err) {
        console.error("Failed to load Pyodide:", err);
    }
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
    await pyodideReadyPromise;
    const { id, code } = event.data;

    try {
        // Redirect stdout/stderr
        let stdout = [];
        pyodide.setStdout({ batched: (msg) => stdout.push(msg) });
        pyodide.setStderr({ batched: (msg) => stdout.push("Error: " + msg) });

        // Execute code
        await pyodide.runPythonAsync(code);

        // Check for plots
        let plot = await pyodide.runPythonAsync(`get_plot_base64()`);

        self.postMessage({ id, results: stdout.join('\n'), plot, error: null });
    } catch (error) {
        self.postMessage({ id, results: null, plot: null, error: error.message });
    }
};
