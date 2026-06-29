'use client';

import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * Hook for managing table sorting state and logic.
 * Works with any array of objects.
 */
export function useTableSort<T extends Record<string, any>>(
  data: T[],
  defaultField?: string,
  defaultDirection: SortDirection = 'asc'
) {
  const [sort, setSort] = useState<SortConfig | null>(
    defaultField ? { field: defaultField, direction: defaultDirection } : null
  );

  const handleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (prev?.field === field) {
        // Toggle direction, or clear if already desc
        if (prev.direction === 'asc') return { field, direction: 'desc' };
        return null; // Clear sort
      }
      return { field, direction: 'asc' };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sort.direction === 'asc' ? 1 : -1;
      if (bVal == null) return sort.direction === 'asc' ? -1 : 1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort]);

  return {
    sortedData,
    sort,
    handleSort,
    getSortDirection: (field: string): SortDirection | undefined =>
      sort?.field === field ? sort.direction : undefined,
  };
}
