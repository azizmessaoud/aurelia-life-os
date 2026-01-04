import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import DeepWork from "./pages/DeepWork";
import Capacity from "./pages/Capacity";
import Opportunities from "./pages/Opportunities";
import Chat from "./pages/Chat";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Council from "./pages/Council";
import Goals from "./pages/Goals";
import GPSCommandCenter from "./pages/GPSCommandCenter";
import Intelligence from "./pages/Intelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/gps" element={<GPSCommandCenter />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/deep-work" element={<DeepWork />} />
          <Route path="/capacity" element={<Capacity />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/knowledge" element={<KnowledgeGraph />} />
          <Route path="/council" element={<Council />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
