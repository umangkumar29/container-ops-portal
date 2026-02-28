import { createBrowserRouter, redirect } from "react-router";
import { Home } from "./pages/Home";
import { Analytics } from "./pages/Analytics";
import { Login } from "./pages/Login";
import { UserManagement } from "./pages/UserManagement";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/dashboard"),
  },
  {
    path: "/dashboard",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/users",
    Component: UserManagement,
  },
  {
    path: "/analytics/:envId",
    Component: Analytics,
  },
]);
