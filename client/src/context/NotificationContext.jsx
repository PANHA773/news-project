import { createContext, useState, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, message, duration = 5000) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, type, message }]);

        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const notify = {
        success: (msg, duration) => addNotification("success", msg, duration),
        error: (msg, duration) => addNotification("error", msg, duration),
        info: (msg, duration) => addNotification("info", msg, duration),
        warning: (msg, duration) => addNotification("warning", msg, duration),
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
                {notifications.map((notification) => (
                    <NotificationToast
                        key={notification.id}
                        {...notification}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationToast = ({ type, message, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    };

    const bgColors = {
        success: "bg-green-50 border-green-100",
        error: "bg-red-50 border-red-100",
        info: "bg-blue-50 border-blue-100",
        warning: "bg-orange-50 border-orange-100",
    };

    return (
        <div
            className={`pointer-events-auto flex items-center w-80 p-4 rounded-xl shadow-lg border backdrop-blur-sm bg-white/90 animate-in slide-in-from-right-10 fade-in duration-300 ${bgColors[type] || "bg-white"}`}
        >
            <div className="shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default NotificationContext;
