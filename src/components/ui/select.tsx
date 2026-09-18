"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectOption {
      value: string;
      label: string;
}

interface SelectProps
      extends Omit<
            React.SelectHTMLAttributes<HTMLSelectElement>,
            "value" | "onChange" | "defaultValue" | "children"
      > {
      value: string;
      onChange: (value: string) => void;
      options: SelectOption[];
      placeholder?: string;
}

/** Native pickers retain their labels, form attributes and mobile touch targets. */
export function Select({
      value,
      onChange,
      options,
      placeholder,
      className,
      ...props
}: SelectProps): React.JSX.Element {
      return (
            <div className={cn("relative min-w-0", className)}>
                  <select
                        {...props}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className={cn(
                              "h-11 w-full appearance-none rounded-md border border-input bg-background ps-3 pe-8 py-2 text-sm",
                              "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                              "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                        )}
                  >
                        {placeholder && (
                              <option value="" disabled>
                                    {placeholder}
                              </option>
                        )}
                        {options.map((option) => (
                              <option key={option.value} value={option.value}>
                                    {option.label}
                              </option>
                        ))}
                  </select>
                  <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
            </div>
      );
}
