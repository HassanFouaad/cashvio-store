'use client';

import { cn } from '@/lib/utils/cn';
import { ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CountryIso2,
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
} from 'react-international-phone';
import 'react-international-phone/style.css';

export interface PhoneInputProps {
  value: string;
  onChange: (phone: string, isValid: boolean) => void;
  placeholder?: string;
  defaultCountry?: CountryIso2;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

// Common country code patterns that users might type with leading zero
const COUNTRY_CODE_PATTERNS: Record<string, { code: CountryIso2; dialCode: string; leadingZeroPattern: RegExp }> = {
  // Egypt - users type 01xxxxxxx instead of +201xxxxxxx
  eg: { code: 'eg', dialCode: '20', leadingZeroPattern: /^0([1-2]\d{8,9})$/ },
  // Saudi Arabia - users type 05xxxxxxx instead of +9665xxxxxxx
  sa: { code: 'sa', dialCode: '966', leadingZeroPattern: /^0([5]\d{8})$/ },
  // UAE - users type 05xxxxxxx instead of +9715xxxxxxx
  ae: { code: 'ae', dialCode: '971', leadingZeroPattern: /^0([5]\d{8})$/ },
  // UK - users type 07xxxxxxx instead of +447xxxxxxx
  gb: { code: 'gb', dialCode: '44', leadingZeroPattern: /^0([7]\d{9})$/ },
  // US doesn't typically have this issue
};

/**
 * Sanitize phone number input
 * Handles common cases where users type local format instead of international
 * 
 * Examples:
 * - "01202021670" (Egypt local) -> "+201202021670"
 * - "+201202021670" -> "+201202021670" (no change)
 * - "+20 0120 202 1670" -> "+201202021670" (removes duplicate 0)
 */
function sanitizePhoneNumber(phone: string, currentCountry: CountryIso2): { phone: string; detectedCountry?: CountryIso2 } {
  // Remove all whitespace and non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with +, check for duplicate leading zero after country code
  if (cleaned.startsWith('+')) {
    const pattern = COUNTRY_CODE_PATTERNS[currentCountry];
    if (pattern) {
      // Pattern: +{dialCode}0{number} -> +{dialCode}{number}
      const duplicateZeroRegex = new RegExp(`^\\+${pattern.dialCode}0(\\d+)$`);
      const match = cleaned.match(duplicateZeroRegex);
      if (match) {
        cleaned = `+${pattern.dialCode}${match[1]}`;
      }
    }
    return { phone: cleaned };
  }
  
  // If doesn't start with + and has leading 0, try to detect country
  if (cleaned.startsWith('0')) {
    // First, try current country pattern
    const currentPattern = COUNTRY_CODE_PATTERNS[currentCountry];
    if (currentPattern) {
      const match = cleaned.match(currentPattern.leadingZeroPattern);
      if (match) {
        return { 
          phone: `+${currentPattern.dialCode}${match[1]}`,
          detectedCountry: currentPattern.code
        };
      }
    }
    
    // Try other known patterns
    for (const [countryCode, pattern] of Object.entries(COUNTRY_CODE_PATTERNS)) {
      if (countryCode === currentCountry) continue;
      const match = cleaned.match(pattern.leadingZeroPattern);
      if (match) {
        return { 
          phone: `+${pattern.dialCode}${match[1]}`,
          detectedCountry: pattern.code
        };
      }
    }
  }
  
  // If it's just digits without + and no leading zero, assume it needs the country code
  if (/^\d+$/.test(cleaned) && cleaned.length >= 8) {
    const pattern = COUNTRY_CODE_PATTERNS[currentCountry];
    if (pattern) {
      // Check if the number already starts with the dial code
      if (!cleaned.startsWith(pattern.dialCode)) {
        return { phone: `+${pattern.dialCode}${cleaned}` };
      }
    }
  }
  
  return { phone: cleaned };
}

/**
 * International phone input with country flags
 * - Country selector with flags and search
 * - Auto-formats phone number as user types
 * - Sanitizes common input patterns (leading zero, duplicate country code)
 * - Mobile-friendly design
 */
export function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  defaultCountry = 'eg',
  className,
  disabled,
  id,
  'aria-label': ariaLabel,
}: PhoneInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } = usePhoneInput({
    defaultCountry,
    value,
    countries: defaultCountries,
    onChange: (data) => {
      // Sanitize the phone value
      const { phone: sanitized, detectedCountry } = sanitizePhoneNumber(data.phone, country.iso2);
      
      // If we detected a different country from the input, switch to it
      if (detectedCountry && detectedCountry !== country.iso2) {
        setCountry(detectedCountry);
      }
      
      // Basic validation: has country code and at least 8 digits
      const digitsOnly = sanitized.replace(/\D/g, '');
      const isValid = digitsOnly.length >= 10 && sanitized.startsWith('+');
      
      onChange(sanitized, isValid);
    },
  });

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return defaultCountries;
    
    const query = searchQuery.toLowerCase().trim();
    return defaultCountries.filter((c) => {
      const parsedCountry = parseCountry(c);
      return (
        parsedCountry.name.toLowerCase().includes(query) ||
        parsedCountry.iso2.toLowerCase().includes(query) ||
        parsedCountry.dialCode.includes(query)
      );
    });
  }, [searchQuery]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCountrySelect = useCallback((iso2: CountryIso2) => {
    setCountry(iso2);
    setIsDropdownOpen(false);
    setSearchQuery('');
    // Focus the phone input after selecting country
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [setCountry, inputRef]);

  return (
    <div className={cn('relative flex', className)} ref={dropdownRef}>
      {/* Country Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1 px-3 py-2 border border-e-0 border-input rounded-s-md bg-muted/50',
          'hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-w-[80px]'
        )}
        aria-label="Select country"
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
      >
        <FlagImage iso2={country.iso2} className="w-6 h-4 rounded-sm object-cover" />
        <span className="text-sm text-muted-foreground">+{country.dialCode}</span>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-muted-foreground transition-transform',
          isDropdownOpen && 'rotate-180'
        )} />
      </button>

      {/* Phone Number Input */}
      <input
        ref={inputRef}
        id={id}
        type="tel"
        value={inputValue}
        onChange={handlePhoneValueChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'flex-1 h-10 rounded-e-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      />

      {/* Country Dropdown */}
      {isDropdownOpen && (
        <div 
          className={cn(
            'absolute top-full start-0 mt-1 w-72 max-h-80 z-50',
            'bg-popover border border-border rounded-lg shadow-lg overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
          )}
          role="listbox"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border sticky top-0 bg-popover">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className={cn(
                  'w-full h-9 ps-9 pe-3 rounded-md border border-input bg-background text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                )}
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-60">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const parsedCountry = parseCountry(c);
                const isSelected = parsedCountry.iso2 === country.iso2;
                
                return (
                  <button
                    key={parsedCountry.iso2}
                    type="button"
                    onClick={() => handleCountrySelect(parsedCountry.iso2)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-start transition-colors',
                      'hover:bg-muted focus:bg-muted focus:outline-none',
                      isSelected && 'bg-primary/10'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <FlagImage 
                      iso2={parsedCountry.iso2} 
                      className="w-6 h-4 rounded-sm object-cover flex-shrink-0"
                    />
                    <span className="flex-1 text-sm truncate">{parsedCountry.name}</span>
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      +{parsedCountry.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { CountryIso2 };

