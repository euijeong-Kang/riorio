import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const HomePage = lazy(() => import("../pages/home/page"));
const ReservePage = lazy(() => import("../pages/reserve/page"));
const YourStoryPage = lazy(() => import("../pages/your-story/page"));
const AdminPage = lazy(() => import("../pages/admin/page"));
const ReservationSuccessPage = lazy(() => import("../pages/reservation-success/page"));
const MyReservationPage = lazy(() => import("../pages/my-reservation/page"));
const NotFound = lazy(() => import("../pages/NotFound"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/special-offer",
    element: <HomePage />,
  },
  {
    path: "/reserve",
    element: <ReservePage />,
  },
  {
    path: "/your-story",
    element: <YourStoryPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/reservation-success",
    element: <ReservationSuccessPage />,
  },
  {
    path: "/my-reservation",
    element: <MyReservationPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
