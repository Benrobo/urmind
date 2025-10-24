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
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-102/30"></div>
      )}

      {/* Timeline dot */}
      <div className="absolute left-5 top-6 w-2 h-2 bg-purple-100 rounded-full border-2 border-gray-100/80"></div>

      {/* Content */}
      <div className="ml-12 pb-8">
        {/* Version badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100/20 border border-purple-100/30 text-purple-100 text-sm font-medium mb-3">
          {entry.version}
        </div>

        {/* Date */}
        <div className="text-white-100/60 text-sm mb-2">{entry.date}</div>

        {/* Title */}
        <h3 className="text-white-100 text-lg font-semibold mb-3">
          {entry.title}
        </h3>

        {/* Description */}
        <p className="text-white-100/80 text-sm leading-relaxed mb-4">
          {entry.description}
        </p>

        {/* Image */}
        {entry.image && (
          <div className="mb-4">
            <img
              src={entry.image}
              alt={entry.title}
              className="w-full max-h-48 object-cover rounded-lg border border-gray-102/30"
            />
          </div>
        )}

        {/* Features */}
        {entry.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white-100/90 text-sm font-medium mb-2">
              Key Features:
            </h4>
            <ul className="space-y-1">
              {entry.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-white-100/70"
                >
                  <span className="text-purple-100 mt-1.5 text-xs">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
