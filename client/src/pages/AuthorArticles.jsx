import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { User, Clock, Image as ImageIcon, ExternalLink, ArrowLeft } from "lucide-react";

const AuthorArticles = () => {
    const { id } = useParams();
    const { user: currentUser } = useContext(AuthContext);
    const notify = useNotification();

    const [author, setAuthor] = useState(null);
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        const fetchAuthorData = async () => {
            try {
                // Fetch public author profile
                const authorRes = await api.get(`/users/${id}`);
                setAuthor(authorRes.data);

                // Fetch news articles by this author
                const newsRes = await api.get(`/news?author=${id}`);
                setNewsList(newsRes.data);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching author data", error);
                setLoading(false);
            }
        };
        fetchAuthorData();

        // Check friendship / request status if logged in
        const fetchRelation = async () => {
            if (!localStorage.getItem("token")) return;
            try {
                const [friendsRes, sentRes] = await Promise.all([
                    api.get('/users/me/friends'),
                    api.get('/users/me/friend-requests/sent')
                ]);
                const friends = friendsRes.data || [];
                setIsFriend(friends.some(f => f._id === id));

                const sent = sentRes.data || [];
                setRequestSent(sent.some(r => r.recipient && (r.recipient._id === id || r.recipient === id)));
            } catch (err) {
                // ignore
            }
        };
        fetchRelation();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-(--primary-glow)"></div>
        </div>
    );

    if (!author) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Author not found</h2>
            <Link to="/news" className="text-(--primary-glow) mt-4 inline-block hover:underline">Back to News</Link>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
            <Link to="/news" className="flex items-center text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Feed
            </Link>

            {/* Author Header Profile */}
            <header className="glass-card p-10 rounded-4xl border border-[rgba(255,255,255,0.05)] relative overflow-hidden bg-linear-to-br from-[rgba(0,243,255,0.05)] to-transparent">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-3xl bg-gray-800 border-2 border-(--primary-glow)/30 overflow-hidden shadow-2xl">
                        {author.avatar ? (
                            <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <User className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-none glow-text">{author.name}</h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl italic">
                            {author.bio || "This author hasn't shared a bio yet, but they contribute regularly to PSBU-News."}
                        </p>
                        <div className="flex flex-wrap items-center gap-6 mt-6">
                            <div className="px-4 py-2 bg-[rgba(0,243,255,0.1)] rounded-xl border border-(--primary-glow)/20">
                                <span className="text-gray-400 text-sm">Total Articles:</span>
                                <span className="text-(--primary-glow) text-lg font-bold ml-2">{newsList.length}</span>
                            </div>
                            {currentUser && currentUser._id !== id && (
                                <div>
                                    {!isFriend ? (
                                        <>
                                            {requestSent ? (
                                                <button className="px-4 py-2 bg-gray-600 text-white rounded-xl" disabled>Request Sent</button>
                                            ) : (
                                                <button onClick={async () => {
                                                    try {
                                                        await api.post(`/users/${id}/request`, { message: `Hi, I'm ${currentUser.name}.` });
                                                        setRequestSent(true);
                                                        notify.success('Friend request sent');
                                                    } catch (err) {
                                                        console.error(err);
                                                        notify.error(err.response?.data?.message || 'Failed to send request');
                                                    }
                                                }} className="px-4 py-2 bg-(--primary-glow) text-black rounded-xl">Add Friend</button>
                                            )}
                                        </>
                                    ) : (
                                        <button onClick={async () => {
                                            try {
                                                await api.delete(`/users/${id}/remove-friend`);
                                                setIsFriend(false);
                                                notify.success('Friend removed');
                                            } catch (err) {
                                                console.error(err);
                                                notify.error('Failed to remove friend');
                                            }
                                        }} className="px-4 py-2 bg-red-600 text-white rounded-xl">Unfriend</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-(--primary-glow)/5 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-(--secondary-glow)/5 rounded-full blur-[100px]"></div>
            </header>

            {/* Articles List */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        Articles by {author.name}
                        <div className="h-px w-20 bg-linear-to-r from-(--primary-glow) to-transparent opacity-30"></div>
                    </h2>
                </div>

                {newsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsList.map((news) => (
                            <div key={news._id} className="group glass-card rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] transition-all duration-500 border border-[rgba(255,255,255,0.05)] flex flex-col">
                                <div className="relative h-56 bg-[#0a0a0f] overflow-hidden">
                                    {news.image ? (
                                        <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : news.video ? (
                                        <img src={news.video} alt={news.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-800">
                                            <ImageIcon className="w-16 h-16 opacity-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 text-[10px] font-bold text-black uppercase bg-(--primary-glow) rounded-sm tracking-widest shadow-lg">
                                            {news.category?.name || 'News'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-(--primary-glow) transition-colors">{news.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">{news.content}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.05)]">
                                        <span className="text-xs text-gray-500 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {new Date(news.createdAt).toLocaleDateString()}
                                        </span>
                                        <Link to={`/news/${news._id}`} className="flex items-center gap-2 text-(--primary-glow) text-xs font-bold hover:underline group/link">
                                            Read More
                                            <ExternalLink className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] rounded-4xl border border-dashed border-[rgba(255,255,255,0.1)]">
                        <p className="text-gray-500">This author hasn't published any articles yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthorArticles;
