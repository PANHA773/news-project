import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const AdminRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return user && user.role === "admin" ? (
        children ? children : <Outlet />
    ) : (
        <Navigate to="/login" />
    );
};

export default AdminRoute;
