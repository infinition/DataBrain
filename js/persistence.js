// --- Persistence Layer ---

const API_URL = 'http://localhost:3000/api';

const Persistence = {
    // Check if server is available
    async checkServer() {
        try {
            const res = await fetch(`${API_URL}/config`);
            return res.ok;
        } catch (e) {
            console.warn("Server not reachable, falling back to local storage only.");
            return false;
        }
    },

    // Get Server Configuration
    async getConfig() {
        try {
            const res = await fetch(`${API_URL}/config`);
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    // Set Storage Path
    async setStoragePath(path) {
        try {
            const res = await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storagePath: path })
            });
            return await res.json();
        } catch (e) {
            console.error("Failed to set storage path", e);
            return { error: e.message };
        }
    },

    // Save Data (Formations)
    async saveData(data) {
        // 1. Save to LocalStorage (Backup)
        localStorage.setItem('databrain_backup', JSON.stringify(data));
        localStorage.setItem('databrain_last_save', Date.now());

        // 2. Save to Server
        try {
            await fetch(`${API_URL}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            console.log("Data saved to server");
            return true;
        } catch (e) {
            console.error("Failed to save to server", e);
            return false;
        }
    },

    // Load Data
    async loadData() {
        // Try loading from server first
        try {
            const res = await fetch(`${API_URL}/data`);
            if (res.ok) {
                const data = await res.json();
                if (data) return data;
            }
        } catch (e) {
            console.warn("Could not load from server, checking LocalStorage...");
        }

        // Fallback to LocalStorage
        const localData = localStorage.getItem('databrain_backup');
        if (localData) {
            console.log("Loaded data from LocalStorage backup");
            return JSON.parse(localData);
        }

        return null; // Return null to use default initial data
    },

    // Upload File
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                return await res.json(); // Returns { filename, path, ... }
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
        return null;
    },

    // --- Content Lazy Loading ---

    async loadContent(id) {
        try {
            const res = await fetch(`${API_URL}/content/${id}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn(`Could not load content for ${id}`, e);
        }
        return [];
    },

    async saveContent(id, blocks) {
        try {
            await fetch(`${API_URL}/content/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blocks)
            });
            return true;
        } catch (e) {
            console.error(`Failed to save content for ${id}`, e);
            return false;
        }
    }
};
