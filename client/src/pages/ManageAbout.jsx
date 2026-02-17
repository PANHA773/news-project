import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";
import { Save, Upload, Plus, Trash2, Globe, Mail, Phone, MapPin, Info, Users, LayoutDashboard, Camera } from "lucide-react";

const ManageAbout = () => {
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef(null);
    const [uploadingLeaderImage, setUploadingLeaderImage] = useState(false);
    const [activeLeaderIndex, setActiveLeaderIndex] = useState(null);
    const leaderImageInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        logo: "",
        description: "",
        history: "",
        contact: {
            email: "",
            phone: "",
            address: "",
            website: "",
        },
        socialLinks: [],
        stats: [],
        leaders: [],
    });

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const { data } = await api.get("/about");
                setFormData({ ...data, leaders: data.leaders || [] });
            } catch (error) {
                console.error("Error fetching about data", error);
            } finally {
                setFetching(false);
            }
        };
        fetchAbout();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append("image", file);
        setUploadingLogo(true);

        try {
            const res = await api.post("/upload", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setFormData(prev => ({ ...prev, logo: `http://localhost:5000${res.data}` }));
            notify.success("Logo uploaded!");
        } catch (error) {
            notify.error("Logo upload failed");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleLeaderImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || activeLeaderIndex === null) return;

        const data = new FormData();
        data.append("image", file);
        setUploadingLeaderImage(true);

        try {
            const res = await api.post("/upload", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const newLeaders = [...formData.leaders];
            newLeaders[activeLeaderIndex].image = `http://localhost:5000${res.data}`;
            setFormData(prev => ({ ...prev, leaders: newLeaders }));
            notify.success("Leader image uploaded!");
        } catch (error) {
            notify.error("Image upload failed");
        } finally {
            setUploadingLeaderImage(false);
            setActiveLeaderIndex(null);
            if (leaderImageInputRef.current) leaderImageInputRef.current.value = "";
        }
    };

    const triggerLeaderImageUpload = (index) => {
        setActiveLeaderIndex(index);
        leaderImageInputRef.current?.click();
    };

    const handleAddStat = () => {
        setFormData(prev => ({
            ...prev,
            stats: [...prev.stats, { label: "", value: "" }]
        }));
    };

    const handleRemoveStat = (index) => {
        setFormData(prev => ({
            ...prev,
            stats: prev.stats.filter((_, i) => i !== index)
        }));
    };

    const handleStatChange = (index, field, value) => {
        const newStats = [...formData.stats];
        newStats[index][field] = value;
        setFormData(prev => ({ ...prev, stats: newStats }));
    };

    const handleAddLeader = () => {
        setFormData(prev => ({
            ...prev,
            leaders: [...prev.leaders, { name: "", position: "", bio: "", image: "" }]
        }));
    };

    const handleRemoveLeader = (index) => {
        setFormData(prev => ({
            ...prev,
            leaders: prev.leaders.filter((_, i) => i !== index)
        }));
    };

    const handleLeaderChange = (index, field, value) => {
        const newLeaders = [...formData.leaders];
        newLeaders[index][field] = value;
        setFormData(prev => ({ ...prev, leaders: newLeaders }));
    };

    const handleAddSocial = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { platform: "", url: "" }]
        }));
    };

    const handleRemoveSocial = (index) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const handleSocialChange = (index, field, value) => {
        const newSocials = [...formData.socialLinks];
        newSocials[index][field] = value;
        setFormData(prev => ({ ...prev, socialLinks: newSocials }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put("/about", formData);
            notify.success("University info updated successfully!");
        } catch (error) {
            notify.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-glow"></div></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">Manage About</h1>
                    <p className="text-gray-400 text-lg">Update university identity and information.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center px-6 py-2.5 bg-(--primary-glow) text-black font-bold rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Visual Identity */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Camera className="w-5 h-5 mr-3 text-(--primary-glow)" />
                        Brand & Identity
                    </h3>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-2xl bg-gray-800 border-2 border-[rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden relative">
                                {uploadingLogo ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-(--primary-glow)"></div>
                                ) : formData.logo ? (
                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Info className="w-8 h-8 text-gray-600" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 p-2 bg-(--primary-glow) rounded-lg text-black shadow-lg hover:scale-110 transition-transform"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">University Name</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                                    placeholder="Enter university title"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <LayoutDashboard className="w-5 h-5 mr-3 text-(--secondary-glow)" />
                        Description & History
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Short Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all resize-none"
                                placeholder="A brief overview of the university"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Detailed History</label>
                            <textarea
                                name="history"
                                value={formData.history}
                                onChange={handleChange}
                                rows="6"
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all resize-none"
                                placeholder="Tell the university's story..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <Users className="w-5 h-5 mr-3 text-(--primary-glow)" />
                            Key Statistics
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddStat}
                            className="p-2 bg-[rgba(0,243,255,0.1)] text-(--primary-glow) rounded-lg hover:bg-[rgba(0,243,255,0.2)] transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.stats.map((stat, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={stat.label}
                                    onChange={(e) => handleStatChange(idx, "label", e.target.value)}
                                    placeholder="Label (e.g. Students)"
                                    className="flex-1 px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                />
                                <input
                                    type="text"
                                    value={stat.value}
                                    onChange={(e) => handleStatChange(idx, "value", e.target.value)}
                                    placeholder="Value (e.g. 15,000+)"
                                    className="w-32 px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStat(idx)}
                                    className="text-red-500 hover:text-red-400 p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leadership Team */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <Users className="w-5 h-5 mr-3 text-(--secondary-glow)" />
                            Leadership Team
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddLeader}
                            className="p-2 bg-[rgba(0,243,255,0.1)] text-(--primary-glow) rounded-lg hover:bg-[rgba(0,243,255,0.2)] transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <input
                            type="file"
                            ref={leaderImageInputRef}
                            onChange={handleLeaderImageUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        {formData.leaders.map((leader, idx) => (
                            <div key={idx} className="p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl flex flex-col md:flex-row gap-6 relative group">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLeader(idx)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-[rgba(255,255,255,0.1)] overflow-hidden flex items-center justify-center">
                                        {uploadingLeaderImage && activeLeaderIndex === idx ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-(--primary-glow)"></div>
                                        ) : leader.image ? (
                                            <img src={leader.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-8 h-8 text-gray-600" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => triggerLeaderImageUpload(idx)}
                                        className="absolute -bottom-1 -right-1 p-1.5 bg-(--primary-glow) text-black rounded-full shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <Camera className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={leader.name}
                                            onChange={(e) => handleLeaderChange(idx, "name", e.target.value)}
                                            placeholder="Full Name"
                                            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={leader.position}
                                            onChange={(e) => handleLeaderChange(idx, "position", e.target.value)}
                                            placeholder="Job Title / Position"
                                            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                        />
                                    </div>
                                    <textarea
                                        value={leader.bio}
                                        onChange={(e) => handleLeaderChange(idx, "bio", e.target.value)}
                                        placeholder="Short Bio"
                                        rows="2"
                                        className="w-full px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Mail className="w-5 h-5 mr-3 text-(--secondary-glow)" />
                        Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Email</label>
                            <input
                                type="email"
                                name="contact.email"
                                value={formData.contact?.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Phone</label>
                            <input
                                type="text"
                                name="contact.phone"
                                value={formData.contact?.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Address</label>
                            <input
                                type="text"
                                name="contact.address"
                                value={formData.contact?.address}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Website</label>
                            <input
                                type="text"
                                name="contact.website"
                                value={formData.contact?.website}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-xl focus:border-(--primary-glow) outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <Globe className="w-5 h-5 mr-3 text-(--primary-glow)" />
                            Social Media
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddSocial}
                            className="p-2 bg-[rgba(0,243,255,0.1)] text-(--primary-glow) rounded-lg hover:bg-[rgba(0,243,255,0.2)] transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.socialLinks.map((link, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    value={link.platform}
                                    onChange={(e) => handleSocialChange(idx, "platform", e.target.value)}
                                    placeholder="Platform (e.g. Facebook)"
                                    className="w-48 px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                />
                                <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => handleSocialChange(idx, "url", e.target.value)}
                                    placeholder="URL"
                                    className="flex-1 px-4 py-2 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-white rounded-xl outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSocial(idx)}
                                    className="text-red-500 hover:text-red-400 p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ManageAbout;

