import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Events from "@/pages/Events";
import EventDetails from "@/pages/EventDetails";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Default route redirects to events dashboard */}
      <Route path="/">
        <Redirect to="/events" />
      </Route>
      
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetails} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={100}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
