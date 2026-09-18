import { redirect } from "next/navigation";

import type { PaginationMeta } from "@/lib/api/types";
import { buildPaginationUrl, getSafePage } from "./pagination";

// Keep existing imports compatible while the URL builder stays safe to use
// from client components and plain unit tests without next/navigation.
export { buildPaginationUrl } from "./pagination";

export function validatePaginationAndRedirect(
  pagination: PaginationMeta | undefined,
  requestedPage: number,
  baseUrl: string,
  searchParams?: Record<string, string | undefined>,
): void {
  if (!pagination) return;
  const totalPages = Number(pagination.totalPages);
  if (
    !Number.isFinite(totalPages) ||
    totalPages < 1 ||
    requestedPage <= totalPages
  )
    return;
  redirect(
    buildPaginationUrl(
      baseUrl,
      getSafePage(requestedPage, totalPages),
      searchParams,
    ),
  );
}
