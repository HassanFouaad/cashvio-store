"use client";

import { useCallback, useMemo, useState } from "react";

import {
  PublicModifierGroupDto,
} from "@/features/products/types/product.types";

/**
 * Selection state for a product's modifier groups: defaults preselected,
 * single-choice groups replace on tap, multi-choice groups cap at the
 * group maximum, and required groups gate `allMinimumsMet`.
 */
export function useModifierSelection(groups: PublicModifierGroupDto[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const group of groups) {
      let taken = 0;
      for (const modifier of group.modifiers) {
        if (!modifier.isDefault) continue;
        if (group.maxSelections !== null && taken >= group.maxSelections) break;
        initial.add(modifier.id);
        taken += 1;
      }
    }
    return initial;
  });

  const toggle = useCallback(
    (group: PublicModifierGroupDto, modifierId: string) => {
      setSelectedIds((previous) => {
        const next = new Set(previous);

        if (next.has(modifierId)) {
          next.delete(modifierId);
          return next;
        }

        // Single-choice groups replace the current selection on tap
        if (group.maxSelections === 1) {
          for (const modifier of group.modifiers) {
            next.delete(modifier.id);
          }
          next.add(modifierId);
          return next;
        }

        const selectedInGroup = group.modifiers.filter((modifier) =>
          next.has(modifier.id)
        ).length;
        if (
          group.maxSelections !== null &&
          selectedInGroup >= group.maxSelections
        ) {
          return previous;
        }
        next.add(modifierId);
        return next;
      });
    },
    []
  );

  const selectedCountByGroup = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      counts.set(
        group.id,
        group.modifiers.filter((modifier) => selectedIds.has(modifier.id))
          .length
      );
    }
    return counts;
  }, [groups, selectedIds]);

  const modifiersTotal = useMemo(() => {
    let total = 0;
    for (const group of groups) {
      for (const modifier of group.modifiers) {
        if (selectedIds.has(modifier.id)) {
          total += modifier.priceDelta;
        }
      }
    }
    return total;
  }, [groups, selectedIds]);

  const allMinimumsMet = useMemo(
    () =>
      groups.every(
        (group) =>
          (selectedCountByGroup.get(group.id) ?? 0) >= group.minSelections
      ),
    [groups, selectedCountByGroup]
  );

  /** Selected ids in picker order (group order, then modifier order) */
  const selectedModifierIds = useMemo(() => {
    const ordered: string[] = [];
    for (const group of groups) {
      for (const modifier of group.modifiers) {
        if (selectedIds.has(modifier.id)) {
          ordered.push(modifier.id);
        }
      }
    }
    return ordered;
  }, [groups, selectedIds]);

  return {
    selectedIds,
    toggle,
    selectedCountByGroup,
    modifiersTotal,
    allMinimumsMet,
    selectedModifierIds,
  };
}
