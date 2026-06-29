'use client';

import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import type { SortDirection } from '@/hooks/useTableSort';

interface SortableTableCellProps {
  field: string;
  label: string;
  sortDirection?: SortDirection;
  onSort: (field: string) => void;
  align?: 'left' | 'center' | 'right';
}

export function SortableTableCell({ field, label, sortDirection, onSort, align = 'left' }: SortableTableCellProps) {
  return (
    <TableCell align={align} sortDirection={sortDirection || false}>
      <TableSortLabel
        active={!!sortDirection}
        direction={sortDirection || 'asc'}
        onClick={() => onSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}
