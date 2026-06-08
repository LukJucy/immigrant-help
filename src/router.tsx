import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./App";
import { useProfile } from "./store/profile";
import { Onboarding } from "./screens/Onboarding";
import { Timeline } from "./screens/Timeline";
import { TaskGuideScreen } from "./screens/TaskGuide";
import { Prefill } from "./screens/Prefill";
import { Forum } from "./screens/Forum";
import { Chat } from "./screens/Chat";
import { Search } from "./screens/Search";
import { Help } from "./screens/Help";
import { About } from "./screens/About";

/** Send first-time users to onboarding, returning users to their timeline. */
function RootRedirect() {
  const { profile } = useProfile();
  return <Navigate to={profile ? "/timeline" : "/onboard"} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/onboard", element: <Onboarding /> },
  {
    element: <Layout />,
    children: [
      { path: "/timeline", element: <Timeline /> },
      { path: "/task/:id", element: <TaskGuideScreen /> },
      { path: "/prefill/:id", element: <Prefill /> },
      { path: "/forum", element: <Forum /> },
      { path: "/chat", element: <Chat /> },
      { path: "/search", element: <Search /> },
      { path: "/help", element: <Help /> },
      { path: "/about", element: <About /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
