import { Link } from "@tanstack/react-router";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark-100.3 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img src="/logo/logo-1.svg" alt="UrMind Logo" className="w-16" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">
              Your AI-powered second brain. Never forget anything you browse.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/benrobo/urmind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Benrobo/urmind/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Releases
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-medium mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/benrobo/urmind"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://twitter.com/benaiah_al"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} UrMind. Built with privacy in mind.
            </p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <span className="text-white/40 text-sm">
                Made for the{" "}
                <a
                  href="https://googlechromeai2025.devpost.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Chrome AI Hackathon 2025
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
