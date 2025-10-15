import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Github } from "lucide-react";
import Button from "./ui/Button";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-dark-100.1/80 backdrop-blur-xl border-b border-gray-102/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            {/* <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Um</span>
            </div>
            <span className="text-white-100 font-poppins font-bold text-xl">
              UrMind
            </span> */}

            <img src="/logo/logo-1.svg" alt="UrMind Logo" className="w-20" />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-white-100/80 hover:text-white-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-white-100/80 hover:text-white-100 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#demo"
              className="text-white-100/80 hover:text-white-100 transition-colors"
            >
              Demo
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/urmind"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white-100/80 hover:text-white-100 transition-colors"
            >
              <Github size={20} />
            </a>
            <Button variant="primary" size="sm">
              Install Extension
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
