import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import MapViewPage from "./pages/MapView";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProjectsDashboard from './pages/ProjectsDashboard';
import Settings from './pages/Settings';
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking auth
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/login"} component={Login} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      
      {/* Protected routes - redirect to login if not authenticated */}
      <Route path={"/projects"}>
        {isAuthenticated ? <ProjectsDashboard /> : <Redirect to="/login" />}
      </Route>
      <Route path={"/settings"}>
        {isAuthenticated ? <Settings /> : <Redirect to="/login" />}
      </Route>
      <Route path={"/map"}>
        {isAuthenticated ? <MapViewPage /> : <Redirect to="/login" />}
      </Route>
      
      {/* Home/Dashboard - redirect to login if not authenticated */}
      <Route path={"/"}>
        {isAuthenticated ? <Dashboard /> : <Redirect to="/login" />}
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
