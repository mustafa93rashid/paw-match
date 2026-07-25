import { Outlet } from "react-router-dom";
import { ScrollProgressBar, ScrollToTopButton, SkipLink } from "@paw-match/ui";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

export const RootLayout = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <ScrollProgressBar />
    <SkipLink targetId="main-content" />
    <Navbar />
    <main id="main-content" className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ScrollToTopButton />
  </div>
);
