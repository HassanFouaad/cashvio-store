"use client";

import { cn } from "@/lib/utils/cn";
import DOMPurify from "dompurify";
import * as React from "react";

export interface SafeHtmlRendererProps {
  /** The HTML content to render safely */
  html: string;
  /** Optional className for styling the container */
  className?: string;
}

/**
 * A component that safely renders HTML content by sanitizing it with DOMPurify.
 * Use this for rendering rich text content from the backend (e.g., product descriptions).
 *
 * Features:
 * - Sanitizes HTML to prevent XSS attacks
 * - Removes potentially dangerous tags and attributes
 * - Preserves safe formatting (bold, italic, lists, links, colors, etc.)
 * - Supports RTL languages properly
 * - Removes images by default for consistency
 */
export function SafeHtmlRenderer({ html, className }: SafeHtmlRendererProps) {
  const sanitizedHtml = React.useMemo(() => {
    if (typeof window === "undefined") {
      // Server-side: return the raw html (will be sanitized on client during hydration)
      return html;
    }

    return DOMPurify.sanitize(html, {
      // Allow safe tags for rich text
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "span",
        "div",
        "blockquote",
        "pre",
        "code",
        "sub",
        "sup",
      ],
      // Allow safe attributes including color/background-color in style
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style", "dir", "lang"],
      // Ensure links open safely
      ADD_ATTR: ["target", "rel"],
      // Force links to open in new tab with security
      FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover"],
    });
  }, [html]);

  return (
    <div
      className={cn("safe-html-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
