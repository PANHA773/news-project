import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";

const AdminFriendRequests = () => {
    const { user } = useContext(AuthContext);
    const notify = useNotification();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/admin/friend-requests');
            setList(res.data || []);
        } catch (err) {
            console.error(err);
            notify.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const forceAccept = async (id) => {
        try {
            await api.post(`/users/admin/friend-requests/${id}/force-accept`);
            notify.success('Friend request force-accepted');
            setList(prev => prev.filter(x => x._id !== id));
        } catch (err) {
            console.error(err);
            notify.error('Failed to force-accept');
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Admin Friend Requests</h2>
            <div className="glass-card p-4 rounded-xl">
                {loading ? <p className="text-gray-400">Loading...</p> : (
                    list.length > 0 ? list.map(fr => (
                        <div key={fr._id} className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.04)]">
                            <div>
                                <div className="text-white font-medium">{fr.requester?.name} → {fr.recipient?.name}</div>
                                <div className="text-xs text-gray-400">{fr.message} • {fr.status}</div>
                            </div>
                            <div>
                                <button onClick={() => forceAccept(fr._id)} className="px-3 py-1 bg-green-500 text-black rounded">Force Accept</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-400">No friend requests</p>
                )}
            </div>
        </div>
    );
};

export default AdminFriendRequests;
