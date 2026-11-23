import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const HomePage = lazy(() => import("../pages/home/page"));
const PublicPage = lazy(() => import("../pages/public/page"));
const ChristmasReservationPage = lazy(() => import("../reservation/ChristmasReservationPage"));
const YourStoryPage = lazy(() => import("../pages/your-story/page"));
const AdminPage = lazy(() => import("../pages/admin/page"));
const ReservationSuccessPage = lazy(() => import("../pages/reservation-success/page"));
const MyReservationPage = lazy(() => import("../pages/my-reservation/page"));
const ManualPage = lazy(() => import("../pages/manual/page"));
const GlobalMenuPage = lazy(() => import("../pages/global-menu/page"));
const SchedulePage = lazy(() => import("../pages/schedule/page"));
const ScheduleAdminPage = lazy(() => import("../pages/schedule/admin"));
const ScheduleAuthPage = lazy(() => import("../pages/schedule/auth"));
const NotFound = lazy(() => import("../pages/NotFound"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  { path: "/en", element: <HomePage english /> },
  { path: "/visit", element: <Navigate to="/" replace /> },
  { path: "/en/visit", element: <Navigate to="/en/" replace /> },
  { path: "/events", element: <PublicPage kind="events" /> },
  { path: "/en/events", element: <PublicPage kind="events" english /> },
  { path: "/events/christmas-2026", element: <PublicPage kind="christmas" /> },
  { path: "/en/events/christmas-2026", element: <PublicPage kind="christmas" english /> },
  { path: "/events/christmas-2026/reserve", element: <ChristmasReservationPage /> },
  { path: "/en/events/christmas-2026/reserve", element: <ChristmasReservationPage english /> },
  {
    path: "/special-offer",
    element: <PublicPage kind="legacy" />,
  },
  {
    path: "/reserve",
    element: <PublicPage kind="legacy" />,
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
    path: "/manual",
    element: <ManualPage />,
  },
  {
    path: "/schedule",
    element: <SchedulePage />,
  },
  {
    path: "/schedule/admin",
    element: <ScheduleAdminPage />,
  },
  {
    path: "/schedule/login",
    element: <ScheduleAuthPage />,
  },
  {
    path: "/menu/:locale?",
    element: <GlobalMenuPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
