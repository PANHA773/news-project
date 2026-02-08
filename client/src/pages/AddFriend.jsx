import { useEffect, useState } from "react";
import { Send, Users, RefreshCw, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";

const AddFriend = () => {
    const notify = useNotification();
    const [message, setMessage] = useState("");
    const [friends, setFriends] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [received, setReceived] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const loadFriends = async () => {
        setLoading(true);
        try {
            const res = await api.get("/users/me/friends");
            setFriends(res.data || []);
        } catch (err) {
            console.error(err);
            notify.error("Failed to load friends");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get("/add-friend");
            setAllUsers(res.data || []);
        } catch (err) {
            console.error(err);
            notify.error("Failed to load users");
        }
    };

    const loadRequests = async () => {
        try {
            const res = await api.get("/users/me/friend-requests");
            setReceived(res.data || []);
        } catch (err) {
            console.error(err);
            notify.error("Failed to load friend requests");
        }
    };

    useEffect(() => {
        loadFriends();
        loadUsers();
        loadRequests();
    }, []);

    const sendRequest = async (id) => {
        const target = (id || "").trim();
        if (!target) {
            notify.error("User ID is required");
            return;
        }
        setBusy(true);
        try {
            await api.post(`/users/${target}/request`, { message: message.trim() });
            notify.success("Friend request sent");
            setMessage("");
        } catch (err) {
            console.error(err);
            notify.error(err?.response?.data?.message || "Failed to send request");
        } finally {
            setBusy(false);
        }
    };

    const accept = async (id) => {
        setBusy(true);
        try {
            await api.post(`/users/friend-requests/${id}/accept`);
            notify.success("Friend request accepted");
            setReceived((prev) => prev.filter((x) => x._id !== id));
            await loadFriends();
        } catch (err) {
            console.error(err);
            notify.error("Failed to accept");
        } finally {
            setBusy(false);
        }
    };

    const decline = async (id) => {
        setBusy(true);
        try {
            await api.post(`/users/friend-requests/${id}/decline`);
            notify.success("Friend request declined");
            setReceived((prev) => prev.filter((x) => x._id !== id));
        } catch (err) {
            console.error(err);
            notify.error("Failed to decline");
        } finally {
            setBusy(false);
        }
    };

    const removeFriend = async (id) => {
        setBusy(true);
        try {
            await api.delete(`/users/${id}/remove-friend`);
            notify.success("Friend removed");
            setFriends((prev) => prev.filter((f) => f._id !== id));
        } catch (err) {
            console.error(err);
            notify.error("Failed to remove friend");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Add Friend</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Send a request and wait for confirmation to become friends.
                    </p>
                </div>
                <button
                    onClick={() => {
                        loadFriends();
                        loadUsers();
                        loadRequests();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3 mb-4">
                        <Send className="w-5 h-5 text-(--primary-glow)" />
                        <h3 className="text-lg font-semibold text-white">Send Request</h3>
                    </div>
                    <label className="block text-xs text-gray-400 mb-2">Message (optional)</label>
                    <textarea
                        rows="3"
                        className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white outline-none focus:border-(--primary-glow)"
                        placeholder="Say hello..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-3">
                        Pick a user below and send a request.
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-(--primary-glow)" />
                        <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
                    </div>
                    {loading ? (
                        <p className="text-gray-400">Loading...</p>
                    ) : received.length > 0 ? (
                        <div className="space-y-3">
                            {received.map((fr) => (
                                <div
                                    key={fr._id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                                            {fr.requester?.avatar ? (
                                                <img src={fr.requester.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400">No Avatar</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{fr.requester?.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-400">{fr.message}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => accept(fr._id)}
                                            disabled={busy}
                                            className="px-3 py-1.5 rounded-lg bg-(--primary-glow) text-black font-semibold hover:brightness-110 transition disabled:opacity-60"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => decline(fr._id)}
                                            disabled={busy}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No incoming requests.</p>
                    )}
                </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-(--primary-glow)" />
                    <h3 className="text-lg font-semibold text-white">All Users</h3>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white outline-none focus:border-(--primary-glow)"
                        placeholder="Search by name or email"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : allUsers.length > 0 ? (
                    <div className="space-y-3">
                        {allUsers
                            .filter((u) => {
                                const q = query.trim().toLowerCase();
                                if (!q) return true;
                                return (
                                    (u.name || "").toLowerCase().includes(q) ||
                                    (u.email || "").toLowerCase().includes(q)
                                );
                            })
                            .map((u) => (
                            <div
                                key={u._id}
                                className="flex items-center justify-between p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No Avatar</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{u.name}</div>
                                        <div className="text-xs text-gray-400">{u.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => sendRequest(u._id)}
                                        disabled={busy}
                                        className="px-3 py-1.5 rounded-lg border border-(--primary-glow)/50 text-(--primary-glow) font-semibold hover:bg-(--primary-glow)/10 transition disabled:opacity-60"
                                    >
                                        Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">No users found.</p>
                )}
            </div>

            <div className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] mt-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-(--primary-glow)" />
                    <h3 className="text-lg font-semibold text-white">My Friends</h3>
                </div>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : friends.length > 0 ? (
                    <div className="space-y-3">
                        {friends.map((f) => (
                            <div
                                key={f._id}
                                className="flex items-center justify-between p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                                        {f.avatar ? (
                                            <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No Avatar</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{f.name}</div>
                                        <div className="text-xs text-gray-400">{f.email}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFriend(f._id)}
                                    disabled={busy}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">No friends yet.</p>
                )}
            </div>
        </div>
    );
};

export default AddFriend;
