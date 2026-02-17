import { useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { Bookmark, Trash2, ExternalLink, Clock, User, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";

const Bookmarks = () => {
    const { user, updateProfile } = useContext(AuthContext);
    const notify = useNotification();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get("/users/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                updateProfile(data, token);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleRemoveBookmark = async (articleId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.put(`/users/bookmark/${articleId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedUser = { ...user, bookmarks: res.data.bookmarks };
            updateProfile(updatedUser, token);
            notify.success("Bookmark removed");
        } catch (error) {
            notify.error("Failed to remove bookmark");
        }
    };

    return (
        <div className="p-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-(--primary-glow)/10 border border-(--primary-glow)/20 text-(--primary-glow)">
                        <Bookmark className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Your Bookmarks</h1>
                        <p className="text-gray-400 text-lg mt-2">All your saved articles in one place.</p>
                    </div>
                </div>
            </header>

            {user?.bookmarks && user.bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {user.bookmarks.map((article) => (
                        <div key={article._id || article} className="group glass-card overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.05)] hover:border-(--primary-glow)/30 transition-all duration-300 flex flex-col h-full">
                            {/* Article Image/Video Preview */}
                            <div className="relative h-48 overflow-hidden bg-gray-900">
                                {(article.image || article.video) ? (
                                    <img
                                        src={article.image || article.video}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                                        <Bookmark className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-(--primary-glow) text-xs font-bold rounded-full border border-(--primary-glow)/20 uppercase tracking-wider">
                                        {article.category?.name || "News"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemoveBookmark(article._id)}
                                    className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove Bookmark"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-(--primary-glow) transition-colors">
                                    {article.title || "Untitled Article"}
                                </h3>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : "Just now"}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {article.author?.name || "Global Staff"}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/news/${article._id}`}
                                        className="flex items-center justify-center w-full py-3 bg-[rgba(255,255,255,0.03)] hover:bg-(--primary-glow) text-gray-300 hover:text-black font-bold rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-(--primary-glow) transition-all gap-2 group/btn"
                                    >
                                        Read Full Article
                                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.1)] rounded-3xl">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 border border-[rgba(255,255,255,0.05)]">
                        <Bookmark className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No bookmarks yet</h3>
                    <p className="text-gray-500 text-center max-w-sm px-6">
                        Explore the news feed and save interesting articles to read them later in this dedicated section.
                    </p>
                    <Link to="/news" className="mt-8 px-6 py-3 bg-(--primary-glow) text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                        Browse Latest News
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Bookmarks;

