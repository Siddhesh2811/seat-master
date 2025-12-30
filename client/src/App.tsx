import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Events from "@/pages/Events";
import EventDetails from "@/pages/EventDetails";
import Users from "@/pages/Users";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { UserProvider, useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Default route redirects to events dashboard */}
      <Route path="/">
        <Redirect to="/events" />
      </Route>

      <Route path="/auth" component={AuthPage} />
      <Route path="/events">
        {() => <ProtectedRoute component={Events} />}
      </Route>
      <Route path="/events/:id">
        {(params) => <ProtectedRoute component={EventDetails} params={params} />}
      </Route>
      <Route path="/users">
        {() => <ProtectedRoute component={Users} />}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={100}>
        <UserProvider>
          <Toaster />
          <Router />
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
