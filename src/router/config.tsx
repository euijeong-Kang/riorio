import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const PublicPage = lazy(() => import("../pages/public/page"));
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
    element: <PublicPage kind="home" />,
  },
  { path: "/en", element: <PublicPage kind="home" english /> },
  { path: "/visit", element: <PublicPage kind="visit" /> },
  { path: "/en/visit", element: <PublicPage kind="visit" english /> },
  { path: "/events", element: <PublicPage kind="events" /> },
  { path: "/en/events", element: <PublicPage kind="events" english /> },
  { path: "/events/christmas-2026", element: <PublicPage kind="christmas" /> },
  { path: "/en/events/christmas-2026", element: <PublicPage kind="christmas" english /> },
  { path: "/events/christmas-2026/reserve", element: <PublicPage kind="christmas" /> },
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
