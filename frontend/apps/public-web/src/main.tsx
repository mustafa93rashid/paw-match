import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./lib/auth";
import { AppGate } from "./components/chrome/AppGate";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <AppGate>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppGate>
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
