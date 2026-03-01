import { createBrowserRouter, Navigate } from "react-router";
import { Home } from "./pages/Home";
import { Analytics } from "./pages/Analytics";
import { Login } from "./pages/Login";
import { UserManagement } from "./pages/UserManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Home /></ProtectedRoute >,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/users",
    element: <ProtectedRoute><UserManagement /></ProtectedRoute >,
  },
  {
    path: "/analytics/:envId",
    element: <ProtectedRoute><Analytics /></ProtectedRoute >,
  },
]);
