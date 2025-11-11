import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Vinculacao from "./pages/Vinculacao";
import NovaOS from "./pages/NovaOS";
import Relatorios from "./pages/Relatorios";
import Marketplace from "./pages/Marketplace";
import Analytics from "./pages/Analytics";
import SistemaGarantias from "./components/garantias/SistemaGarantias";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/vinculacao" element={<Vinculacao />} />
          <Route path="/nova-os" element={<NovaOS />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/garantias" element={<SistemaGarantias />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
