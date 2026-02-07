import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useSocket } from "./SocketContext";
import AuthContext from "./AuthContext";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const socket = useSocket();
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data } = await api.get("/notifications");
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!socket || !user) return;

        socket.emit("join_notifications", user._id);

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            // Optionally play sound or show toast
        };

        const handleNewsPublished = (data) => {
            // This is a global event, we refresh to get the new record created by insertMany
            fetchNotifications();
        };

        socket.on("new_notification", handleNewNotification);
        socket.on("new_news_published", handleNewsPublished);
        socket.on("new_chat_notification", (data) => {
            // Just refresh for simplicity, or we could construct the object
            fetchNotifications();
        });

        return () => {
            socket.off("new_notification", handleNewNotification);
            socket.off("new_news_published", handleNewsPublished);
            socket.off("new_chat_notification");
        };
    }, [socket, user, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationsContext);
