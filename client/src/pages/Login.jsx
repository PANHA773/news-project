import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ArrowRight } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            notify.success("Login successful! Welcome back.");
            navigate("/");
        } catch (err) {
            const msg = "Invalid email or password";
            setError(msg);
            notify.error(msg);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-(--bg-dark) bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div className="w-full max-w-md p-8 space-y-8 glass-card rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.1)] relative z-10 animate-fade-in-up">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold neon-gradient-text drop-shadow-md">
                        UniNews Admin
                    </h1>
                    <p className="mt-2 text-gray-400">Sign in to manage university updates</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-200 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 text-black bg-(--primary-glow) rounded-xl hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--primary-glow) shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? "Signing in..." : (
                            <>
                                Sign In
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-medium text-(--primary-glow) hover:text-(--secondary-glow) hover:underline transition-colors">
                        Create one
                    </Link>
                </p>
                <p className="text-center text-xs text-gray-600 mt-4">
                    &copy; 2026 University News System
                </p>
            </div>
        </div>
    );
};

export default Login;
