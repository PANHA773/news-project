import { useNotifications } from "../context/NotificationsContext";
import { Bell, Heart, MessageCircle, Info, CheckCircle, Clock, FileText, Phone, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Notifications = () => {
    const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
            case 'news': return <FileText className="w-4 h-4 text-(--primary-glow)" />;
            case 'message': return <MessageCircle className="w-4 h-4 text-green-500" />;
            case 'call': return <Phone className="w-4 h-4 text-primary-glow" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-(--primary-glow)"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white glow-text">Notifications</h2>
                    <p className="text-gray-400 mt-1">Keep track of your community interactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-xs text-gray-400 transition-all"
                        >
                            <Check className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                    <div className="bg-gray-800/50 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-(--primary-glow)" />
                        <span className="text-white font-bold">{unreadCount} New</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {notifications.map((notification) => (
                    <div
                        key={notification._id}
                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                        className={`group relative glass-card p-5 rounded-3xl border border-white/5 transition-all hover:bg-white/[0.03] flex gap-5 cursor-pointer ${!notification.isRead ? 'bg-white/[0.02] border-l-4 border-l-(--primary-glow)' : 'opacity-70'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gray-800 border border-white/10 overflow-hidden shrink-0 shadow-xl group-hover:scale-105 transition-transform`}>
                            {notification.sender?.avatar ? (
                                <img src={notification.sender.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 font-bold border-2 border-dashed border-white/5">
                                    {notification.sender?.name?.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {getIcon(notification.type)}
                                <span className="text-white font-bold">{notification.sender?.name}</span>
                                <span className="text-gray-500 text-xs flex items-center gap-1 ml-auto">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">
                                {notification.message}
                            </p>
                            {notification.news && (
                                <Link
                                    to={`/news/${notification.news._id}`}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-(--primary-glow) border border-white/5 transition-colors"
                                >
                                    View Article: {notification.news.title}
                                </Link>
                            )}
                        </div>

                        {!notification.isRead && (
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-(--primary-glow) shadow-[0_0_10px_var(--primary-glow)]"></div>
                        )}
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Clean Slate</h3>
                        <p className="text-gray-400">No notifications yet. Interactions will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
