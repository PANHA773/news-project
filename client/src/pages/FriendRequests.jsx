import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";

const FriendRequests = () => {
    const { user } = useContext(AuthContext);
    const notify = useNotification();
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [rRes, sRes] = await Promise.all([
                api.get('/users/me/friend-requests'),
                api.get('/users/me/friend-requests/sent')
            ]);
            setReceived(rRes.data || []);
            setSent(sRes.data || []);
        } catch (err) {
            console.error(err);
            notify.error('Failed to load friend requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const accept = async (id) => {
        try {
            await api.post(`/users/friend-requests/${id}/accept`);
            notify.success('Friend request accepted');
            setReceived(prev => prev.filter(x => x._id !== id));
        } catch (err) {
            console.error(err);
            notify.error('Failed to accept');
        }
    };

    const decline = async (id) => {
        try {
            await api.post(`/users/friend-requests/${id}/decline`);
            notify.success('Friend request declined');
            setReceived(prev => prev.filter(x => x._id !== id));
        } catch (err) {
            console.error(err);
            notify.error('Failed to decline');
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Friend Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-200 mb-3">Received</h3>
                    {loading ? <p className="text-gray-400">Loading...</p> : (
                        received.length > 0 ? received.map(fr => (
                            <div key={fr._id} className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.04)]">
                                <div>
                                    <div className="text-white font-medium">{fr.requester?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">{fr.message}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => accept(fr._id)} className="px-3 py-1 bg-green-500 text-black rounded">Accept</button>
                                    <button onClick={() => decline(fr._id)} className="px-3 py-1 bg-red-600 text-white rounded">Decline</button>
                                </div>
                            </div>
                        )) : <p className="text-gray-400">No incoming requests</p>
                    )}
                </div>

                <div className="glass-card p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-200 mb-3">Sent</h3>
                    {loading ? <p className="text-gray-400">Loading...</p> : (
                        sent.length > 0 ? sent.map(fr => (
                            <div key={fr._id} className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.04)]">
                                <div>
                                    <div className="text-white font-medium">{fr.recipient?.name || fr.recipient}</div>
                                    <div className="text-xs text-gray-400">{fr.message}</div>
                                </div>
                                <div className="text-xs text-gray-400">{fr.status}</div>
                            </div>
                        )) : <p className="text-gray-400">No sent requests</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendRequests;
