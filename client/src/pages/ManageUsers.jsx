import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";
import { toAbsoluteMediaUrl } from "../config/urls";
import { Users, Trash2, Shield, ShieldAlert, Search, Mail, Calendar, UserCheck, PieChart as PieChartIcon, Activity, TrendingUp, Eye, X, Info, User as UserIcon, UserPlus, Check, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const ManageUsers = () => {
    const notify = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

    const PERMISSIONS = [
        { id: 'manage_news', label: 'Manage News', icon: <TrendingUp className="w-3 h-3" /> },
        { id: 'manage_users', label: 'Manage Users', icon: <Users className="w-3 h-3" /> },
        { id: 'view_logs', label: 'View Logs', icon: <Activity className="w-3 h-3" /> },
        { id: 'manage_chat', label: 'Manage Chat', icon: <Shield className="w-3 h-3" /> },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/users");
            setUsers(data);
        } catch (error) {
            notify.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (user) => {
        setDeleteConfirmUser(user);
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirmUser) return;
        try {
            await api.delete(`/users/${deleteConfirmUser._id}`);
            setUsers(users.filter(user => user._id !== deleteConfirmUser._id));
            notify.success("User removed successfully");
            setDeleteConfirmUser(null);
        } catch (error) {
            notify.error(error.response?.data?.message || "Failed to delete user");
            setDeleteConfirmUser(null);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            const { data } = await api.put(`/users/${id}/role`, { role: newRole });
            setUsers(users.map(user => user._id === id ? data : user));
            notify.success(`User role updated to ${newRole}`);
        } catch (error) {
            notify.error("Failed to update role");
        }
    };

    const handlePermissionToggle = async (id, permission) => {
        const user = users.find(u => u._id === id);
        const newPermissions = user.permissions?.includes(permission)
            ? user.permissions.filter(p => p !== permission)
            : [...(user.permissions || []), permission];

        try {
            const { data } = await api.put(`/users/${id}/permissions`, { permissions: newPermissions });
            setUsers(users.map(u => u._id === id ? data : u));
            if (selectedUser?._id === id) setSelectedUser(data);
            notify.success("Permissions updated");
        } catch (error) {
            notify.error("Failed to update permissions");
        }
    };

    const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
        if (!user) return null;

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
                        Delete User?
                    </h2>

                    {/* Message */}
                    <p className="text-gray-400 text-center mb-2">
                        Are you sure you want to delete <span className="text-white font-bold">{user.name}</span>?
                    </p>
                    <p className="text-red-400 text-sm text-center mb-8 font-medium">
                        This action cannot be undone.
                    </p>

                    {/* User Info Card */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                        {user.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate">{user.name}</p>
                                <p className="text-gray-500 text-sm truncate">{user.email}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    <span className="px-2 py-0.5 bg-white/5 rounded">{user.role}</span>
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
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const UserDetailModal = ({ user, onClose }) => {
        const [userActivity, setUserActivity] = useState([]);
        const [loadingActivity, setLoadingActivity] = useState(false);
        const [selectedActivity, setSelectedActivity] = useState(null);

        useEffect(() => {
            if (user) {
                fetchUserActivity();
            }
        }, [user]);

        const fetchUserActivity = async () => {
            try {
                setLoadingActivity(true);
                const { data } = await api.get(`/activities/user/${user._id}`);
                setUserActivity(data.logs);
            } catch (error) {
                console.error("Failed to fetch user activity", error);
            } finally {
                setLoadingActivity(false);
            }
        };

        if (!user) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="glass-card w-full max-w-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="relative p-8">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1 space-y-6">
                                <div className="w-full aspect-square rounded-3xl bg-gray-800 border-4 border-(--primary-glow)/20 overflow-hidden shrink-0 shadow-lg">
                                    {user.avatar ? (
                                        <img src={toAbsoluteMediaUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl text-(--primary-glow) font-black bg-gradient-to-br from-gray-800 to-black uppercase">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Info className="w-3 h-3" />
                                            Biography
                                        </p>
                                        <p className="text-gray-300 text-sm leading-relaxed italic">
                                            {user.bio || "No biography provided."}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined On</p>
                                        <p className="text-sm text-white font-bold flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-orange-400" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-3xl font-black text-white leading-tight">{user.name}</h2>
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${user.role === 'admin'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 font-medium flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-(--primary-glow)" />
                                        {user.email}
                                    </p>
                                </div>

                                {/* Permissions Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-(--primary-glow)" />
                                        Access Permissions
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {PERMISSIONS.map(perm => (
                                            <button
                                                key={perm.id}
                                                disabled={user.role === 'admin'}
                                                onClick={() => handlePermissionToggle(user._id, perm.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${user.role === 'admin'
                                                    ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                                    : user.permissions?.includes(perm.id)
                                                        ? 'bg-(--primary-glow)/10 border-(--primary-glow)/30 text-white'
                                                        : 'bg-white/2 border-white/5 text-gray-500 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={user.permissions?.includes(perm.id) ? 'text-(--primary-glow)' : ''}>
                                                        {perm.icon}
                                                    </span>
                                                    <span className="text-[11px] font-black uppercase tracking-tight">{perm.label}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${user.permissions?.includes(perm.id) || user.role === 'admin'
                                                    ? 'bg-(--primary-glow) border-(--primary-glow)'
                                                    : 'border-white/20'
                                                    }`}>
                                                    {(user.permissions?.includes(perm.id) || user.role === 'admin') && <Check className="w-2.5 h-2.5 text-black" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {user.role === 'admin' && (
                                        <p className="text-[10px] text-gray-500 italic mt-1 font-medium">
                                            * Administrators have all permissions by default.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-(--primary-glow)" />
                                        Recent Activity
                                    </h3>

                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {loadingActivity ? (
                                            <div className="py-10 flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-(--primary-glow)"></div>
                                            </div>
                                        ) : userActivity.length > 0 ? (
                                            userActivity.map((log) => (
                                                <div
                                                    key={log._id}
                                                    onClick={() => setSelectedActivity(log)}
                                                    className="p-3 bg-white/2 rounded-xl border border-white/5 space-y-1 hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-(--primary-glow) tracking-widest uppercase">
                                                            {log.action.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 font-medium">
                                                        {log.action === 'CREATE_NEWS' ? `Published: ${log.details.title}` :
                                                            log.action === 'UPDATE_ROLE' ? `Role changed to: ${log.details.newRole}` :
                                                                log.action === 'UPDATE_PROFILE' ? 'Updated profile details' :
                                                                    log.action === 'LOGIN' ? 'Logged in to system' :
                                                                        log.action === 'ADD_BOOKMARK' ? 'Bookmarked an article' :
                                                                            `Performed ${log.action}`}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center text-gray-500 text-xs italic">
                                                No recent activity recorded for this user.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Detail Overlay */}
                {selectedActivity && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
                        <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 animate-scale-in relative">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-(--primary-glow)" />
                                Activity Details
                            </h4>
                            <div className="space-y-4">
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

    const CreateAdminModal = ({ onClose }) => {
        const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user", permissions: [] });
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
                await api.post("/users/admin", formData);
                fetchUsers();
                notify.success("Admin/Staff account created");
                onClose();
            } catch (error) {
                notify.error(error.response?.data?.message || "Failed to create account");
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="glass-card w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in">
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-(--primary-glow)" />
                                Create Admin/Staff
                            </h2>
                            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-(--primary-glow) outline-none text-white text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-(--primary-glow) outline-none text-white text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase">Secure Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-(--primary-glow) outline-none text-white text-sm"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase">Initial Role</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="hidden"
                                            name="role"
                                            checked={formData.role === 'admin'}
                                            onChange={() => setFormData({ ...formData, role: 'admin', permissions: [] })}
                                        />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'admin' ? 'border-red-500 bg-red-500' : 'border-white/20'}`}>
                                            {formData.role === 'admin' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className={`text-xs font-bold ${formData.role === 'admin' ? 'text-red-500' : 'text-gray-500 italic'}`}>Full Admin</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="hidden"
                                            name="role"
                                            checked={formData.role === 'user'}
                                            onChange={() => setFormData({ ...formData, role: 'user' })}
                                        />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'user' ? 'border-blue-500 bg-blue-500' : 'border-white/20'}`}>
                                            {formData.role === 'user' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className={`text-xs font-bold ${formData.role === 'user' ? 'text-blue-500' : 'text-gray-500 italic'}`}>Staff/Operator</span>
                                    </label>
                                </div>
                            </div>

                            {formData.role === 'user' && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Assigned Permissions
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PERMISSIONS.map(perm => (
                                            <button
                                                key={perm.id}
                                                type="button"
                                                onClick={() => {
                                                    const newPerms = formData.permissions.includes(perm.id)
                                                        ? formData.permissions.filter(p => p !== perm.id)
                                                        : [...formData.permissions, perm.id];
                                                    setFormData({ ...formData, permissions: newPerms });
                                                }}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${formData.permissions.includes(perm.id)
                                                    ? 'bg-(--primary-glow)/10 border-(--primary-glow)/30 text-white'
                                                    : 'bg-white/2 border-white/5 text-gray-500 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${formData.permissions.includes(perm.id) ? 'bg-(--primary-glow) border-(--primary-glow)' : 'border-white/20'}`}>
                                                    {formData.permissions.includes(perm.id) && <Check className="w-2 h-2 text-black" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-tight">{perm.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-(--primary-glow) hover:brightness-110 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] disabled:opacity-50"
                            >
                                {submitting ? "Processing..." : "Register Staff Account"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // Analytics Data
    const genderStats = [
        { name: 'Male', value: users.filter(u => u.gender === 'Male').length },
        { name: 'Female', value: users.filter(u => u.gender === 'Female').length },
        { name: 'Other', value: users.filter(u => u.gender === 'Other').length },
    ].filter(item => item.value > 0);

    const COLORS = ['#00f3ff', '#ff00c1', '#7d40ff'];

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-(--primary-glow)"></div></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6" id="manage-users-header">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-4">
                        User Management
                        <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-black uppercase tracking-tighter">Admin Only</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl">Oversee all registered members, manage granular permissions, and create administrative staff accounts.</p>
                </div>
                <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-(--primary-glow) text-black rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] whitespace-nowrap"
                >
                    <UserPlus className="w-4 h-4" />
                    Create Staff
                </button>
            </header>

            {/* Demographics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2 glass-card rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-full flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <PieChartIcon className="w-6 h-6 text-(--primary-glow)" />
                            <h3 className="text-xl font-bold text-white">Gender Distribution</h3>
                        </div>
                        <div className="flex gap-4">
                            {genderStats.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-xs text-gray-400 font-medium">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {genderStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 15, 26, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card rounded-3xl p-6 border border-white/5 bg-(--primary-glow)/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-black rounded-2xl border border-white/5">
                                <Users className="w-6 h-6 text-(--primary-glow)" />
                            </div>
                            <div>
                                <h4 className="text-gray-400 text-sm font-semibold">Total Members</h4>
                                <div className="text-3xl font-black text-white">{users.length}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
                            <TrendingUp className="w-3 h-3" />
                            <span>Healthy Community</span>
                        </div>
                    </div>

                    <div className="glass-card rounded-3xl p-6 border border-white/5">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2 underline underline-offset-8 decoration-(--primary-glow)">
                            <Activity className="w-4 h-4 text-(--primary-glow)" />
                            Quick Stats
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Administrators</span>
                                <span className="text-white font-bold">{users.filter(u => u.role === 'admin').length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Regular Users</span>
                                <span className="text-white font-bold">{users.filter(u => u.role === 'user').length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Joined this Month</span>
                                <span className="text-white font-bold">{users.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-2xl border border-[rgba(255,255,255,0.05)] overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[rgba(255,255,255,0.02)]">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">User</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Gender</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Role</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Joined</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[rgba(255,255,255,0.1)] overflow-hidden shrink-0">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold group-hover:text-(--primary-glow) transition-colors">{user.name}</div>
                                                <div className="text-gray-500 text-sm flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold ${user.gender === 'Male' ? 'text-blue-400' : user.gender === 'Female' ? 'text-pink-400' : 'text-gray-400'}`}>
                                            {user.gender || 'Other'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.role === 'admin' ? (
                                                <span className="flex items-center px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                                    ADMIN
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-full border border-blue-500/20">
                                                        USER
                                                    </span>
                                                    {user.permissions?.length > 0 && (
                                                        <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full font-black">
                                                            {user.permissions.length} PERMS
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(user)}
                                                className="p-2 text-gray-500 hover:text-(--primary-glow) transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            {user.role === 'user' ? (
                                                <button
                                                    onClick={() => handleRoleChange(user._id, 'admin')}
                                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Promote to Admin"
                                                >
                                                    <Shield className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRoleChange(user._id, 'user')}
                                                    className="p-2 text-red-500 hover:text-white transition-colors"
                                                    title="Demote to User"
                                                >
                                                    <ShieldAlert className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteConfirmUser && (
                <DeleteConfirmModal
                    user={deleteConfirmUser}
                    onConfirm={handleDeleteUser}
                    onCancel={() => setDeleteConfirmUser(null)}
                />
            )}

            {
                isAdminModalOpen && (
                    <CreateAdminModal
                        onClose={() => setIsAdminModalOpen(false)}
                    />
                )
            }

            {isModalOpen && selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div >
    );
};

export default ManageUsers;

