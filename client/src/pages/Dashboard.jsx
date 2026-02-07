import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { FileText, Tags, TrendingUp, Users, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MessageSquare, Heart, Bell, LogIn, LogOut, UserPlus, FilePlus, FileEdit, Trash2, Shield, UserCircle, Calendar } from "lucide-react";
import AuthContext from "../context/AuthContext";

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

const Dashboard = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [stats, setStats] = useState({ news: 0, categories: 0, totalViews: 0, activeAuthors: 0 });
    const [chartData, setChartData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(true);

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

            } catch (error) {
                console.error("Error fetching stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [currentUser]);

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
                                        <button onClick={async () => {
                                            try {
                                                await api.post(`/users/friend-requests/${fr._id}/accept`);
                                                setFriendRequests(prev => prev.filter(x => x._id !== fr._id));
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }} className="px-3 py-1 rounded bg-green-500 text-white text-sm">Accept</button>
                                        <button onClick={async () => {
                                            try {
                                                await api.post(`/users/friend-requests/${fr._id}/decline`);
                                                setFriendRequests(prev => prev.filter(x => x._id !== fr._id));
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Decline</button>
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
        </div>
    );
};

export default Dashboard;
