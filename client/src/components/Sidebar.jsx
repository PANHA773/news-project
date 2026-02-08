import { NavLink } from "react-router-dom";
import {
  Info,
  MessageSquare,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Bookmark,
  Users,
  UserPlus,
  Bell,
  X,
  PenTool,
  FileText,
  Tags,
  Activity,
} from "lucide-react";

import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);
  const { unreadCount } = useNotifications();

  // Tailwind classes for NavLink
  const navLinkClass = ({ isActive }) =>
    `flex items-center px-6 py-3 transition-all duration-200 relative group ${
      isActive
        ? "text-[var(--primary-glow)] bg-[rgba(0,243,255,0.05)] border-r-2 border-[var(--primary-glow)] glow-text"
        : "text-gray-400 hover:bg-[rgba(255,255,255,0.03)] hover:text-gray-100"
    }`;

  const iconClass = (isActive) =>
    `w-5 h-5 transition-transform group-hover:scale-110 ${
      isActive ? "drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" : ""
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-[#0f0f1a] border-r border-[#ffffff10]
        transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-wider drop-shadow-lg">
            PSBU-News
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-2 text-sm font-medium">
          <NavLink to="/" className={navLinkClass} onClick={() => setIsOpen(false)}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <LayoutDashboard className={iconClass(isActive)} />
                <span className="ml-4">Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink to="/news" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <FileText className={iconClass(isActive)} />
                <span className="ml-4">News</span>
              </>
            )}
          </NavLink>

          <NavLink to="/bookmarks" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <Bookmark className={iconClass(isActive)} />
                <span className="ml-4">Bookmarks</span>
              </>
            )}
          </NavLink>

          <NavLink to="/notifications" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <div className="relative">
                  <Bell className={iconClass(isActive)} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f0f1a] animate-pulse" />
                  )}
                </div>
                <span className="ml-4">Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-[var(--primary-glow)] text-black px-2 py-0.5 rounded-full shadow-[0_0_5px_var(--primary-glow)]">
                    {unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink to="/categories" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <Tags className={iconClass(isActive)} />
                <span className="ml-4">Categories</span>
              </>
            )}
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <Info className={iconClass(isActive)} />
                <span className="ml-4">About University</span>
              </>
            )}
          </NavLink>

          <NavLink to="/chat" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <MessageSquare className={iconClass(isActive)} />
                <span className="ml-4">Community Chat</span>
              </>
            )}
          </NavLink>

          <NavLink to="/add-friend" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <UserPlus className={iconClass(isActive)} />
                <span className="ml-4">Add Friend</span>
              </>
            )}
          </NavLink>

          <NavLink to="/settings" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <Settings className={iconClass(isActive)} />
                <span className="ml-4">Settings</span>
              </>
            )}
          </NavLink>
{/* 
          <div className="my-4 border-t border-white/5 mx-6" /> */}

          <NavLink to="/profile" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                <User className={iconClass(isActive)} />
                <span className="ml-4">My Profile</span>
              </>
            )}
          </NavLink>

          {user?.role?.toLowerCase() === "admin" && (
            <>
              <div className="my-2 border-t border-white/5 mx-6" />
              <NavLink to="/manage-about" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                    <PenTool className={iconClass(isActive)} />
                    <span className="ml-4">Manage About</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/manage-users" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                    <Users className={iconClass(isActive)} />
                    <span className="ml-4">Manage Users</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/activities" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary-glow)] shadow-[0_0_10px_#00f3ff]" />}
                    <Activity className={iconClass(isActive)} />
                    <span className="ml-4">Activity Logs</span>
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-gray-400 rounded-lg transition hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30"
          >
            <LogOut />
            <span className="mx-4 font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
