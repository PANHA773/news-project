import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, User, ArrowRight } from "lucide-react";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("Male");
    const { register } = useContext(AuthContext);
    const notify = useNotification();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(name, email, password, gender);
            notify.success("Account created successfully!");
            navigate("/");
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed";
            setError(msg);
            notify.error(msg);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-(--bg-dark) bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div className="w-full max-w-md p-8 space-y-8 glass-card rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.1)] relative z-10 animate-fade-in-up">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold neon-gradient-text drop-shadow-md">
                        Create Account
                    </h1>
                    <p className="mt-2 text-gray-400">Join the University News System</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-200 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-500 group-focus-within:text-(--primary-glow) transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) text-white placeholder-gray-600 transition-all outline-none"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-(--primary-glow) transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) text-white placeholder-gray-600 transition-all outline-none"
                                placeholder="admin@university.edu"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-(--primary-glow) transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) text-white placeholder-gray-600 transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Users className="h-5 w-5 text-gray-500 group-focus-within:text-(--primary-glow) transition-colors" />
                            </div>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) text-white transition-all outline-none appearance-none"
                            >
                                <option value="Male" className="bg-[#0f0f1a]">Male</option>
                                <option value="Female" className="bg-[#0f0f1a]">Female</option>
                                <option value="Other" className="bg-[#0f0f1a]">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ArrowRight className="h-4 w-4 text-gray-500 rotate-90" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 text-black bg-(--primary-glow) rounded-xl hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--primary-glow) shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? "Creating Account..." : (
                            <>
                                Sign Up
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-(--primary-glow) hover:text-(--secondary-glow) hover:underline transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

