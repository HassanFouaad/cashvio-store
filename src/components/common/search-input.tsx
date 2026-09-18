"use client";

import {
  useCallback,
  useState,
  useTransition,
  type FormEvent,
  type ReactElement,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { updateQueryUrl } from "@/lib/utils/query-params";

interface SearchInputProps {
  placeholder?: string;
  searchKey?: string;
  rounded?: boolean;
  trackAnalytics?: boolean;
  disabled?: boolean;
  /** A containing filter bar can share one pending navigation state. */
  onNavigate?: (url: string) => void;
}

export function SearchInput({
  placeholder,
  searchKey = "search",
  rounded = false,
  trackAnalytics = false,
  disabled = false,
  onNavigate,
}: SearchInputProps): ReactElement {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const urlSearch = searchParams.get(searchKey) || "";
  const sourceKey = JSON.stringify([pathname, searchKey, urlSearch]);
  const [syncedSource, setSyncedSource] = useState(sourceKey);
  const [inputValue, setInputValue] = useState(urlSearch);

  // Back/forward, chip removal and route changes must update the textbox.
  // Unrelated filter changes do not erase text the shopper is still typing.
  if (syncedSource !== sourceKey) {
    setSyncedSource(sourceKey);
    setInputValue(urlSearch);
  }

  const isDisabled = disabled || isNavigating;
  const navigate = useCallback(
    (value: string): void => {
      const query = searchParams.toString();
      const nextUrl = updateQueryUrl(pathname, query, {
        [searchKey]: value.trim() || null,
      });
      const currentUrl = query ? `${pathname}?${query}` : pathname;
      if (nextUrl === currentUrl) return;
      if (onNavigate) onNavigate(nextUrl);
      else startTransition(() => router.push(nextUrl, { scroll: false }));
    },
    [searchParams, pathname, searchKey, onNavigate, router],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isDisabled) return;
    const trimmed = inputValue.trim();
    setInputValue(trimmed);
    if (trackAnalytics && trimmed) {
      try {
        analytics.trackSearch({ search_term: trimmed });
      } catch {
        /* Tracking cannot block shopping. */
      }
    }
    navigate(trimmed);
  };

  const handleClear = (): void => {
    setInputValue("");
    navigate("");
  };
  const inputLabel = placeholder ?? t("search");
  const submitIcon = isNavigating ? (
    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
  ) : (
    <Search aria-hidden="true" className="h-4 w-4" />
  );

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label={inputLabel}
      aria-busy={isDisabled}
      className={cn("relative w-full", !rounded && "max-w-sm")}
    >
      <div className="relative flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              rounded ? "start-4 h-5 w-5" : "start-3 h-4 w-4",
            )}
          />
          <Input
            name={searchKey}
            type="search"
            enterKeyHint="search"
            aria-label={inputLabel}
            placeholder={placeholder ?? `${t("search")}…`}
            value={inputValue}
            disabled={isDisabled}
            onChange={(event) => setInputValue(event.target.value)}
            className={cn(
              "text-base [&::-webkit-search-cancel-button]:appearance-none",
              rounded
                ? "h-14 rounded-full bg-muted/30 ps-12 focus:bg-background"
                : "h-11 ps-10 pe-12",
              rounded && (inputValue ? "pe-28 sm:pe-40" : "pe-14 sm:pe-28"),
            )}
          />
          {rounded && (
            <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isDisabled}
                  onClick={handleClear}
                  className="h-11 w-11 rounded-full"
                  aria-label={t("clearSearch")}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                disabled={isDisabled}
                className="h-11 min-w-11 rounded-full px-3"
                aria-label={t("search")}
              >
                {submitIcon}
                <span className="ms-1.5 hidden sm:inline">{t("search")}</span>
              </Button>
            </div>
          )}
          {!rounded && inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isDisabled}
              onClick={handleClear}
              className="absolute end-0 top-1/2 h-11 w-11 -translate-y-1/2"
              aria-label={t("clearSearch")}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!rounded && (
          <Button
            type="submit"
            size="icon"
            disabled={isDisabled}
            className="h-11 w-11 shrink-0"
            aria-label={t("search")}
          >
            {submitIcon}
          </Button>
        )}
      </div>
    </form>
  );
}
