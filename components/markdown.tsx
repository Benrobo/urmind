import { cn } from "@/lib/utils";
import React from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type MarkdownRendererProps = {
  markdownString: string;
  className?: string;
};

export default function MarkdownRenderer({
  markdownString,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("w-full h-auto text-xs font-geistmono", className)}>
      <Markdown
        children={markdownString}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
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
}
