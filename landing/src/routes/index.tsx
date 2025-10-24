import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import Hero from "../components/sections/Hero";
import QuickStart from "../components/sections/QuickStart";
import Features from "../components/sections/Features";
import HowItWorks from "../components/sections/HowItWorks";
import Demo from "../components/sections/Demo";
import CTA from "../components/sections/CTA";
import ChangelogWidget from "../components/ChangelogWidget";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer for fade-in animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all sections
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.classList.add("fade-in");
      observerRef.current?.observe(section);
    });

    // Smooth scroll for anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      observerRef.current?.disconnect();
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      <QuickStart />
      <Features />
      <HowItWorks />
      <Demo />
      <CTA />
      <ChangelogWidget />
    </div>
  );
}
