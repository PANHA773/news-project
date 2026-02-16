import { createContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    // Use the more detailed profile endpoint
                    const { data } = await api.get("/users/profile", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser({ ...data, token });
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem("token");
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password, role) => {
        const { data } = await api.post("/auth/login", { email, password, role });
        localStorage.setItem("token", data.token);

        // Fetch full profile immediately after login to get populated bookmarks/settings
        const profileRes = await api.get("/users/profile", {
            headers: { Authorization: `Bearer ${data.token}` }
        });
        setUser({ ...profileRes.data, token: data.token });
    };

    const register = async (name, email, password, gender) => {
        const { data } = await api.post("/auth/register", { name, email, password, gender });
        localStorage.setItem("token", data.token);
        setUser(data);
    };

    const updateProfile = (userData, token) => {
        if (token) localStorage.setItem("token", token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
