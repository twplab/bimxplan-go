import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SimpleChatBot } from "@/components/SimpleChatBot";
import { SimpleSettings } from "@/components/SimpleSettings";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

// Import all pages
import Index from "./pages/Index";
import BEPForm from "./pages/BEPForm";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectEditor from "./pages/ProjectEditor";
import ProjectSettings from "./pages/ProjectSettings";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Test from "./pages/Test";

const queryClient = new QueryClient();

// Restored full App structure - fixed
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bimxplan-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/project/:projectId" element={<ProjectEditor />} />
                <Route path="/project/:projectId/settings" element={<ProjectSettings />} />
                <Route path="/bep-form" element={<BEPForm />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/test" element={<Test />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* ChatBot and Settings with error boundaries */}
              <AppErrorBoundary name="ChatBot">
                <SimpleChatBot />
              </AppErrorBoundary>
              
              <AppErrorBoundary name="Settings">
                <SimpleSettings />
              </AppErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;