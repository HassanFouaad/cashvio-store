"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  searchKey?: string;
}

/**
 * Search input with submit button
 * - User types and clicks search button to execute
 * - No focus loss (URL updates only on submit)
 * - Clean and simple UX
 *
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Search categories..."
 *   searchKey="search"
 * />
 * ```
 */
export function SearchInput({
  placeholder = "Search...",
  searchKey = "search",
}: SearchInputProps) {
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

  // Handle search submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const queryString = createQueryString(inputValue);
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(newUrl);
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue("");

    const queryString = createQueryString("");
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(newUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-10 pr-10"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
