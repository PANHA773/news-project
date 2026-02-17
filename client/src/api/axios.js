import axios from "axios";
import { API_BASE_URL } from "../config/urls";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to add the token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
