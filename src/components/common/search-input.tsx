"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analytics } from "@/lib/analytics";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  searchKey?: string;
  /** Rounded full-width style (product listing) vs compact default */
  rounded?: boolean;
  /** Fire the analytics `search` event on submit */
  trackAnalytics?: boolean;
}

/**
 * THE search input — single implementation for every search surface.
 * - URL-synced: updates the query param on submit, resets pagination
 * - RTL-safe (logical properties only)
 * - Optional rounded variant and analytics tracking
 */
export function SearchInput({
  placeholder,
  searchKey = "search",
  rounded = false,
  trackAnalytics = false,
}: SearchInputProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current search value from URL
  const urlSearch = searchParams.get(searchKey) || "";

  // Local state for input value
  const [inputValue, setInputValue] = useState(urlSearch);

  // Create query string helper
  const createQueryString = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // Reset to page 1 on new search

      if (value.trim()) {
        params.set(searchKey, value.trim());
      } else {
        params.delete(searchKey);
      }

      return params.toString();
    },
    [searchParams, searchKey]
  );

  const navigate = useCallback(
    (value: string) => {
      const queryString = createQueryString(value);
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl);
    },
    [createQueryString, pathname, router]
  );

  // Handle search submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = inputValue.trim();
    if (trackAnalytics && trimmed) {
      try {
        analytics.trackSearch({ search_term: trimmed });
      } catch {
        // Analytics errors must never affect the store
      }
    }

    navigate(inputValue);
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue("");
    navigate("");
  };

  if (rounded) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute start-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={placeholder ?? `${t("search")}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full h-12 ps-12 pe-24 text-base rounded-full border-2 border-muted bg-muted/30 focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground/70"
          />
          <div className="absolute end-2 flex items-center gap-1">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 px-4 rounded-full"
              aria-label={t("search")}
            >
              <Search className="h-4 w-4" />
              <span className="ms-1.5 hidden sm:inline">{t("search")}</span>
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder ?? `${t("search")}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="ps-10 pe-10"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          aria-label={t("search")}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
