import React from "react";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-gray-102/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Um</span>
            </div>
            <div className="text-left">
              <span className="text-white-100 font-poppins font-bold text-lg block">
                UrMind
              </span>
              <span className="text-white-100/60 text-xs">
                Your browser's AI memory
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm">
            <a
              href="#features"
              className="text-white-100/70 hover:text-white-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-white-100/70 hover:text-white-100 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#demo"
              className="text-white-100/70 hover:text-white-100 transition-colors"
            >
              Demo
            </a>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/urmind"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white-100/70 hover:text-white-100 transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href="https://twitter.com/urmind"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white-100/70 hover:text-white-100 transition-colors"
            >
              <Twitter size={20} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-102/30 text-center">
          <p className="text-white-100/60 text-sm">
            © {new Date().getFullYear()} UrMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
