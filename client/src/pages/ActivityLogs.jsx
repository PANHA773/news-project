import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";
import {
    Clock,
    User,
    Activity,
    Search,
    Filter,
    LogIn,
    LogOut,
    UserPlus,
    FilePlus,
    FileEdit,
    Trash2,
    Shield,
    UserCircle,
    Calendar,
    Globe,
    Cpu,
    ExternalLink
} from "lucide-react";

const ActivityLogs = () => {
    const { notify } = useNotification();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const limit = 20;

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
        fetchLogs();
    }, [skip, filterAction]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/activities`, {
                params: {
                    limit,
                    skip,
                    action: filterAction || undefined
                }
            });
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            notify.error("Failed to fetch activity logs");
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ');
    };

    const renderDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return null;

        return (
            <div className="mt-2 p-2 bg-black/30 rounded-lg text-[10px] font-mono text-gray-400 overflow-x-auto">
                {JSON.stringify(details, null, 2)}
            </div>
        );
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-(--primary-glow)/10 rounded-2xl border border-(--primary-glow)/20">
                        <Activity className="w-8 h-8 text-(--primary-glow)" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">System Activity Logs</h1>
                        <p className="text-gray-400 text-lg">Monitor user actions and system events in real-time.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-card rounded-3xl p-6 border border-white/5 md:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by user or action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 border border-white/5">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                            value={filterAction}
                            onChange={(e) => {
                                setFilterAction(e.target.value);
                                setSkip(0);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all appearance-none"
                        >
                            <option value="">All Actions</option>
                            {Object.keys(actionIcons).map(action => (
                                <option key={action} value={action}>{formatAction(action)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Logs</div>
                    <div className="text-2xl font-black text-white">{total}</div>
                </div>
            </div>

            <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/2">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">User</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Action</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Platform Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-(--primary-glow) mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-gray-500 font-medium">
                                        No activity logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-gray-500 text-[10px] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                                                    {log.user?.avatar ? (
                                                        <img src={log.user.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                                            {log.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-semibold text-sm group-hover:text-(--primary-glow) transition-colors">{log.user?.name || 'Unknown'}</span>
                                                    <span className="text-gray-500 text-[10px]">{log.user?.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {actionIcons[log.action] || <Activity className="w-4 h-4 text-gray-400" />}
                                                    <span className="text-xs font-black text-gray-300 uppercase tracking-wider">
                                                        {formatAction(log.action)}
                                                    </span>
                                                </div>
                                                {renderDetails(log.details)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <Globe className="w-3 h-3 text-blue-400/50" />
                                                    <span className="font-mono">{log.ipAddress || '0.0.0.0'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 max-w-[200px] truncate">
                                                    <Cpu className="w-3 h-3 text-green-400/50" />
                                                    <span className="truncate" title={log.userAgent}>{log.userAgent || 'Unknown Agent'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {total > limit && (
                    <div className="p-6 border-t border-white/5 flex items-center justify-between">
                        <button
                            onClick={() => setSkip(Math.max(0, skip - limit))}
                            disabled={skip === 0}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all"
                        >
                            Previous
                        </button>
                        <span className="text-gray-500 text-xs font-medium">
                            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
                        </span>
                        <button
                            onClick={() => setSkip(skip + limit)}
                            disabled={skip + limit >= total}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
