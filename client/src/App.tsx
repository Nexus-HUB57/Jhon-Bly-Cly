import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import EcosystemFusion from "./pages/EcosystemFusion";
import Home from "./pages/Home";
import Orchestration from "./pages/Orchestration";
import References from "./pages/References";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import { AutonomousDashboard } from "./pages/AutonomousDashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}><DashboardLayout><Home /></DashboardLayout></Route>
      <Route path={"/orchestration"}><DashboardLayout><Orchestration /></DashboardLayout></Route>
      <Route path={"/fusion"}><DashboardLayout><EcosystemFusion /></DashboardLayout></Route>
      <Route path={"/references"}><DashboardLayout><References /></DashboardLayout></Route>
      <Route path={"/projects/:id"}><DashboardLayout><ProjectWorkspace /></DashboardLayout></Route>
      <Route path={"/autonomous"}><DashboardLayout><AutonomousDashboard /></DashboardLayout></Route>
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
