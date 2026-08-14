import type { SVGProps } from "react";

/**
 * Mobile wallet SVG icon for Vodafone Cash, Orange Cash, Etisalat Cash, etc.
 */
export function WalletIcon({
  className = "h-5 w-5",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="14" x="2" y="5" rx="3" />
      <path d="M2 10h20" />
      <path d="M16 14h2" />
    </svg>
  );
}
