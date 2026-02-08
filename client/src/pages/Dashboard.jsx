import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { FileText, Tags, TrendingUp, Users, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MessageSquare, Heart, Bell, LogIn, LogOut, UserPlus, FilePlus, FileEdit, Trash2, Shield, UserCircle, Calendar } from "lucide-react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 5) return "just now";
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5000${url}`;
};

const Dashboard = () => {
    const { user: currentUser } = useContext(AuthContext);
    const notify = useNotification();
    const [stats, setStats] = useState({ news: 0, categories: 0, totalViews: 0, activeAuthors: 0 });
    const [chartData, setChartData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [stories, setStories] = useState([]);
    const [storyFile, setStoryFile] = useState(null);
    const [storyCaption, setStoryCaption] = useState("");
    const [storyUploading, setStoryUploading] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [friendBusyId, setFriendBusyId] = useState(null);

    const actionIcons = {
        LOGIN: <LogIn className="w-4 h-4 text-green-400" />,
        REGISTER: <UserPlus className="w-4 h-4 text-blue-400" />,
        LOGOUT: <LogOut className="w-4 h-4 text-gray-400" />,
        CREATE_NEWS: <FilePlus className="w-4 h-4 text-purple-400" />,
        UPDATE_NEWS: <FileEdit className="w-4 h-4 text-orange-400" />,
        DELETE_NEWS: <Trash2 className="w-4 h-4 text-red-400" />,
        UPDATE_ROLE: <Shield className="w-4 h-4 text-yellow-400" />,
        DELETE_USER: <Trash2 className="w-4 h-4 text-red-600" />,
        UPDATE_PROFILE: <UserCircle className="w-4 h-4 text-indigo-400" />,
        ADD_BOOKMARK: <Calendar className="w-4 h-4 text-pink-400" />,
        REMOVE_BOOKMARK: <Calendar className="w-4 h-4 text-gray-500" />
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const promises = [
                    api.get("/news"),
                    api.get("/categories"),
                    api.get("/notifications")
                ];

                if (currentUser?.role === 'admin') {
                    promises.push(api.get("/activities", { params: { limit: 5 } }));
                }

                const [newsRes, categoriesRes, notificationsRes, activitiesRes] = await Promise.all(promises);

                const articles = newsRes.data;
                const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);

                // Active Authors (unique authors who have published at least one article)
                const authorIds = articles.map(article => article.author?._id || article.author);
                const uniqueAuthors = new Set(authorIds.filter(id => id)).size;

                setStats({
                    news: articles.length,
                    categories: categoriesRes.data.length,
                    totalViews,
                    activeAuthors: uniqueAuthors
                });

                // Process data for chart
                const categoryCounts = {};
                articles.forEach(article => {
                    const catName = article.category?.name || 'Uncategorized';
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
                });

                const data = Object.keys(categoryCounts).map(name => ({
                    name,
                    articles: categoryCounts[name]
                }));

                setChartData(data);
                setNotifications(notificationsRes.data.slice(0, 5));
                if (activitiesRes) {
                    setRecentActivities(activitiesRes.data.logs);
                }

                // fetch incoming friend requests for dashboard
                try {
                    const frRes = await api.get('/users/me/friend-requests');
                    setFriendRequests(frRes.data || []);
                } catch (e) {
                    // ignore if unauthenticated or endpoint fails
                }

                try {
                    const fRes = await api.get('/users/me/friends');
                    setFriends(fRes.data || []);
                } catch (e) {
                    // ignore if unauthenticated or endpoint fails
                }

                try {
                    const sRes = await api.get('/stories');
                    setStories(sRes.data || []);
                } catch (e) {
                    // ignore if endpoint fails
                }

            } catch (error) {
                console.error("Error fetching stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [currentUser]);

    const uploadStoryImage = async (file) => {
        const data = new FormData();
        data.append("image", file);
        const res = await api.post("/upload", data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    };

    const createStory = async () => {
        if (!storyFile) {
            notify.error("Please select an image");
            return;
        }
        setStoryUploading(true);
        try {
            const imageUrl = await uploadStoryImage(storyFile);
            const res = await api.post("/stories", { image: imageUrl, caption: storyCaption });
            setStories((prev) => [res.data, ...prev]);
            setStoryFile(null);
            setStoryCaption("");
            notify.success("Story posted");
        } catch (error) {
            console.error("Create story error", error);
            notify.error("Failed to post story");
        } finally {
            setStoryUploading(false);
        }
    };

    const removeStory = async (id) => {
        try {
            await api.delete(`/stories/${id}`);
            setStories((prev) => prev.filter((s) => s._id !== id));
            if (selectedStory && selectedStory._id === id) setSelectedStory(null);
            notify.success("Story removed");
        } catch (error) {
            console.error("Remove story error", error);
            notify.error("Failed to remove story");
        }
    };

    const acceptFriendRequest = async (id) => {
        setFriendBusyId(id);
        try {
            await api.post(`/users/friend-requests/${id}/accept`);
            setFriendRequests((prev) => prev.filter((x) => x._id !== id));
            const fRes = await api.get("/users/me/friends");
            setFriends(fRes.data || []);
            notify.success("Friend request accepted");
        } catch (err) {
            console.error("Accept friend request error", err);
            notify.error(err?.response?.data?.message || "Failed to accept request");
        } finally {
            setFriendBusyId(null);
        }
    };

    const declineFriendRequest = async (id) => {
        setFriendBusyId(id);
        try {
            await api.post(`/users/friend-requests/${id}/decline`);
            setFriendRequests((prev) => prev.filter((x) => x._id !== id));
            notify.success("Friend request declined");
        } catch (err) {
            console.error("Decline friend request error", err);
            notify.error(err?.response?.data?.message || "Failed to decline request");
        } finally {
            setFriendBusyId(null);
        }
    };

    const Card = ({ icon: Icon, title, value, glowColor }) => (
        <div className={`relative overflow-hidden glass-card rounded-xl p-6 glow-border group`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4 text-white" />
            </div>
            <div className="flex items-center">
                <div className={`p-3 rounded-xl bg-[var(--bg-dark)] border border-[rgba(255,255,255,0.1)] relative overflow-hidden group-hover:glow-box transition-all`}>
                    <div className={`absolute inset-0 opacity-20 bg-${glowColor}`}></div>
                    <Icon className={`w-6 h-6 text-${glowColor} relative z-10`} style={{ color: glowColor }} />
                </div>
                <div className="ml-5">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-3xl font-bold mt-1 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]">{value}</h3>
                </div>
            </div>
        </div>
    );

    const chartColors = ['#00f3ff', '#bc13fe', '#00ff9d', '#ff0055', '#ffff00'];

    const formatAction = (action) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight glow-text text-white">Dashboard Overview</h2>
            <p className="text-gray-400 mt-2">Welcome back, here's what's happening today.</p>

            <div className="mt-8 glass-card p-6 rounded-xl border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between gap-6 mb-4">
                    <h3 className="text-xl font-bold text-gray-100">Stories</h3>
                    <div className="text-xs text-gray-400">Images expire in 24 hours</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <label className="block text-xs text-gray-400 mb-2">Create Story</label>
                        <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setStoryFile(e.target.files?.[0] || null)}
                                className="block w-full text-xs text-gray-300"
                            />
                            <textarea
                                rows="2"
                                placeholder="Caption (optional)"
                                value={storyCaption}
                                onChange={(e) => setStoryCaption(e.target.value)}
                                className="mt-3 w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white text-sm outline-none focus:border-(--primary-glow)"
                            />
                            <button
                                onClick={createStory}
                                disabled={storyUploading}
                                className="mt-3 w-full px-3 py-2 rounded-lg bg-(--primary-glow) text-black font-semibold hover:brightness-110 transition disabled:opacity-60"
                            >
                                {storyUploading ? "Posting..." : "Post Story"}
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        {stories.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {stories.map((story) => (
                                    <button
                                        key={story._id}
                                        onClick={() => setSelectedStory(story)}
                                        className="min-w-[160px] h-44 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] relative group"
                                    >
                                        <img src={resolveMediaUrl(story.image)} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                                {story.user?.avatar ? (
                                                    <img src={resolveMediaUrl(story.user.avatar)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-[rgba(255,255,255,0.1)]" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs text-white font-semibold truncate">{story.user?.name}</div>
                                                <div className="text-[10px] text-gray-300">{timeAgo(story.createdAt)}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="h-44 flex items-center justify-center text-gray-500 text-sm">
                                No stories yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    icon={FileText}
                    title="Total Articles"
                    value={stats.news}
                    glowColor="#00f3ff"
                />
                <Card
                    icon={Tags}
                    title="Categories"
                    value={stats.categories}
                    glowColor="#bc13fe"
                />
                <Card
                    icon={TrendingUp}
                    title="Total Views"
                    value={stats.totalViews.toLocaleString()}
                    glowColor="#00ff9d"
                />
                <Card
                    icon={Users}
                    title="Active Authors"
                    value={stats.activeAuthors}
                    glowColor="#ff0055"
                />
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-xl relative overflow-hidden">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">Articles per Category</h3>
                    <div className="h-80 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#101020', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: '0 0 15px rgba(0,0,0,0.5)', color: '#fff' }}
                                    />
                                    <Bar dataKey="articles" radius={[4, 4, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke="rgba(255,255,255,0.2)" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                {loading ? 'Loading chart data...' : 'No data available for chart'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
                        {currentUser?.role === 'admin' ? 'Recent User Activity' : 'Recent Notifications'}
                    </h3>
                    <div className="space-y-4">
                        {currentUser?.role === 'admin' ? (
                            recentActivities.length > 0 ? (
                                recentActivities.map((log) => (
                                    <div
                                        key={log._id}
                                        onClick={() => setSelectedActivity(log)}
                                        className="flex items-start p-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 group"
                                    >
                                        <div className="mt-1 mr-4">
                                            {actionIcons[log.action] || <Activity className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                                <span className="text-(--primary-glow) font-bold">{log.user?.name}</span>
                                                {' '}performed{' '}
                                                <span className="text-gray-100 uppercase text-xs font-black">{formatAction(log.action)}</span>
                                            </p>
                                            <p className="text-xs text-gray-500">{timeAgo(log.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-sm">{loading ? 'Loading activities...' : 'No recent activity found.'}</p>
                                </div>
                            )
                        ) : (
                            notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div key={notification._id} className="flex items-start p-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 group">
                                        <div className="mt-1 mr-4">
                                            {notification.type === 'like' ? (
                                                <Heart className="w-4 h-4 text-pink-500" />
                                            ) : notification.type === 'comment' ? (
                                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                            ) : (
                                                <Bell className="w-4 h-4 text-yellow-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500">{timeAgo(notification.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-sm">{loading ? 'Loading notifications...' : 'No recent activity found.'}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
                
                {/* Friend Requests Panel */}
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">Friend Requests</h3>
                    <div className="space-y-4">
                        {friendRequests.length > 0 ? (
                            friendRequests.map(fr => (
                                <div key={fr._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)]">
                                    <div className="flex items-center gap-3">
                                        <img src={fr.requester.avatar || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{fr.requester.name}</p>
                                            <p className="text-xs text-gray-400">{fr.message || 'Wants to be your friend'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => acceptFriendRequest(fr._id)}
                                            disabled={friendBusyId === fr._id}
                                            className="px-3 py-1 rounded bg-green-500 text-white text-sm disabled:opacity-60"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => declineFriendRequest(fr._id)}
                                            disabled={friendBusyId === fr._id}
                                            className="px-3 py-1 rounded bg-red-600 text-white text-sm disabled:opacity-60"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">No pending friend requests</div>
                        )}
                    </div>
                </div>

                {/* Friends Panel */}
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">Your Friends</h3>
                    <div className="space-y-4">
                        {friends.length > 0 ? (
                            friends.map(fr => (
                                <div key={fr._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)]">
                                    <div className="flex items-center gap-3">
                                        <img src={fr.avatar || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{fr.name}</p>
                                            <p className="text-xs text-gray-400">{fr.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={`/chat`} className="px-3 py-1 rounded bg-(--primary-glow) text-black text-sm">Chat</a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">You have no friends yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Detail Overlay */}
            {selectedActivity && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 animate-scale-in relative">
                        <button
                            onClick={() => setSelectedActivity(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <UserPlus className="w-5 h-5 rotate-45" />
                        </button>
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-(--primary-glow)" />
                            Activity Details
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">User</p>
                                <p className="text-white font-medium">{selectedActivity.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Action</p>
                                <p className="text-white font-medium">{selectedActivity.action}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Timestamp</p>
                                <p className="text-white font-medium">{new Date(selectedActivity.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">User Agent</p>
                                <p className="text-gray-400 text-xs break-all">{selectedActivity.userAgent}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">IP Address</p>
                                <p className="text-gray-400 text-sm font-mono">{selectedActivity.ip}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Details Data</p>
                                <pre className="bg-black/50 p-3 rounded-lg text-xs text-green-400 font-mono overflow-x-auto">
                                    {JSON.stringify(selectedActivity.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Viewer */}
            {selectedStory && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in">
                    <div className="bg-[#0f0f1a] rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="relative">
                            <img src={resolveMediaUrl(selectedStory.image)} alt="" className="w-full max-h-[70vh] object-cover" />
                            <button
                                onClick={() => setSelectedStory(null)}
                                className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-xs"
                            >
                                Close
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-white">{selectedStory.user?.name}</div>
                                <div className="text-xs text-gray-400">{selectedStory.caption || "No caption"}</div>
                            </div>
                            {selectedStory.user?._id === currentUser?._id && (
                                <button
                                    onClick={() => removeStory(selectedStory._id)}
                                    className="px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
