import { useState, useContext } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, User as UserIcon } from "lucide-react";
import Sidebar from "./Sidebar";
import AuthContext from "../context/AuthContext";

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useContext(AuthContext);

    const displayRole = user?.role === 'admin' ? "Administrator" : (user?.role || "Viewer");

    return (
        <div className="flex h-screen bg-[var(--bg-dark)] overflow-hidden font-sans text-gray-100">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="flex items-center justify-between px-6 py-4 glass z-10">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1 mr-4 -ml-1 rounded-md text-gray-400 hover:text-white focus:outline-none lg:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold tracking-wide neon-gradient-text uppercase">PSBU NEWS Feed</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/profile" className="flex items-center space-x-3 group cursor-pointer p-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-all border border-transparent hover:border-[rgba(255,255,255,0.05)]">
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-sm font-bold text-gray-100 group-hover:text-(--primary-glow) transition-colors">{user?.name || "Guest"}</span>
                                <span className="text-[10px] text-(--primary-glow) font-black uppercase tracking-widest">{displayRole}</span>
                            </div>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,243,255,0.2)] border border-(--primary-glow)/30 bg-[var(--bg-surface)] flex items-center justify-center group-hover:border-(--primary-glow) transition-all">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-(--bg-dark) rounded-full"></div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
