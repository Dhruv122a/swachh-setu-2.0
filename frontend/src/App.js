import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import { Toast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorState";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Report from "./pages/Report";
import Processing from "./pages/Processing";
import Ticket from "./pages/Ticket";
import Track from "./pages/Track";
import MapPage from "./pages/MapPage";
import MyComplaints from "./pages/MyComplaints";
import Command from "./pages/Command";
import ComplaintDetail from "./pages/ComplaintDetail";
import Hotspots from "./pages/Hotspots";
import Escalations from "./pages/Escalations";
import Demo from "./pages/Demo";

// [path, Page, access]: access = public | user | admin
const SHELL_ROUTES = [
  ["/report", Report, "user"], ["/processing", Processing, "user"], ["/my", MyComplaints, "user"],
  ["/ticket/:id", Ticket, "public"], ["/track/:id", Track, "public"], ["/map", MapPage, "public"],
  ["/command", Command, "admin"], ["/complaints/:id", ComplaintDetail, "admin"], ["/hotspots", Hotspots, "admin"],
  ["/escalations", Escalations, "admin"], ["/demo", Demo, "admin"],
];

const Shelled = ({ Page, access }) => {
  const { pathname } = useLocation();
  const page = <ErrorBoundary key={pathname}><Page /></ErrorBoundary>;
  return <AppShell>{access === "public" ? page : <ProtectedRoute role={access === "admin" ? "admin" : undefined}>{page}</ProtectedRoute>}</AppShell>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toast />
        <Routes>
          <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          {SHELL_ROUTES.map(([path, Page, access]) => <Route key={path} path={path} element={<Shelled Page={Page} access={access} />} />)}
          <Route path="*" element={<Shelled Page={Landing} access="public" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
