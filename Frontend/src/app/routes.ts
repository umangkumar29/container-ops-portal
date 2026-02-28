import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Analytics } from "./pages/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/analytics/:envId",
    Component: Analytics,
  },
]);
