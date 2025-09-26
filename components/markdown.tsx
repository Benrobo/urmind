import { cn } from "@/lib/utils";
import React, { memo } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type MarkdownRendererProps = {
  markdownString: string;
  className?: string;
};

const MarkdownRenderer = memo(function MarkdownRenderer({
  markdownString,
  className,
}: MarkdownRendererProps) {
  if (!markdownString) return null;

  const cleanMarkdown = markdownString
    .replace(/^```markdown\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  return (
    <div className={cn("w-full h-auto text-xs font-geistmono", className)}>
      <Markdown
        children={cleanMarkdown}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-3">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-[15px] font-bold mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[15px] font-medium mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-medium mb-2">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-[4px]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-[4px]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => <pre className="mb-4">{children}</pre>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-100 hover:text-cyan-101 underline transition-colors duration-200"
            >
              {children}
            </a>
          ),
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                PreTag="div"
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
                style={oneDark}
                customStyle={{
                  fontFamily: "Geist Mono",
                }}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      />
    </div>
  );
});

export default MarkdownRenderer;
