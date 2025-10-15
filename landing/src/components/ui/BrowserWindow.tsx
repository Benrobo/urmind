import { cn } from "@/lib/utils";

interface BrowserWindowProps {
  url?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function BrowserWindow({
  url = "localhost:1914",
  children,
  className = "",
  contentClassName = "",
}: BrowserWindowProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-white-100/10 shadow-premium-lg bg-dark-100.1",
        className
      )}
    >
      {/* Browser chrome/header */}
      <div className="bg-gray-100 border-b border-gray-102/30 px-4 py-3 flex items-center gap-3">
        {/* Mac window controls */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-305"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-100"></div>
        </div>

        {/* Address bar */}
        <div className="flex-grow flex items-center">
          <div className="flex-grow max-w-2xl mx-auto">
            <div className="bg-white-100/10 border border-white-100/20 rounded-md px-4 py-1.5 flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-white-100/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs text-white-100/60 font-jetbrains">
                {url}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className={cn("relative bg-dark-100.1", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
