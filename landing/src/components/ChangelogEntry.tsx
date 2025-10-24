import { cn } from "@/lib/utils";
import { changelogEntries } from "../data/changelogs";

type ChangelogEntryData = (typeof changelogEntries)[0];

interface ChangelogEntryProps {
  entry: ChangelogEntryData;
  isLast?: boolean;
}

export default function ChangelogEntry({
  entry,
  isLast = false,
}: ChangelogEntryProps) {
  return (
    <div className={cn("relative font-geistmono", isLast && "pb-8")}>
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[1px] top-4 w-[1px] mt-3 h-[calc(100%-2rem)] bg-white-100/10"></div>
      )}

      {/* Timeline dot */}
      <div className="absolute -left-[6px] top-1 w-4 h-4 bg-purple-100/40 flex flex-center rounded-full p-[3px]">
        <div className="w-full h-full rounded-full bg-purple-100"></div>
      </div>

      {/* Content */}
      <div className="ml-7 pb-6">
        {/* Version badge */}
        <div className="w-auto flex items-center justify-start gap-2 mb-3">
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-dark-103.1 border border-white-100/40 text-white-100 text-[10px] font-medium mb-1">
            {entry.version}
          </div>
          {entry.tags?.map((tag) => (
            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-dark-103.1 border border-white-100/40 text-white-100 text-[10px] font-medium mb-1">
              {tag}
            </div>
          ))}
        </div>

        {/* Date */}
        <div className="text-white-100/70 text-xs mb-2">{entry.date}</div>

        {/* Title */}
        <h3 className="text-white-100 text-base font-semibold mb-2 leading-tight">
          {entry.title}
        </h3>

        {/* Description */}
        <p className="text-white-100/85 text-xs leading-relaxed mb-3">
          {entry.description}
        </p>

        {/* Image */}
        {entry.image && (
          <div className="mb-3">
            <img
              src={entry.image}
              alt={entry.title}
              className="w-full max-h-60 object-cover rounded-lg border border-gray-102/30"
            />
          </div>
        )}

        {/* Features */}
        {entry.features.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-white-100/90 text-sm font-medium mb-2">
              Key Features
            </h4>
            <ul className="space-y-1">
              {entry.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-xs text-white-100/80"
                >
                  <span className="text-white-100/60 mt-1.5 text-xs">•</span>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
