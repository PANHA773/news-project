import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { ArrowLeft, Clock, User, Tag, Bookmark, BookmarkCheck, Calendar, Eye, Share2, Heart, MessageCircle, Send, FileText, ExternalLink } from "lucide-react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateProfile } = useContext(AuthContext);
    const notify = useNotification();
    const [news, setNews] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await api.get(`/news/${id}`);
                setNews(data);
                const commentsRes = await api.get(`/news/${id}/comments`);
                setComments(commentsRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching article", error);
                notify.error("Article not found");
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id, notify]);

    const handleBookmark = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.put(`/users/bookmark/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedUser = { ...user, bookmarks: res.data.bookmarks };
            updateProfile(updatedUser, token);
            notify.success(res.data.message);
        } catch (error) {
            notify.error("Failed to update bookmark");
        }
    };

    const handleLike = async () => {
        if (!user) return notify.error("Please login to like articles");
        try {
            const { data } = await api.post(`/news/${id}/like`);
            setNews({ ...news, likes: data.likes });
            notify.success(news.likes?.includes(user._id) ? "Unliked article" : "Liked article");
        } catch (error) {
            notify.error("Failed to like article");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) return notify.error("Please login to comment");
        if (!commentInput.trim()) return;

        setCommentLoading(true);
        try {
            const { data } = await api.post(`/news/${id}/comments`, { content: commentInput });
            setComments([data, ...comments]);
            setCommentInput("");
            notify.success("Comment added");
        } catch (error) {
            notify.error("Failed to add comment");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        notify.success("Article link copied to clipboard!");
    };

    const isBookmarked = user?.bookmarks?.some(b => (b._id || b) === id);
    const isLiked = news?.likes?.includes(user?._id);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-(--primary-glow)"></div>
        </div>
    );

    if (!news) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Article not found</h2>
            <Link to="/news" className="text-(--primary-glow) mt-4 inline-block hover:underline">Back to News</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in px-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Feed
            </button>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-bold text-black uppercase bg-(--primary-glow) rounded-lg tracking-widest shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                        {news.category?.name}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        {news.views || 0} views
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight glow-text mb-6">
                    {news.title}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-800 border border-(--primary-glow)/30 overflow-hidden mr-4">
                            {news.author?.avatar ? (
                                <img src={news.author.avatar} alt={news.author.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-white font-bold">{news.author?.name}</p>
                            <p className="text-xs text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(news.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isLiked ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-[rgba(255,255,255,0.1)] text-gray-400 hover:bg-[rgba(255,255,255,0.05)]'}`}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="font-bold">{news.likes?.length || 0}</span>
                        </button>
                        <button
                            onClick={handleBookmark}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isBookmarked ? 'bg-(--primary-glow)/10 border-(--primary-glow) text-(--primary-glow) shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'border-[rgba(255,255,255,0.1)] text-gray-400 hover:bg-[rgba(255,255,255,0.05)]'}`}
                        >
                            {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 border border-[rgba(255,255,255,0.1)] text-gray-400 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {news.video ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden mb-10 shadow-2xl border border-[rgba(255,255,255,0.1)]">
                        <video src={news.video} controls className="w-full h-full object-cover" />
                    </div>
                ) : news.image && (
                    <div className="relative aspect-video rounded-3xl overflow-hidden mb-10 shadow-2xl border border-[rgba(255,255,255,0.1)]">
                        <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                        {news.content}
                    </p>
                </div>

                {/* Attached Documents */}
                {news.documents && news.documents.length > 0 && (
                    <div className="mt-10 mb-10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-(--primary-glow)" />
                            Attached Documents
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {news.documents.map((doc, index) => (
                                <a
                                    key={index}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-4 bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.1)] transition-all group"
                                >
                                    <div className="p-3 bg-red-500/10 rounded-lg text-red-400 mr-4 group-hover:text-red-300">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{doc.name}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">Click to download</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <section className="mt-20 border-t border-[rgba(255,255,255,0.05)] pt-12">
                <div className="flex items-center gap-3 mb-8">
                    <MessageCircle className="w-6 h-6 text-(--primary-glow)" />
                    <h3 className="text-2xl font-bold text-white">Community Comments</h3>
                    <span className="px-2.5 py-0.5 bg-gray-800 text-gray-400 text-sm font-bold rounded-full">{comments.length}</span>
                </div>

                {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-12">
                        <div className="glass-card p-4 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                            <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Share your thoughts on this story..."
                                className="w-full bg-transparent border-none text-white placeholder-gray-500 resize-none h-24 focus:ring-0 outline-none"
                            />
                            <div className="flex justify-end pt-3 border-t border-[rgba(255,255,255,0.03)]">
                                <button
                                    type="submit"
                                    disabled={commentLoading || !commentInput.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-(--primary-glow) text-black font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                    {commentLoading ? "Posting..." : "Post Comment"}
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="mb-12 p-8 text-center glass-card border-dashed border-[rgba(255,255,255,0.1)] rounded-3xl">
                        <p className="text-gray-400 mb-4">Join the conversation to share your thoughts.</p>
                        <Link to="/login" className="text-(--primary-glow) font-bold hover:underline">Sign in to Comment</Link>
                    </div>
                )}

                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-4 group animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-[rgba(255,255,255,0.1)] overflow-hidden shrink-0 shadow-lg">
                                {comment.user?.avatar ? (
                                    <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900 font-bold">
                                        {comment.user?.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="glass-card p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] group-hover:border-[rgba(255,255,255,0.1)] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-white font-bold text-sm">{comment.user?.name}</h5>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <div className="py-10 text-center">
                            <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </section>

            <footer className="mt-20 pt-10 border-t border-[rgba(255,255,255,0.05)]">
                <div className="bg-[rgba(255,255,255,0.02)] p-8 rounded-3xl border border-[rgba(255,255,255,0.05)] flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-[rgba(255,255,255,0.1)] overflow-hidden shrink-0 shadow-2xl">
                        {news.author?.avatar ? (
                            <img src={news.author.avatar} alt={news.author.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <User className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg mb-2">Written by {news.author?.name}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {news.author?.bio || "University faculty and contributor specializing in campus insights and academic excellence."}
                        </p>
                        <Link to={`/author/${news.author?._id}`} className="text-(--primary-glow) text-sm font-semibold hover:underline flex items-center gap-1 group">
                            View all articles by {news.author?.name}
                            <ArrowLeft className="w-3 h-3 rotate-180 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ArticleDetail;

