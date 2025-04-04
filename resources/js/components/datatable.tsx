'use client';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableProps } from '@/types/datatable';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    OnChangeFn,
    PaginationState,
    Table as reactTable,
    RowSelectionState,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronDown, FileDown, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
// import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from './ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DataTablePaginationProps {
    table: reactTable<unknown>;
    actualTotal?: number; // Actual total count from the server
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    pagination,
    setPagination,
    searchQuery,
    setSearchQuery,
    addButtonText = 'Add User',
    onAddClick,
    onSortingChange,
    initialSorting = [],
    onRowSelectionChange,
    initialRowSelection = {},
    onDeleteSelected,
    tableRef, // Add table reference to expose table instance
    totalCount, // Add total count from API response
}: DataTableProps<TData, TValue> & {
    pageCount: number;
    pagination: PaginationState;
    setPagination: OnChangeFn<PaginationState>;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    addButtonText?: string;
    onAddClick?: () => void;
    onSortingChange?: OnChangeFn<SortingState>;
    initialSorting?: SortingState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    initialRowSelection?: RowSelectionState;
    onDeleteSelected?: (selectedRows: RowSelectionState) => void;
    tableRef?: React.MutableRefObject<unknown>; // Add optional table ref for external control
    totalCount?: number; // The actual total count of records from the server
}) {
    // All column visibility defaults
    console.log("Setting up column visibility");
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        // Show only Name, Email and Clear Password by default
        id: false,
        name: true,
        email: true,
        'Created at': false,
        email_verified_at: false,
        password: false,
        remember_token: false,
        'Last update': false, 
        'Updated at': false,  // Hide Updated at column
        clearpw: true,        // Show Clear Password column
        emailpw: false,
        active: false,        // Hide Active column
        uid: false,
        gid: false,
        home: false
    });
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);

    // Handle sorting changes - either use external handler or local state
    const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
        setSorting(newSorting);
        if (onSortingChange) {
            onSortingChange(newSorting);
        }
    };

    // Handle row selection changes
    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        setRowSelection(newSelection);
        if (onRowSelectionChange) {
            onRowSelectionChange(newSelection);
        }
    };

    // Debug column definitions
    console.log("Column definitions:", columns.map(col => ({
        id: col.id || col.accessorKey,
        accessorKey: col.accessorKey
    })));
    
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: !!onSortingChange, // Manual sorting if external handler is provided
        pageCount,
        state: {
            pagination,
            columnVisibility,
            sorting,
            rowSelection,
        },
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: handleSortingChange,
        onRowSelectionChange: handleRowSelectionChange,
        enableSorting: true,
        enableMultiSort: false,
        enableRowSelection: true,
        enableMultiRowSelection: true,
    });

    // Log the column visibility when it changes
    useEffect(() => {
        console.log("Column visibility state:", columnVisibility);
        console.log("All table columns:", table.getAllColumns().map(c => ({
            id: c.id,
            isVisible: c.getIsVisible()
        })));
    }, [columnVisibility, table]);

    // If tableRef is provided, expose the table instance
    if (tableRef) {
        tableRef.current = table;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-4">
                    {/* Page size selector */}
                    <Select
                        value={pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            const size = parseInt(value);
                            setPagination((prev) => ({
                                ...prev,
                                pageIndex: 0, // Reset to first page when changing page size
                                pageSize: size,
                            }));
                        }}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 items</SelectItem>
                            <SelectItem value="10">10 items</SelectItem>
                            <SelectItem value="20">20 items</SelectItem>
                            <SelectItem value="30">30 items</SelectItem>
                            <SelectItem value="40">40 items</SelectItem>
                            <SelectItem value="50">50 items</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Search input - moved to left, reduced width */}
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-[200px] pl-8"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Delete selected rows button */}
                    {Object.keys(table.getState().rowSelection || {}).length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="mr-2 gap-1"
                            onClick={() => onDeleteSelected?.(table.getState().rowSelection)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete {Object.keys(table.getState().rowSelection || {}).length} selected
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 gap-1 font-normal"
                        onClick={() => {
                            // Get all rows' data (either just visible rows or all rows)
                            const dataToExport = data;

                            // Get visible columns (excluding the select/checkbox column)
                            const visibleColumns = table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        column.getIsVisible() && column.id !== 'select' && column.id !== 'actions',
                                );

                            // Create CSV header row
                            const headers = visibleColumns.map((column) => {
                                // Use header display text or column ID
                                return column.columnDef.header?.toString() || column.id;
                            });

                            // Create CSV rows for each data item
                            const rows = dataToExport.map((item) => {
                                return visibleColumns.map((column) => {
                                    // Access the data using the column's ID or accessorKey
                                    const accessor = column.id;
                                    let value;

                                    // Special handling for the "Last update" column which uses updated_at
                                    if (accessor === 'Last update') {
                                        // @ts-expect-error - Get the updated_at field directly
                                        value = item['updated_at'];
                                        // Format date for CSV
                                        if (value) {
                                            value = new Date(value).toLocaleString();
                                        }
                                    } else {
                                        // @ts-expect-error - Standard accessor for other columns
                                        value = item[accessor];
                                    }
                                    // Format the value for CSV
                                    return value !== null && value !== undefined
                                        ? typeof value === 'object'
                                            ? JSON.stringify(value)
                                            : String(value)
                                        : '';
                                });
                            });

                            // Combine headers and rows
                            const csvContent = [headers, ...rows]
                                .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                                .join('\n');

                            // Create and download the CSV file
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', 'table-export.csv');
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <FileDown className="h-4 w-4" />
                        Export CSV
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="font-normal">
                                Show columns <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {onAddClick && (
                        <Button className="gap-1 font-medium" onClick={onAddClick}>
                            <Plus className="h-4 w-4" />
                            {addButtonText}
                        </Button>
                    )}
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Get if the column is sortable
                                    const isSortable = header.column.getCanSort();
                                    // Get the current sort direction
                                    const sorted = header.column.getIsSorted();

                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{
                                                width: header.getSize() !== 150 ? header.getSize() : undefined,
                                            }}
                                            className={`${
                                                header.column.columnDef.meta?.align === 'right' ? 'text-right' : ''
                                            } ${isSortable ? 'cursor-pointer select-none' : ''}`}
                                            onClick={
                                                isSortable ? header.column.getToggleSortingHandler() : undefined
                                            }
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}

                                                {isSortable && (
                                                    <div className="ml-1 flex h-4 w-4 items-center justify-center">
                                                        {sorted === 'asc' ? (
                                                            <ArrowUp className="h-3 w-3" />
                                                        ) : sorted === 'desc' ? (
                                                            <ArrowDown className="h-3 w-3" />
                                                        ) : (
                                                            <div className="h-3 w-3 text-transparent">·</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={
                                                cell.column.columnDef.meta?.align === 'right'
                                                    ? 'text-right'
                                                    : undefined
                                            }
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table as unknown as reactTable<unknown>} actualTotal={totalCount} />
        </div>
    );
}

function DataTablePagination({ table, actualTotal }: DataTablePaginationProps) {
    const { pageIndex, pageSize } = table.getState().pagination;
    const pageCount = table.getPageCount();

    // Use the actual total from server if provided, otherwise estimate
    const totalRows = actualTotal !== undefined ? actualTotal : pageCount * pageSize;

    // Calculate the actual range of visible rows
    const rowCount = table.getRowModel().rows.length;
    const startRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
    const endRow = startRow + rowCount - 1;

    // Get information about selected rows
    const selectedRowCount = Object.keys(table.getState().rowSelection || {}).length;

    const handlePreviousPage = () => {
        if (table.getCanPreviousPage()) {
            table.previousPage();
        }
    };

    const handleNextPage = () => {
        if (table.getCanNextPage()) {
            table.nextPage();
        }
    };

    const handlePageClick = (page: number) => {
        table.setPageIndex(page - 1);
    };

    return (
        <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground w-[240px] text-sm">
                {selectedRowCount > 0 ? (
                    <span className="text-primary font-medium">
                        {selectedRowCount} {selectedRowCount === 1 ? 'row' : 'rows'} selected
                    </span>
                ) : (
                    <span>
                        Showing {startRow} to {endRow} of {totalRows} results
                    </span>
                )}
            </div>

            <div className="flex flex-1 justify-center">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                aria-disabled={!table.getCanPreviousPage()}
                                className={
                                    !table.getCanPreviousPage()
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer'
                                }
                                onClick={handlePreviousPage}
                            />
                        </PaginationItem>

                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    className="cursor-pointer"
                                    isActive={pageIndex + 1 === page}
                                    onClick={() => handlePageClick(page)}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                aria-disabled={!table.getCanNextPage()}
                                className={
                                    !table.getCanNextPage() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                }
                                onClick={handleNextPage}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Action buttons for selected rows */}
            <div className="flex w-[240px] justify-end">
                {selectedRowCount > 0 && (
                    <Button variant="outline" size="sm" onClick={() => table.resetRowSelection()}>
                        Clear Selection
                    </Button>
                )}
            </div>
        </div>
    );
}
