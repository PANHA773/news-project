import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import News from "./pages/News";
import Categories from "./pages/Categories";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ArticleDetail from "./pages/ArticleDetail";
import Settings from "./pages/Settings";
import Bookmarks from "./pages/Bookmarks";
import AuthorArticles from "./pages/AuthorArticles";
import About from "./pages/About";
import ManageAbout from "./pages/ManageAbout";
import ManageUsers from "./pages/ManageUsers";
import Notifications from "./pages/Notifications";
import ActivityLogs from "./pages/ActivityLogs";


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationsProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<ArticleDetail />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/author/:id" element={<AuthorArticles />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/manage-about" element={<ManageAbout />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                  <Route path="/activities" element={<ActivityLogs />} />
                </Route>
              </Routes>
            </Router>
          </NotificationProvider>
        </NotificationsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
