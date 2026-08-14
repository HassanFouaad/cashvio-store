import type { SVGProps } from "react";

/**
 * InstaPay branded mark SVG icon
 */
export function InstapayIcon({
  className = "h-5 w-5",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#5F259F" />
      <path
        d="M6.5 12.5L11 17L17.5 7.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="16.5" r="1.8" fill="#F8A01D" />
    </svg>
  );
}
