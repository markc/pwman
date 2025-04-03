'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import moment from 'moment';
import { IndeterminateCheckbox } from '@/components/ui/indeterminate-checkbox';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type User = {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    password: string;
    remember_token: string | null;
    created_at: string;
    updated_at: string;
    row_number?: number;
};

export const columns: ColumnDef<User>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <div className="flex h-full w-full items-center justify-center">
                <IndeterminateCheckbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={() => {
                        // If checkbox is currently checked (all rows selected) 
                        // or has indeterminate state (some rows selected)
                        // then clicking it should deselect all rows
                        if (table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()) {
                            table.toggleAllPageRowsSelected(false);
                        } else {
                            // If no rows are selected, select all rows
                            table.toggleAllPageRowsSelected(true);
                        }
                    }}
                    aria-label="Select all"
                    indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex h-full w-full items-center justify-center">
                <IndeterminateCheckbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false, // Cannot hide the select column
        size: 40,
    },
    // ID column - hidden by default
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: true,
        enableHiding: true,
        size: 80,
        // Initially hidden
        enableColumnFilter: true,
    },
    // Name column - visible by default
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableHiding: true, // Can be hidden from column selector
        cell: ({ row, getValue, column }) => {
            // Access the cell's value
            const initialValue = getValue() as string;
            
            // For inline editing, we can use the meta property to store edit state
            return (
                <div
                    className="w-full h-full px-1 py-1 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                    data-editable-cell
                >
                    <input
                        className="w-full bg-transparent focus:outline-none"
                        value={initialValue}
                        onChange={e => {
                            // Get column meta info for the update handler
                            const updateData = column.columnDef.meta?.updateData;
                            
                            // If an update handler is provided, call it with row ID and new value
                            if (updateData) {
                                updateData(row.original.id, e.target.value);
                            }
                        }}
                        onBlur={e => {
                            // Similar handling for blur event (when user is done editing)
                            const onCellBlur = column.columnDef.meta?.onCellBlur;
                            if (onCellBlur && e.target.value !== initialValue) {
                                onCellBlur(row.original.id, e.target.value);
                            }
                        }}
                    />
                </div>
            );
        },
    },
    // Email column - visible by default
    {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
        enableHiding: true, // Can be hidden from column selector
    },
    // Email Verified At column - hidden by default
    {
        accessorKey: 'email_verified_at',
        header: 'Verified at',
        enableSorting: true,
        enableHiding: true,
        sortingFn: 'datetime',
        cell: ({ row }) => {
            const date = row.getValue<string | Date | null>('email_verified_at');
            return date ? moment(date).format('DD MMMM YYYY HH:mm') : 'Not verified';
        },
    },
    
    // Password column (hashed) - hidden by default, limited display
    {
        accessorKey: 'password',
        header: 'Password Hash',
        enableSorting: false,
        enableHiding: true,
        cell: () => {
            return '••••••••'; // Always show dots for security
        },
    },
    
    // Remember Token column - hidden by default
    {
        accessorKey: 'remember_token',
        header: 'Remember Token',
        enableSorting: false,
        enableHiding: true,
        cell: ({ row }) => {
            const token = row.getValue<string | null>('remember_token');
            return token ? '••••••••' : 'None'; // Always show dots for security if exists
        },
    },
    
    // Created At column - hidden by default
    {
        id: 'Created at',
        accessorKey: 'created_at',
        header: 'Created at',
        enableSorting: true,
        enableHiding: true, // Can be hidden from column selector
        sortingFn: 'datetime',
        cell: ({ row }) => {
            const date = row.getValue<string | Date>('Created at');
            return date ? moment(date).format('DD MMMM YYYY') : '';
        },
    },
    
    // Updated At column - visible by default
    {
        id: 'Updated at',
        accessorKey: 'updated_at',
        header: 'Updated at',
        enableSorting: true,
        enableHiding: true, // Can be hidden from column selector
        sortingFn: 'datetime',
        cell: ({ row }) => {
            const date = row.getValue<string | Date>('Updated at');
            return date ? moment(date).format('DD MMMM YYYY') : '';
        },
    },
    {
        id: 'actions',
        meta: {
            align: 'right',
        },
        enableSorting: false,
        cell: ({ row, column }) => {
            const user = row.original;

            // These functions will be defined in the parent component and passed via column meta
            const onEdit = column.columnDef.meta?.onEdit;
            const onDelete = column.columnDef.meta?.onDelete;

            return (
                <div className="flex justify-end gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => onEdit?.(user)}
                                >
                                    <span className="sr-only">Edit user</span>
                                    <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit user</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => onDelete?.(user)}
                                >
                                    <span className="sr-only">Delete user</span>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Delete user</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            );
        },
        enableHiding: false,
    },
];
