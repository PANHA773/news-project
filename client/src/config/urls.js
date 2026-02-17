const normalizeUrl = (value = "") => value.replace(/\/+$/, "");

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_BASE_URL = normalizeUrl(rawApiUrl);
export const API_ORIGIN = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

export const toAbsoluteMediaUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return value.startsWith("/") ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`;
};
