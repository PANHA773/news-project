const fs = require("fs");
const os = require("os");
const path = require("path");

function resolveUploadsDir() {
    if (process.env.UPLOAD_DIR) {
        return process.env.UPLOAD_DIR;
    }

    const cwdUploads = path.join(process.cwd(), "uploads");
    try {
        fs.mkdirSync(cwdUploads, { recursive: true });
        return cwdUploads;
    } catch (err) {
        // Any failure (read-only FS, missing base path, etc) -> fall back to tmp
        return path.join(os.tmpdir(), "uploads");
    }
}

function ensureUploadsDir() {
    const dir = resolveUploadsDir();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function ensureUploadsSubdir(subdir) {
    const dir = path.join(ensureUploadsDir(), subdir);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

module.exports = { ensureUploadsDir, ensureUploadsSubdir };
