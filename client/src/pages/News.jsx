import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { Plus, Trash, Image as ImageIcon, Edit, Video as VideoIcon, Bookmark, BookmarkCheck, ExternalLink, Heart, MessageCircle, Eye, ShieldAlert, Globe, Cpu, Activity, Music, Film, Mic, Briefcase, GraduationCap, FlaskConical, Gamepad2, Utensils, Plane, Home, Tag, FileText, X, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { toAbsoluteMediaUrl } from "../config/urls";

// Icon mapping (Same as Categories.jsx)
const iconMap = {
    Tag, Globe, Cpu, Activity, Heart, Music, Film, Mic, Briefcase, GraduationCap, FlaskConical, Gamepad2, Utensils, Plane, Home
};

const News = () => {
    // ... existing state ...
    const { user, updateProfile } = useContext(AuthContext);
    const notify = useNotification();
    const [newsList, setNewsList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [deleteConfirmNews, setDeleteConfirmNews] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "",
        image: "",
        video: "",
        documents: []
    });

    useEffect(() => {
        fetchNews();
        fetchCategories();

    }, []);

    const fetchNews = async () => {
        try {
            const { data } = await api.get("/news");
            setNewsList(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching news", error);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/categories");
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    }

    // ... existing handlers ...
    const handleBookmark = async (articleId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.put(`/users/bookmark/${articleId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local user context with new bookmarks
            const updatedUser = { ...user, bookmarks: res.data.bookmarks };
            updateProfile(updatedUser, token);

            notify.success(res.data.message);
        } catch (error) {
            notify.error("Failed to update bookmark");
        }
    };

    const isBookmarked = (id) => user?.bookmarks?.some(b => (b._id || b) === id);

    const openModal = (news = null) => {
        setEditingNews(news);
        if (news) {
            setFormData({
                title: news.title,
                content: news.content,
                category: news.category._id || news.category,
                image: news.image || "",
                video: news.video || "",
                documents: news.documents || []
            });
        } else {
            setFormData({
                title: "",
                content: "",
                category: categories.length > 0 ? categories[0]._id : "",
                image: "",
                video: "",
                documents: []
            });
        }
        setShowModal(true);
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append("image", file); // The backend expects field name 'image' even for videos/docs based on uploadRoutes
        setUploading(true);

        try {
            const res = await api.post("/upload", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            // The backend returns a string starting with /uploads/
            const fileUrl = toAbsoluteMediaUrl(res.data);

            if (type === 'document') {
                setFormData(prev => ({
                    ...prev,
                    documents: [...(prev.documents || []), { name: file.name, url: fileUrl }]
                }));
            } else {
                setFormData(prev => ({ ...prev, [type]: fileUrl }));
            }

            setUploading(false);
        } catch (error) {
            console.error("Error uploading file", error);
            setUploading(false);
            alert("Failed to upload file");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingNews) {
                await api.put(`/news/${editingNews._id}`, formData);
            } else {
                await api.post("/news", formData);
            }
            setShowModal(false);
            setEditingNews(null);
            fetchNews();
        } catch (error) {
            console.error("Error saving news", error);
        }
    };

    const confirmDelete = (article) => {
        setDeleteConfirmNews(article);
    };

    const handleDelete = async () => {
        if (!deleteConfirmNews) return;
        try {
            await api.delete(`/news/${deleteConfirmNews._id}`);
            notify.success("Article deleted successfully");
            setDeleteConfirmNews(null);
            fetchNews();
        } catch (error) {
            console.error("Error deleting news", error);
            notify.error("Failed to delete article");
            setDeleteConfirmNews(null);
        }
    };

    const DeleteConfirmModal = ({ article, onConfirm, onCancel }) => {
        if (!article) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
                <div
                    className="bg-[#0f0f1a] rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] max-w-md w-full p-8 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Warning Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-500/10 rounded-full border-2 border-red-500/30">
                            <ShieldAlert className="w-12 h-12 text-red-500" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white text-center mb-3">
                        Delete Article?
                    </h2>

                    {/* Message */}
                    <p className="text-gray-400 text-center mb-2">
                        Are you sure you want to delete this news article?
                    </p>
                    <p className="text-red-400 text-sm text-center mb-8 font-medium">
                        This action cannot be undone.
                    </p>

                    {/* Article Info Card */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-lg bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                                {article.image ? (
                                    <img src={article.image} alt="" className="w-full h-full object-cover" />
                                ) : article.video ? (
                                    <video src={article.video} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold line-clamp-2 leading-tight">{article.title}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    <span className="px-2 py-0.5 bg-white/5 rounded">{article.category?.name || 'Uncategorized'}</span>
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                    By {article.author?.name} • {new Date(article.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                        >
                            Delete Article
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderIcon = (iconName, className = "w-4 h-4") => {
        const IconComponent = iconMap[iconName] || Tag;
        return <IconComponent className={className} />;
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold glow-text text-white">News Articles</h2>
                    <p className="text-gray-400 mt-1">Manage all university news updates.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-6 py-2.5 text-black bg-[var(--primary-glow)] rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all font-bold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Article
                </button>
            </div>

            <div className="grid gap-8 mb-8 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p className="text-center col-span-full py-8 text-gray-500">Loading articles...</p>
                ) : (
                    newsList.map((news) => (
                        <div key={news._id} className="group glass-card rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all duration-300 transform hover:-translate-y-1 border border-[rgba(255,255,255,0.05)]">
                            <div className="relative h-48 bg-[#1a1a2e] overflow-hidden border-b border-[rgba(255,255,255,0.05)]">
                                {news.video ? (
                                    <video src={news.video} controls className="w-full h-full object-cover" />
                                ) : news.image ? (
                                    <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-700">
                                        <ImageIcon className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 pointer-events-none">
                                    <span className="px-3 py-1 text-xs font-bold text-black uppercase bg-[var(--primary-glow)] rounded-sm shadow-lg tracking-wider flex items-center gap-2">
                                        {news.category && renderIcon(news.category.icon, "w-3 h-3")}
                                        {news.category?.name || 'Uncategorized'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <h4 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2 leading-tight group-hover:text-[var(--primary-glow)] transition-colors">{news.title}</h4>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">{news.content}</p>

                                <div className="flex justify-between items-center pt-4 border-t border-[rgba(255,255,255,0.05)] mt-4">
                                    <div className="text-xs text-gray-500">
                                        <Link to={`/author/${news.author?._id}`} className="font-semibold text-gray-400 hover:text-(--primary-glow) transition-colors">
                                            {news.author?.name}
                                        </Link>
                                        <p>{new Date(news.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                            {news.views || 0}
                                        </div>
                                        <div className="flex items-center">
                                            <Heart className={`w-3.5 h-3.5 mr-1 ${news.likes?.length > 0 ? 'text-red-500 fill-current' : ''}`} />
                                            {news.likes?.length || 0}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleBookmark(news._id)}
                                            className={`p-2 rounded-full transition-colors ${isBookmarked(news._id) ? 'text-(--primary-glow) bg-[rgba(0,243,255,0.1)]' : 'text-gray-400 hover:text-(--primary-glow) hover:bg-[rgba(0,243,255,0.05)]'}`}
                                            title={isBookmarked(news._id) ? "Saved" : "Save for later"}
                                        >
                                            {isBookmarked(news._id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                        </button>

                                        <Link to={`/news/${news._id}`} className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-full transition-colors" title="Read Full Article">
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>

                                        {user?.role === 'admin' && (
                                            <>
                                                <button onClick={() => openModal(news)} className="p-2 text-gray-400 hover:text-[var(--primary-glow)] hover:bg-[rgba(0,243,255,0.1)] rounded-full transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => confirmDelete(news)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
                        <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                            <h3 className="text-xl font-bold text-white tracking-wide glow-text">{editingNews ? "Edit Article" : "New Article"}</h3>
                            <p className="text-sm text-gray-400 mt-1">{editingNews ? "Update existing article details." : "Share the latest news with the campus."}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Title</label>
                                <input name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg focus:ring-1 focus:ring-[var(--primary-glow)] focus:border-[var(--primary-glow)] transition-all outline-none" placeholder="Enter article title" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg focus:ring-1 focus:ring-[var(--primary-glow)] focus:border-[var(--primary-glow)] transition-all outline-none">
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id} className="bg-gray-900 text-white">{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Image (Optional)</label>
                                    <div className="relative">
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                                        <button type="button" className={`w-full px-4 py-2 text-sm border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center gap-2 ${uploading ? 'bg-[rgba(255,255,255,0.05)] text-gray-500' : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-gray-300'}`}>
                                            <ImageIcon className="w-4 h-4" />
                                            <span className="truncate">{formData.image ? 'Change' : 'Upload'}</span>
                                        </button>
                                    </div>
                                    {formData.image && <p className="text-xs text-[var(--primary-glow)] mt-1 truncate">Image uploaded</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Video (Optional)</label>
                                <div className="relative">
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'video')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="video/mp4,video/webm,video/mkv" />
                                    <button type="button" className={`w-full px-4 py-2 text-sm border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center gap-2 ${uploading ? 'bg-[rgba(255,255,255,0.05)] text-gray-500' : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-gray-300'}`}>
                                        <VideoIcon className="w-4 h-4" />
                                        <span className="truncate">{formData.video ? 'Change Video' : 'Upload Video'}</span>
                                    </button>
                                </div>
                                {formData.video && <p className="text-xs text-[var(--primary-glow)] mt-1 truncate">Video uploaded</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Content</label>
                                <textarea name="content" value={formData.content} onChange={handleInputChange} className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg focus:ring-1 focus:ring-[var(--primary-glow)] focus:border-[var(--primary-glow)] transition-all outline-none h-40 resize-none" placeholder="Write your article content here..." required />
                            </div>

                            {/* Document Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Attachments (PDF, Doc)</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e, 'document')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <button type="button" className={`w-full px-4 py-2 text-sm border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center gap-2 ${uploading ? 'bg-[rgba(255,255,255,0.05)] text-gray-500' : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-gray-300'}`}>
                                            <Upload className="w-4 h-4" />
                                            <span>Upload Document</span>
                                        </button>
                                    </div>

                                    {/* Document List */}
                                    {formData.documents && formData.documents.length > 0 && (
                                        <div className="space-y-2">
                                            {formData.documents.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-(--primary-glow) shrink-0" />
                                                        <span className="text-sm text-gray-300 truncate">{doc.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newDocs = formData.documents.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, documents: newDocs });
                                                        }}
                                                        className="text-gray-500 hover:text-red-500 p-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-transparent border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] focus:outline-none">Cancel</button>
                                <button type="submit" disabled={uploading} className="px-6 py-2.5 text-sm font-bold text-black bg-[var(--primary-glow)] rounded-lg hover:brightness-110 shadow-[0_0_10px_rgba(0,243,255,0.3)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                                    {uploading ? 'Processing...' : (editingNews ? 'Update Article' : 'Publish Article')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmNews && (
                <DeleteConfirmModal
                    article={deleteConfirmNews}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteConfirmNews(null)}
                />
            )}
        </div>
    );
};

export default News;

