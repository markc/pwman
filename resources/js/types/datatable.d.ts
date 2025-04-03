import '@tanstack/react-table';
import { ColumnDef, OnChangeFn, RowSelectionState, SortingState } from '@tanstack/react-table';
import React from 'react';

export type DataTableResponse = {
    current_page: number;
    data: User[];
    last_page: number;
    per_page: number;
    total: number;
};

export type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    addButtonText?: string; // Optional text for add button
    onAddClick?: () => void; // Optional callback for add button
    initialSorting?: SortingState; // Optional initial sorting state
    onSortingChange?: OnChangeFn<SortingState>; // Optional callback for sorting changes
    initialRowSelection?: RowSelectionState; // Optional initial row selection state
    onRowSelectionChange?: OnChangeFn<RowSelectionState>; // Optional callback for row selection changes
    onDeleteSelected?: (selectedRows: RowSelectionState) => void; // Optional callback for deleting selected rows
    tableRef?: React.MutableRefObject<unknown>; // Optional ref to access the table instance
    totalCount?: number; // Actual total count of records from the server
};

export type DataTablePaginationProps = {
    table: Table<unknown>;
};

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData, TValue> {
        align?: 'left' | 'center' | 'right';
        onEdit?: (data: TData) => void;
        onDelete?: (data: TData) => void;
        // For editable cells
        updateData?: (rowId: string | number, value: string) => void;
        onCellBlur?: (rowId: string | number, value: string) => void;
    }
}
