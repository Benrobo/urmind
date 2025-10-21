import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark-100.3 py-[6em]">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/60 text-lg mb-12">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Your Privacy Matters
              </h2>
              <p className="text-white/80 leading-relaxed">
                UrMind is built with privacy at its core. We believe your
                browsing data should stay yours. That's why we don't even have
                servers - everything is stored locally on your device, and we
                only use external services when absolutely necessary for AI
                functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                What We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Browsing Data (Stored Locally)
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-4">
                    <li>• Web pages you choose to save</li>
                    <li>• Selected text highlights</li>
                    <li>• Page metadata (title, URL, timestamp)</li>
                    <li>• Your custom categories and organization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    API Keys (Stored Locally)
                  </h3>
                  <p className="text-white/80">
                    Your Gemini API key is stored locally in your browser and
                    never sent to our servers (we don't even have servers). It's
                    only used to make direct requests to Google's Gemini API for
                    AI responses.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                How We Use Your Data
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Local Processing
                  </h3>
                  <p className="text-white/80">
                    All your saved content is processed and stored locally on
                    your device. We use this data to:
                  </p>
                  <ul className="text-white/80 space-y-1 ml-4 mt-2">
                    <li>• Create searchable indexes</li>
                    <li>• Generate semantic embeddings for smart search</li>
                    <li>• Organize content into your custom categories</li>
                    <li>• Provide context-aware AI responses</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    AI Responses
                  </h3>
                  <p className="text-white/80">
                    When you ask UrMind a question, we send your question and
                    relevant context to Google's Gemini API. We don't send your
                    full browsing history - only the specific context needed to
                    answer your question. Google doesn't store this data.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Third-Party Services
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Google Gemini API
                  </h3>
                  <p className="text-white/80">
                    We use Google's Gemini API for AI responses. Your data is
                    sent directly to Google and is subject to their privacy
                    policy. We don't store your conversations or questions
                    anywhere - we don't even have servers to store them on.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    CDN Services
                  </h3>
                  <p className="text-white/80">
                    We use Cloudflare CDN to load fonts and UI components. This
                    is standard web infrastructure and doesn't involve your
                    personal data.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Your Control
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Data Management
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-4">
                    <li>• Delete any saved content anytime</li>
                    <li>• Export your data</li>
                    <li>• Clear all data and start fresh</li>
                    <li>• Control what gets automatically indexed</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Privacy Settings
                  </h3>
                  <p className="text-white/80">
                    You can disable automatic indexing, choose between local and
                    online AI modes, and control exactly what data UrMind has
                    access to.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data Security
              </h2>
              <p className="text-white/80 leading-relaxed">
                All your data is stored locally in your browser using Chrome's
                secure storage APIs. We don't have servers at all - nothing to
                hack or compromise. Your data never leaves your device unless
                you explicitly choose to use online AI features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Updates to This Policy
              </h2>
              <p className="text-white/80 leading-relaxed">
                We'll notify you of any significant changes to this privacy
                policy through the extension. Since we don't collect your
                contact information, we'll show notifications in the extension
                interface.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p className="text-white/80 leading-relaxed">
                Questions about this privacy policy? Reach out to us on{" "}
                <a
                  href="https://github.com/benrobo/urmind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  GitHub
                </a>{" "}
                or{" "}
                <a
                  href="https://twitter.com/benaiah_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Twitter
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
