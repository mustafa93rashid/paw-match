import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@paw-match/utilities";

const sections = [
  { id: "hero", label: "Home" },
  { id: "featured-animals", label: "Animals" },
  { id: "how-it-works", label: "How it works" },
  { id: "why-us", label: "Why us" },
  { id: "success-stories", label: "Stories" },
  { id: "verified-shelters", label: "Shelters" },
  { id: "veterinarians", label: "Vets" },
  { id: "statistics", label: "Impact" },
  { id: "faq", label: "FAQ" },
  { id: "work-with-us", label: "Work with us" },
  { id: "final-cta", label: "Get started" },
];

/** Right-edge scroll-spy dot nav for the home page's own sections (desktop only). */
export const SectionNav = () => {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "hero");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      {sections.map((section) => {
        const isActive = section.id === activeId;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => handleClick(section.id)}
            className="group flex items-center gap-2.5"
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={cn(
                "pointer-events-none whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100",
                isActive && "text-white",
              )}
            >
              {section.label}
            </span>
            <motion.span
              className={cn(
                "block rounded-full border transition-colors",
                isActive ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white",
              )}
              animate={{ width: isActive ? 10 : 7, height: isActive ? 10 : 7 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            />
          </button>
        );
      })}
    </nav>
  );
};
