import { useState, useEffect } from "react";
import api from "../api/axios";
import { Globe, Mail, Phone, MapPin, Award, BookOpen, Users, History } from "lucide-react";

const About = () => {
    const [about, setAbout] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const { data } = await api.get("/about");
                setAbout(data);
            } catch (error) {
                console.error("Error fetching about data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAbout();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-(--primary-glow)"></div>
            </div>
        );
    }

    if (!about) return <div className="text-center py-20 text-gray-400">University information not found.</div>;

    return (
        <div className="max-w-6xl mx-auto p-8 animate-fade-in space-y-16">
            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden glass-card border border-[rgba(255,255,255,0.05)] p-12 text-center">
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-(--primary-glow)/10 to-transparent"></div>

                {about.logo && (
                    <img
                        src={about.logo}
                        alt="University Logo"
                        className="w-32 h-32 mx-auto mb-8 object-contain drop-shadow-[0_0_15px_rgba(0,243,255,0.3)] animate-pulse-subtle"
                    />
                )}

                <h1 className="text-5xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
                    {about.title}
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
                    {about.description}
                </p>
            </section>

            {/* Stats Grid */}
            {about.stats && about.stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {about.stats.map((stat, idx) => (
                        <div key={idx} className="glass-card p-6 rounded-2xl text-center border border-[rgba(255,255,255,0.05)] hover:border-(--primary-glow)/30 transition-all group">
                            <h4 className="text-3xl font-black text-(--primary-glow) group-hover:scale-110 transition-transform duration-300">{stat.value}</h4>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Story & History */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)] relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 opacity-5">
                            <History size={200} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Award className="w-6 h-6 mr-3 text-(--secondary-glow)" />
                            Our Rich History
                        </h3>
                        <div className="prose prose-invert prose-p:text-gray-400 prose-p:leading-relaxed max-w-none">
                            <p className="whitespace-pre-line">{about.history}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-3 text-(--primary-glow)" />
                                Mission Statement
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                To foster academic excellence, innovative research, and a diverse learning community that empowers students to lead and serve in a global society.
                            </p>
                        </div>
                        <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-3 text-(--secondary-glow)" />
                                Our Community
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                A vibrant ecosystem of thinkers, creators, and leaders from over 100 countries, dedicated to making a positive impact on the world.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leadership Section */}
                {about.leaders && about.leaders.length > 0 && (
                    <div className="col-span-1 lg:col-span-3 space-y-12 py-8">
                        <h2 className="text-4xl font-black text-white text-center tracking-tight flex items-center justify-center">
                            <Users className="w-8 h-8 mr-4 text-(--primary-glow)" />
                            Meet Our Leaders
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {about.leaders.map((leader, idx) => (
                                <div key={idx} className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] hover:border-(--primary-glow)/30 transition-all group text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--primary-glow) to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-32 h-32 mx-auto rounded-full p-1 bg-linear-to-br from-(--primary-glow) to-(--secondary-glow) mb-6 relative z-10">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 border-4 border-[#0F0F1A]">
                                            {leader.image ? (
                                                <img src={leader.image} alt={leader.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                                                    <Users className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{leader.name}</h3>
                                    <p className="text-(--primary-glow) font-medium text-sm uppercase tracking-wider mb-4">{leader.position}</p>
                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{leader.bio}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact & Links */}
                <div className="space-y-8">
                    <div className="glass-card p-8 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-linear-to-br from-[rgba(255,255,255,0.02)] to-transparent">
                        <h3 className="text-2xl font-bold text-white mb-8">Contact Info</h3>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <MapPin className="w-5 h-5 mr-4 text-(--primary-glow) shrink-0 mt-1" />
                                <div>
                                    <p className="text-white font-semibold">Address</p>
                                    <p className="text-gray-400 text-sm mt-1">{about.contact?.address || "University Campus, Building A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Mail className="w-5 h-5 mr-4 text-(--secondary-glow) shrink-0 mt-1" />
                                <div>
                                    <p className="text-white font-semibold">Email</p>
                                    <p className="text-gray-400 text-sm mt-1">{about.contact?.email || "info@university.edu"}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Phone className="w-5 h-5 mr-4 text-(--primary-glow) shrink-0 mt-1" />
                                <div>
                                    <p className="text-white font-semibold">Phone</p>
                                    <p className="text-gray-400 text-sm mt-1">{about.contact?.phone || "+1 (234) 567-890"}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Globe className="w-5 h-5 mr-4 text-(--secondary-glow) shrink-0 mt-1" />
                                <div>
                                    <p className="text-white font-semibold">Website</p>
                                    <a href={about.contact?.website} target="_blank" rel="noopener noreferrer" className="text-(--primary-glow) text-sm mt-1 hover:underline truncate block">
                                        {about.contact?.website || "www.university.edu"}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    {about.socialLinks && about.socialLinks.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {about.socialLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-(--primary-glow)/20 hover:border-(--primary-glow)/40 transition-all duration-300"
                                >
                                    {link.platform}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default About;
