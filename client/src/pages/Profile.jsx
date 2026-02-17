import { useState, useContext, useEffect, useRef } from "react";
import AuthContext from "../context/AuthContext";
import { User, Save, Edit, Camera, SaveAll, Bookmark, Trash2, ExternalLink } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Profile = () => {
    const { user, updateProfile } = useContext(AuthContext); // Use updateProfile to update local user state
    const notify = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Form state
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [avatar, setAvatar] = useState(user?.avatar || "");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setBio(user.bio || "");
            setAvatar(user.avatar || "");
        }
    }, [user]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file); // Backend expects 'image'

        setUploadingAvatar(true);
        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const imageUrl = `http://localhost:5000${res.data}`;
            setAvatar(imageUrl);
            notify.success("Image uploaded! Don't forget to save changes.");
        } catch (error) {
            console.error("Upload failed", error);
            notify.error("Failed to upload image");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                email,
                bio,
                avatar,
            };

            if (password) {
                payload.password = password;
            }

            // Using the centralized api instance which already has headers/baseURL
            const { data } = await api.put("/users/profile", payload);

            // updateProfile handles both state and token persistence if needed
            updateProfile(data, data.token);

            notify.success("Profile updated successfully!");
            setIsEditing(false);
            setPassword(""); // Clear password field after success
        } catch (error) {
            const msg = error.response?.data?.message || "Update failed";
            notify.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBookmark = async (articleId) => {
        try {
            const res = await api.put(`/users/bookmark/${articleId}`);
            // res.data should contain the updated user or at least the new bookmarks array
            const updatedUser = { ...user, bookmarks: res.data.bookmarks };
            updateProfile(updatedUser, localStorage.getItem("token"));
            notify.success("Bookmark removed");
        } catch (error) {
            notify.error("Failed to remove bookmark");
        }
    };

    return (
        <div className="p-8 animate-fade-in space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">My Profile</h1>
                    <p className="text-gray-400 text-lg">Manage your personal information.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-all"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="col-span-1">
                    <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center border border-[rgba(255,255,255,0.05)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-(--primary-glow)/20 to-transparent"></div>

                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-(--bg-dark) bg-gray-800 flex items-center justify-center overflow-hidden shadow-[0_0_20px_var(--primary-glow)] relative">
                                {uploadingAvatar ? (
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-(--primary-glow)"></div>
                                        <span className="text-[10px] text-(--primary-glow) font-bold uppercase tracking-widest">Uploading</span>
                                    </div>
                                ) : avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-gray-400" />
                                )}
                            </div>
                            {isEditing && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-(--primary-glow) p-2 rounded-full text-black shadow-lg cursor-pointer hover:brightness-110 transition-transform hover:scale-110"
                                >
                                    <Camera className="w-4 h-4" />
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-white mt-4">{name}</h2>
                        <span className="px-3 py-1 bg-[rgba(255,255,255,0.1)] text-xs font-medium text-(--primary-glow) rounded-full mt-2 uppercase tracking-widest border border-(--primary-glow)/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]">
                            {user?.role === 'admin' ? "Administrator" : (user?.role || "Student")}
                        </span>

                        <p className="text-gray-400 mt-4 leading-relaxed">
                            {bio || "No bio added yet."}
                        </p>
                    </div>

                    {/* Bookmarks Section */}
                    <div className="mt-8 glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                            <Bookmark className="w-5 h-5 mr-2 text-(--primary-glow)" />
                            Bookmarked Articles
                        </h3>

                        {user?.bookmarks && user.bookmarks.length > 0 ? (
                            <div className="space-y-4">
                                {user.bookmarks.map((article) => (
                                    <div key={article._id || article} className="group flex items-center p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all">
                                        <div className="w-16 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-[rgba(255,255,255,0.05)]">
                                            {(article.image || article.video) ? (
                                                <img src={article.image || article.video} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                    <Bookmark className="w-6 h-6 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-(--primary-glow) transition-colors">
                                                {article.title || "Untitled Article"}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {article.category?.name || "News"} • {new Date(article.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link to={`/news/${article._id}`} className="p-2 text-gray-400 hover:text-white transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleRemoveBookmark(article._id)}
                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                title="Remove Bookmark"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <p>You haven't bookmarked any articles yet.</p>
                                <p className="mt-1 opacity-50">Save articles to read them later!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <div className="col-span-2">
                    <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)] h-full">
                        <h3 className="text-xl font-bold text-white mb-6">Profile Details</h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="admin@university.edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Avatar URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={avatar}
                                        onChange={(e) => setAvatar(e.target.value)}
                                        disabled={!isEditing}
                                        className="flex-1 px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-gray-300 rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-all"
                                        >
                                            Upload
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    disabled={!isEditing}
                                    rows="4"
                                    className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Tell us a bit about yourself..."
                                ></textarea>
                            </div>

                            {isEditing && (
                                <div className="pt-6 border-t border-[rgba(255,255,255,0.05)]">
                                    <h4 className="text-md font-semibold text-white mb-4">Change Password</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">New Password (leave blank to keep current)</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="flex justify-end pt-4 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center px-6 py-2.5 text-sm font-bold text-black bg-(--primary-glow) rounded-lg hover:brightness-110 shadow-[0_0_10px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Saving..." : (
                                            <>
                                                <SaveAll className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

