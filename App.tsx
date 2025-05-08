import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/ui/layout";
import Home from "@/pages/home";
import AgendaPage from "@/pages/agenda";
import ContributionsPage from "@/pages/contributions";
import AnnouncementsPage from "@/pages/announcements";
import PhotoGalleryPage from "@/pages/photo-gallery";
import VideoGalleryPage from "@/pages/video-gallery";
import FamilyHistoryPage from "@/pages/family-history";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home}/>
        <Route path="/agenda" component={AgendaPage}/>
        <Route path="/contributions" component={ContributionsPage}/>
        <Route path="/announcements" component={AnnouncementsPage}/>
        <Route path="/photos" component={PhotoGalleryPage}/>
        <Route path="/videos" component={VideoGalleryPage}/>
        <Route path="/history" component={FamilyHistoryPage}/>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
