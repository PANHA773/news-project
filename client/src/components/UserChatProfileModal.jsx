import { X, User, Mail, Shield, Info, Heart } from "lucide-react";
import { toAbsoluteMediaUrl } from "../config/urls";

const UserChatProfileModal = ({ user, onClose, onMessage }) => {
    if (!user) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="relative glass-card w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">

                {/* Header/Banner */}
                <div className="h-32 bg-linear-to-br from-(--primary-glow) to-(--secondary-glow) relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Avatar Section */}
                <div className="px-6 -mt-16 relative flex flex-col items-center">
                    <div className="w-32 h-32 rounded-3xl bg-[#0f0f1a] border-4 border-[#0f0f1a] shadow-2xl overflow-hidden group">
                        {user.avatar ? (
                                <img
                                    src={toAbsoluteMediaUrl(user.avatar)}
                                    alt={user.name}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <User className="w-16 h-16 text-gray-600" />
                                </div>
                            )}
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white glow-text text-center tracking-tight">
                        {user.name}
                    </h2>
                    <p className="text-(--primary-glow) text-xs font-black uppercase tracking-widest mt-1 opacity-80 decoration-2">
                        {user.role}
                    </p>
                </div>

                {/* Info Content */}
                <div className="p-8 space-y-6">
                    {/* Bio */}
                    {user.bio ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                <Info className="w-3.5 h-3.5" />
                                <span>About</span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">
                                "{user.bio}"
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <p className="text-gray-500 text-xs italic">No bio available</p>
                        </div>
                    )}

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Email</span>
                            </div>
                            <p className="text-xs text-white truncate font-medium">{user.email}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-4 h-4 text-pink-400" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Gender</span>
                            </div>
                            <p className="text-xs text-white font-medium">{user.gender || "Not specified"}</p>
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-2 space-y-2">
                        <button
                            onClick={() => { if (typeof onMessage === 'function') onMessage(user); onClose(); }}
                            className="w-full py-4 rounded-2xl bg-(--primary-glow) hover:brightness-105 text-black text-sm font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                            Message Privately
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                            Close Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserChatProfileModal;
