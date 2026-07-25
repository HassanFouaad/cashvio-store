"use client";

import { cn } from "@/lib/utils/cn";
import { isValidPhoneForCountry } from "@/lib/utils/phone";
import { Check, ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChangeEvent,
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CountryIso2,
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";
import "react-international-phone/style.css";

export interface PhoneInputProps {
  value: string;
  onChange: (phone: string, isValid: boolean) => void;
  placeholder?: string;
  /** ISO2 country code — unknown codes safely fall back to 'eg' */
  defaultCountry?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

interface CountryOption {
  iso2: CountryIso2;
  dialCode: string;
  /** English name from the library, kept so search still matches it */
  englishName: string;
  /** Name shown in the list, translated to the active locale when possible */
  label: string;
}

/**
 * Countries where people write the national number with a trunk "0" that never
 * appears in the international form (Egypt 0100… is +20 100…).
 */
const TRUNK_PREFIX_COUNTRIES = new Set(["eg", "sa", "ae", "gb"]);

const DROPDOWN_MIN_WIDTH = 240;
const DROPDOWN_MAX_WIDTH = 360;
const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_GAP = 4;
/** Breathing room kept between the panel and the viewport edges */
const VIEWPORT_MARGIN = 8;

/**
 * The visible field holds the national number only — the dial code belongs to
 * the dropdown. Reshape what people paste or type out of habit so the
 * formatter can still understand it:
 * - "+20100…" and "0020100…" keep their country, so pasting a full number works
 * - a leading "0" is a trunk prefix and gets dropped
 */
function normalizeNationalInput(value: string, countryIso2: string): string {
  if (value.startsWith("+")) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("00") && digits.length > 2) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith("0") && TRUNK_PREFIX_COUNTRIES.has(countryIso2)) {
    return digits.replace(/^0+/, "");
  }

  return value;
}

/**
 * The panel is portalled to the body so page shells with `overflow-hidden`
 * (checkout and order tracking both have one) can't clip it. That means the
 * position has to be measured off the field on every open, scroll and resize.
 * The field is always LTR, so the panel anchors to its left edge.
 */
function computePanelStyle(field: HTMLElement): CSSProperties {
  const rect = field.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;

  const width = Math.min(
    Math.max(rect.width, DROPDOWN_MIN_WIDTH),
    Math.max(DROPDOWN_MIN_WIDTH, innerWidth - VIEWPORT_MARGIN * 2),
    DROPDOWN_MAX_WIDTH,
  );

  const spaceBelow = innerHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const openUpward =
    spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
  const maxHeight = Math.min(
    DROPDOWN_MAX_HEIGHT,
    Math.max(160, (openUpward ? spaceAbove : spaceBelow) - DROPDOWN_GAP),
  );

  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rect.left),
    Math.max(VIEWPORT_MARGIN, innerWidth - width - VIEWPORT_MARGIN),
  );

  return openUpward
    ? { left, width, maxHeight, bottom: innerHeight - rect.top + DROPDOWN_GAP }
    : { left, width, maxHeight, top: rect.bottom + DROPDOWN_GAP };
}

/**
 * International phone input with country flags
 * - Dial code is owned by the dropdown and can never be typed over
 * - Auto-formats the national number as the user types
 * - Accepts pasted international numbers and local "0…" numbers
 */
export function PhoneInput({
  value,
  onChange,
  placeholder,
  defaultCountry = "eg",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: PhoneInputProps) {
  const t = useTranslations("common.phoneInput");
  const locale = useLocale();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guard against unknown ISO codes (e.g. store country not in the lib's list)
  const safeDefaultCountry = useMemo<CountryIso2>(() => {
    const exists = defaultCountries.some(
      (c) => parseCountry(c).iso2 === defaultCountry,
    );
    return exists ? (defaultCountry as CountryIso2) : "eg";
  }, [defaultCountry]);

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } =
    usePhoneInput({
      defaultCountry: safeDefaultCountry,
      value,
      countries: defaultCountries,
      // Keeps the dial code out of the text field entirely, so the only way to
      // change it is the dropdown
      disableDialCodeAndPrefix: true,
      onChange: (data) => {
        // Without a national part the library still reports "+20"; report an
        // empty value instead so callers don't treat a blank field as filled
        const hasNationalDigits = /\d/.test(data.inputValue);
        const phone = hasNationalDigits ? data.phone : "";

        onChange(phone, isValidPhoneForCountry(phone, data.country.iso2));
      },
    });

  const countryOptions = useMemo<CountryOption[]>(() => {
    let regionNames: Intl.DisplayNames | null = null;
    try {
      regionNames = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      regionNames = null;
    }

    return defaultCountries.map((c) => {
      const parsed = parseCountry(c);
      const regionCode = parsed.iso2.toUpperCase();
      let localizedName: string | undefined;
      try {
        localizedName = regionNames?.of(regionCode);
      } catch {
        localizedName = undefined;
      }

      return {
        iso2: parsed.iso2,
        dialCode: parsed.dialCode,
        englishName: parsed.name,
        // Intl falls back to the raw code for regions it doesn't know
        label:
          localizedName && localizedName !== regionCode
            ? localizedName
            : parsed.name,
      };
    });
  }, [locale]);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return countryOptions;

    return countryOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.englishName.toLowerCase().includes(query) ||
        option.iso2.toLowerCase().includes(query) ||
        option.dialCode.includes(query),
    );
  }, [countryOptions, searchQuery]);

  const updatePanelPosition = useCallback(() => {
    if (fieldRef.current) {
      setPanelStyle(computePanelStyle(fieldRef.current));
    }
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
    setSearchQuery("");
  }, []);

  // Measured before the panel renders so it never paints at a stale position
  const openDropdown = useCallback(() => {
    updatePanelPosition();
    setIsDropdownOpen(true);
  }, [updatePanelPosition]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closeDropdown();
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    // Capture phase so the panel follows scrolling in any ancestor container
    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);

    // Autofocusing search on a phone raises the keyboard over the list, so the
    // shortcut is reserved for pointer devices
    const focusTimer = window.setTimeout(() => {
      if (window.matchMedia("(pointer: fine)").matches) {
        searchInputRef.current?.focus();
      }
    }, 60);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
      window.clearTimeout(focusTimer);
    };
  }, [isDropdownOpen, closeDropdown, updatePanelPosition]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.target.value = normalizeNationalInput(
        event.target.value,
        country.iso2,
      );
      handlePhoneValueChange(event);
    },
    [country.iso2, handlePhoneValueChange],
  );

  const handleCountrySelect = useCallback(
    (iso2: CountryIso2) => {
      setCountry(iso2, { focusOnInput: true });
      closeDropdown();
    },
    [setCountry, closeDropdown],
  );

  return (
    // The control stays LTR in every language: the number is always typed in
    // Latin digits, so mirroring it in Arabic only moves the dial code away
    // from where people expect it.
    <div className={cn("relative w-full", className)} ref={containerRef} dir="ltr">
      <div
        ref={fieldRef}
        className={cn(
          "flex h-10 w-full items-stretch overflow-hidden rounded-md border border-input bg-background",
          "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <button
          type="button"
          onClick={isDropdownOpen ? closeDropdown : openDropdown}
          disabled={disabled}
          className={cn(
            "flex min-w-[4.25rem] shrink-0 items-center gap-1 border-e border-input bg-muted/50 px-2",
            "transition-colors hover:bg-muted focus:outline-none focus-visible:bg-muted",
            "disabled:cursor-not-allowed sm:gap-1.5 sm:px-2.5",
          )}
          aria-label={t("selectCountry")}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <FlagImage
            iso2={country.iso2}
            className="h-4 w-6 shrink-0 rounded-[2px] object-cover"
          />
          <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            +{country.dialCode}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              isDropdownOpen && "rotate-180",
            )}
          />
        </button>

        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder ?? t("placeholder")}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-3 text-sm outline-none",
            "placeholder:text-muted-foreground disabled:cursor-not-allowed",
          )}
        />
      </div>

      {isDropdownOpen &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            dir="ltr"
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden rounded-lg border border-border",
              "bg-popover text-popover-foreground shadow-lg",
            )}
          >
            <div className="shrink-0 border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchCountries")}
                  aria-label={t("searchCountries")}
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background ps-9 pe-3 text-sm",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                />
              </div>
            </div>

            <div
              role="listbox"
              aria-label={t("selectCountry")}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("noCountriesFound")}
                </div>
              ) : (
                filteredCountries.map((option) => {
                  const isSelected = option.iso2 === country.iso2;

                  return (
                    <button
                      key={option.iso2}
                      type="button"
                      onClick={() => handleCountrySelect(option.iso2)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors",
                        "hover:bg-muted focus:bg-muted focus:outline-none",
                        isSelected && "bg-muted",
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <FlagImage
                        iso2={option.iso2}
                        className="h-4 w-6 shrink-0 rounded-[2px] object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {option.label}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        +{option.dialCode}
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export type { CountryIso2 };
