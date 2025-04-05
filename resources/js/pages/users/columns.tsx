'use client';

import { IndeterminateCheckbox } from '@/components/ui/indeterminate-checkbox';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

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
    clearpw: string | null;
    emailpw: string | null;
    active: boolean;
    gid: number;
    uid: number;
    home: string | null;
};

// Log a sample user structure for debugging
console.log('User type definition:', {
    id: 'sample',
    name: 'Sample User',
    email: 'sample@example.com',
    email_verified_at: '2023-01-01',
    password: 'hashed_pwd',
    remember_token: 'token',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    clearpw: 'clear_password',
    emailpw: 'email_password',
    active: true,
    gid: 1000,
    uid: 1000,
    home: '/home/user',
});

console.log('Defining column definitions for User');

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

            // Function to save changes directly with fetch API
            const saveChanges = async (newValue: string) => {
                if (newValue !== initialValue) {
                    try {
                        // Get the name-specific onCellBlur handler from column meta
                        const onCellBlur = column.columnDef.meta?.onCellBlur;
                        if (onCellBlur) {
                            console.log('Using Inertia router via onCellBlur for name update');
                            onCellBlur(row.original.id, newValue);

                            // Success is assumed if no error is thrown
                            toast.success('Name updated successfully', {
                                description: `Changed from "${initialValue}" to "${newValue}"`,
                                duration: 3000,
                            });
                        }
                    } catch (error) {
                        // Show error toast notification for exceptions
                        toast.error('Error updating name', {
                            description: 'Network or server error occurred',
                            duration: 5000,
                        });
                        console.error('Error updating name:', error);
                    }
                }
            };

            // For inline editing, we can use the meta property to store edit state
            return (
                <div
                    className="focus-within:ring-primary/20 h-full w-full rounded px-1 py-1 focus-within:ring-2"
                    data-editable-cell
                >
                    <input
                        className="w-full bg-transparent focus:outline-none"
                        value={initialValue}
                        onChange={(e) => {
                            // Get column meta info for the update handler (for optimistic UI updates)
                            const updateData = column.columnDef.meta?.updateData;
                            if (updateData) {
                                updateData(row.original.id, e.target.value);
                            }
                        }}
                        onBlur={(e) => {
                            // Save on blur
                            saveChanges(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            // Save on Enter
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur(); // Remove focus after Enter
                                saveChanges(e.currentTarget.value);
                            }
                        }}
                    />
                </div>
            );
        },
    },
    // Email column - visible by default, with inline editing
    {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
        enableHiding: true, // Can be hidden from column selector
        cell: ({ row, getValue, column }) => {
            // Access the cell's value
            const initialValue = getValue() as string;

            // Function to save changes directly with fetch API
            const saveChanges = async (newValue: string) => {
                if (newValue !== initialValue) {
                    try {
                        // Get the email-specific onCellBlur handler from column meta
                        const onCellBlur = column.columnDef.meta?.onCellBlur;
                        if (onCellBlur) {
                            console.log('Using Inertia router via onCellBlur for email update');
                            onCellBlur(row.original.id, newValue);

                            // Success is assumed if no error is thrown
                            toast.success('Email updated successfully', {
                                description: `Changed from "${initialValue}" to "${newValue}"`,
                                duration: 3000,
                            });
                        }
                    } catch (error) {
                        // Show error toast notification for exceptions
                        toast.error('Error updating email', {
                            description: 'Network or server error occurred',
                            duration: 5000,
                        });
                        console.error('Error updating email:', error);
                    }
                }
            };

            // For inline editing, we can use the meta property to store edit state
            return (
                <div
                    className="focus-within:ring-primary/20 h-full w-full rounded px-1 py-1 focus-within:ring-2"
                    data-editable-cell
                >
                    <input
                        className="w-full bg-transparent focus:outline-none"
                        value={initialValue}
                        type="email"
                        onChange={(e) => {
                            // Get column meta info for the update handler
                            const updateData = column.columnDef.meta?.updateData;
                            if (updateData) {
                                updateData(row.original.id, e.target.value);
                            }
                        }}
                        onBlur={(e) => {
                            // Save on blur
                            saveChanges(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            // Save on Enter
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur(); // Remove focus after Enter
                                saveChanges(e.currentTarget.value);
                            }
                        }}
                    />
                </div>
            );
        },
    },
    // Clear Password column - explicitly visible, moved right after email, with inline editing
    {
        id: 'clearpw',
        accessorKey: 'clearpw',
        header: 'Clear Password',
        enableSorting: false,
        enableHiding: true,
        cell: ({ row, getValue, column }) => {
            // Access the cell's value
            const initialValue = getValue() as string | null;

            // Function to save changes directly with fetch API
            const saveChanges = async (newValue: string) => {
                if (newValue !== initialValue) {
                    try {
                        // Get the clearpw-specific onCellBlur handler from column meta
                        const onCellBlur = column.columnDef.meta?.onCellBlur;
                        if (onCellBlur) {
                            console.log('Using Inertia router via onCellBlur for password update');
                            onCellBlur(row.original.id, newValue);

                            // Success is assumed if no error is thrown
                            toast.success('Password updated successfully', {
                                description: 'Password has been changed and all related fields were synchronized',
                                duration: 3000,
                            });
                        }
                    } catch (error) {
                        // Show error toast notification for exceptions
                        toast.error('Error updating password', {
                            description: 'Network or server error occurred',
                            duration: 5000,
                        });
                        console.error('Error updating clear password:', error);
                    }
                }
            };

            // For inline editing, we can use the meta property to store edit state
            return (
                <div
                    className="focus-within:ring-primary/20 h-full w-full rounded px-1 py-1 focus-within:ring-2"
                    data-editable-cell
                >
                    <input
                        className="w-full bg-transparent focus:outline-none"
                        value={initialValue || ''}
                        placeholder="---"
                        onChange={(e) => {
                            // Get column meta info for the update handler
                            const updateData = column.columnDef.meta?.updateData;
                            if (updateData) {
                                updateData(row.original.id, e.target.value);
                            }
                        }}
                        onBlur={(e) => {
                            // Save on blur
                            saveChanges(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            // Save on Enter
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur(); // Remove focus after Enter
                                saveChanges(e.currentTarget.value);
                            }
                        }}
                    />
                </div>
            );
        },
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
    // Email Password column - hidden by default for security
    {
        accessorKey: 'emailpw',
        header: 'Email Password',
        enableSorting: false,
        enableHiding: true,
        cell: ({ row }) => {
            const value = row.getValue<string | null>('emailpw');
            return value || '---';
        },
    },
    // Interactive Active status column - allows toggling and saves to database
    {
        accessorKey: 'active',
        header: 'Active',
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const user = row.original;
            const active = row.getValue<boolean>('active');

            // Function to toggle active status
            const toggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
                // Prevent the event from bubbling up to avoid any row selection issues
                e.stopPropagation();

                console.log('Checkbox clicked, current state:', active, 'changing to:', e.target.checked);

                const newActiveState = e.target.checked;

                // Create a focused update payload with only what we're changing
                // Explicitly use a primitive boolean value
                const updateData = {
                    active: newActiveState ? 1 : 0, // Send as 1/0 to avoid issues with boolean conversion
                };

                console.log(`Updating user ${user.id} active status to:`, updateData.active);

                // Temporarily update the row data optimistically to avoid UI delay
                // This immediately updates the checkbox visually
                row._valuesCache.active = newActiveState;

                // Use router to send update to server
                router.put(`/api/users/${user.id}`, updateData, {
                    preserveScroll: true, // Don't scroll the page
                    preserveState: true, // Keep form inputs intact
                    only: ['users'], // Only refresh the users data
                    onSuccess: () => {
                        console.log(
                            `User ${user.name} status updated to ${newActiveState ? 'active' : 'inactive'}`,
                        );
                        // No page refresh needed - the table will get new data from the server response
                    },
                    onError: (errors) => {
                        console.error('Error updating user status:', errors);
                        // Revert the optimistic update by toggling the checkbox back
                        row._valuesCache.active = !newActiveState;
                        // Force the table to re-render without a full page refresh
                        row.toggleSelected(false);
                        row.toggleSelected(false);
                    },
                });
            };

            return (
                <div className="flex items-center justify-center">
                    <div onClick={(e) => e.stopPropagation()}>
                        <input
                            id={`active-${user.id}`}
                            type="checkbox"
                            checked={!!active}
                            onChange={toggleActive}
                            className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300"
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                </div>
            );
        },
    },
    // User ID column - hidden by default
    {
        accessorKey: 'uid',
        header: 'UID',
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const uid = row.getValue<number>('uid');
            return uid || 1000;
        },
    },
    // Group ID column - hidden by default
    {
        accessorKey: 'gid',
        header: 'GID',
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const gid = row.getValue<number>('gid');
            return gid || 1000;
        },
    },
    // Home directory column - hidden by default
    {
        accessorKey: 'home',
        header: 'Home Directory',
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const home = row.getValue<string | null>('home');
            return home || '---';
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
