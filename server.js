const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large data
app.use(express.static(__dirname)); // Serve static files from current directory

const CONFIG_FILE = path.join(__dirname, 'server_config.json');

// Helper to get storage path
function getStoragePath() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (config.storagePath) {
                return config.storagePath;
            }
        } catch (e) {
            console.error("Error reading config:", e);
        }
    }
    // Default to a 'data' folder in the project directory
    const defaultPath = path.join(__dirname, 'data');
    if (!fs.existsSync(defaultPath)) {
        fs.mkdirSync(defaultPath, { recursive: true });
    }
    return defaultPath;
}

// Ensure storage directory exists
function ensureStorage() {
    const storagePath = getStoragePath();
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }
    const filesPath = path.join(storagePath, 'files');
    if (!fs.existsSync(filesPath)) {
        fs.mkdirSync(filesPath, { recursive: true });
    }
    return storagePath;
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const storagePath = ensureStorage();
        cb(null, path.join(storagePath, 'files'));
    },
    filename: function (req, file, cb) {
        // Keep original name but prepend timestamp to avoid collisions
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// API Endpoints

// Get Configuration
app.get('/api/config', (req, res) => {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) { }
    }
    res.json({
        storagePath: config.storagePath || path.join(__dirname, 'data'),
        isDefault: !config.storagePath
    });
});

// Update Configuration (Set Storage Path)
app.post('/api/config', (req, res) => {
    const { storagePath } = req.body;
    if (!storagePath) {
        return res.status(400).json({ error: 'Storage path is required' });
    }

    try {
        // Verify path exists or try to create it
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        const config = { storagePath };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

        res.json({ success: true, storagePath });
    } catch (e) {
        res.status(500).json({ error: 'Failed to set storage path: ' + e.message });
    }
});

// Get Data (formations)
app.get('/api/data', (req, res) => {
    const storagePath = ensureStorage();
    const dataFile = path.join(storagePath, 'formations.json');

    if (fs.existsSync(dataFile)) {
        try {
            const data = fs.readFileSync(dataFile, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Failed to read data' });
        }
    } else {
        // Return empty or default data if no file exists
        // We could return the initial data from js/data.js if we wanted, 
        // but the frontend should handle the "no data on server" case by using its default.
        res.json(null);
    }
});

// Save Data (formations)
app.post('/api/data', (req, res) => {
    const storagePath = ensureStorage();
    const dataFile = path.join(storagePath, 'formations.json');

    try {
        fs.writeFileSync(dataFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// --- Content (Lazy Loading) ---

function ensureContentStorage() {
    const storagePath = ensureStorage();
    const contentPath = path.join(storagePath, 'content');
    if (!fs.existsSync(contentPath)) {
        fs.mkdirSync(contentPath, { recursive: true });
    }
    return contentPath;
}

// Get Content (Blocks for a specific ID)
app.get('/api/content/:id', (req, res) => {
    const contentPath = ensureContentStorage();
    const contentFile = path.join(contentPath, `${req.params.id}.json`);

    if (fs.existsSync(contentFile)) {
        try {
            const data = fs.readFileSync(contentFile, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Failed to read content' });
        }
    } else {
        // Return empty array if no content file exists yet
        res.json([]);
    }
});

// Save Content (Blocks for a specific ID)
app.post('/api/content/:id', (req, res) => {
    const contentPath = ensureContentStorage();
    const contentFile = path.join(contentPath, `${req.params.id}.json`);

    try {
        fs.writeFileSync(contentFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

// Upload File
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the relative path or URL to access the file
    // Since we serve static files from root, and files are in storagePath/files...
    // If storagePath is outside root, we need a route to serve them.

    // Wait, if storagePath is arbitrary (e.g. on NAS), we can't just serve it via express.static(__dirname).
    // We need a dynamic route to serve files from the configured storage path.

    res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/api/files/${req.file.filename}`
    });
});

// Serve uploaded files
app.get('/api/files/:filename', (req, res) => {
    const storagePath = ensureStorage();
    const filePath = path.join(storagePath, 'files', req.params.filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Storage path: ${getStoragePath()}`);
});
