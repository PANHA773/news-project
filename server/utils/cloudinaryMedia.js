const path = require("path");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const CLOUDINARY_HOST_REGEX = /(^|\.)res\.cloudinary\.com$/i;

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mkv", ".mov", ".avi", ".mp3", ".wav", ".m4a", ".ogg", ".aac"]);
const RAW_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".rar", ".txt"]);

function isCloudinaryUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
        const parsed = new URL(value.trim());
        return CLOUDINARY_HOST_REGEX.test(parsed.hostname);
    } catch (_error) {
        return false;
    }
}

function stripExtension(filename) {
    if (typeof filename !== "string" || !filename) return "";
    return filename.replace(/\.[^.\/?#]+$/, "");
}

function extractCloudinaryPublicId(mediaUrl) {
    if (!isCloudinaryUrl(mediaUrl)) return "";

    try {
        const parsed = new URL(mediaUrl);
        const segments = parsed.pathname.split("/").filter(Boolean);
        const uploadIndex = segments.lastIndexOf("upload");
        if (uploadIndex === -1) return "";

        const afterUpload = segments.slice(uploadIndex + 1);
        if (afterUpload.length === 0) return "";

        const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
        let idSegments = [];

        if (versionIndex >= 0) {
            idSegments = afterUpload.slice(versionIndex + 1);
        } else {
            let start = 0;
            while (
                start < afterUpload.length - 1 &&
                (afterUpload[start].includes(",") || /^[a-z]{1,3}_.+/.test(afterUpload[start]))
            ) {
                start += 1;
            }
            idSegments = afterUpload.slice(start);
        }

        if (idSegments.length === 0) return "";
        idSegments[idSegments.length - 1] = stripExtension(idSegments[idSegments.length - 1]);
        return idSegments.filter(Boolean).join("/");
    } catch (_error) {
        return "";
    }
}

function inferCloudinaryResourceType(mediaUrl) {
    try {
        const parsed = new URL(mediaUrl);
        const segments = parsed.pathname.split("/").filter(Boolean);
        const uploadIndex = segments.lastIndexOf("upload");
        if (uploadIndex > 0) {
            const resourceType = segments[uploadIndex - 1];
            if (resourceType === "image" || resourceType === "video" || resourceType === "raw") {
                return resourceType;
            }
        }

        const ext = path.extname(parsed.pathname || "").toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) return "video";
        if (RAW_EXTENSIONS.has(ext)) return "raw";
    } catch (_error) {
        return "image";
    }

    return "image";
}

async function deleteCloudinaryByUrl(mediaUrl, options = {}) {
    if (!isCloudinaryConfigured()) return null;
    if (!isCloudinaryUrl(mediaUrl)) return null;

    const publicId = extractCloudinaryPublicId(mediaUrl);
    if (!publicId) return null;

    const resourceType = options.resourceType || inferCloudinaryResourceType(mediaUrl);

    try {
        return await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: "upload",
            invalidate: true,
        });
    } catch (error) {
        if (!options.silent) {
            console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
        }
        return null;
    }
}

async function deleteCloudinaryMany(urls, options = {}) {
    if (!Array.isArray(urls) || urls.length === 0) return;
    const uniqueUrls = [...new Set(urls.filter((url) => typeof url === "string" && url.trim()))];
    if (uniqueUrls.length === 0) return;
    await Promise.all(uniqueUrls.map((url) => deleteCloudinaryByUrl(url, options)));
}

function extractDocumentUrls(documents) {
    if (!Array.isArray(documents)) return [];

    return documents
        .map((doc) => {
            if (typeof doc === "string") return doc.trim();
            if (doc && typeof doc.url === "string") return doc.url.trim();
            return "";
        })
        .filter(Boolean);
}

module.exports = {
    isCloudinaryUrl,
    extractCloudinaryPublicId,
    inferCloudinaryResourceType,
    deleteCloudinaryByUrl,
    deleteCloudinaryMany,
    extractDocumentUrls,
};
