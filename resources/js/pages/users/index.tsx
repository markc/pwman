import { DataTable } from '@/components/datatable';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import HeadingSmall from '@/components/heading-small';
import { UserFormModal } from '@/components/user-form-modal';
import { useAppearance } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DataTableResponse } from '@/types/datatable';
import { Head, router } from '@inertiajs/react';
import { PaginationState, RowSelectionState, SortingState } from '@tanstack/react-table';
import { LoaderCircle, ShieldX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useDebounce } from '../../hooks/use-debounce';
// Force a clean import of the columns
import { columns as baseColumns, User } from './columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User list',
        href: '/user-list',
    },
];

async function getData(
    page: number = 1,
    search: string = '',
    pageSize: number = 10,
    sortField: string = 'updated_at',
    sortDirection: string = 'desc',
): Promise<DataTableResponse> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const pageSizeParam = `&per_page=${pageSize}`;
    const sortParam = `&sort=${sortField}&direction=${sortDirection}`;
    const response = await fetch(`/api/users?page=${page}${searchParam}${pageSizeParam}${sortParam}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

export default function Index() {
    const [loading, setLoading] = useState(true);
    const { appearance } = useAppearance();

    const [data, setData] = useState<User[]>([]);
    const [pageCount, setPageCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const prevSearchRef = useRef(searchQuery);
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // User form modal state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
    const [formModalTitle, setFormModalTitle] = useState('Add User');

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10, // Default page size that matches one of our dropdown options
    });

    // Sorting state - default to updated_at desc
    const [sorting, setSorting] = useState<SortingState>([{ id: 'Updated at', desc: true }]);

    // Row selection state
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Create a ref to hold the table instance for direct manipulation
    const tableRef = useRef<{ toggleAllRowsSelected: (flag: boolean) => void } | null>(null);

    // State for delete confirmation modal when deleting multiple users
    const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] = useState(false);
    const [rowsToDelete, setRowsToDelete] = useState<RowSelectionState>({});

    const fetchData = useCallback(
        async (page: number, search: string, pageSize: number) => {
            setLoading(true);

            try {
                // Get the current sort column and direction
                const sortColumn = sorting.length > 0 ? sorting[0].id : 'updated_at';
                const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

                // Map column id to database field if needed
                let sortField = sortColumn;
                if (sortColumn === 'Updated at') {
                    sortField = 'updated_at';
                }

                const response = await getData(page, search, pageSize, sortField, sortDirection);
                console.log('API response data:', response.data);

                // Log the first data item to see all available fields
                if (response.data.length > 0) {
                    console.log('First data item fields:', Object.keys(response.data[0]));
                    console.log('First data item complete:', response.data[0]);
                }

                setData(response.data);
                setPageCount(response.last_page);
                // Store total count from response for accurate count display
                setTotalCount(response.total);
            } catch (err) {
                let errorMessage = 'An unknown error occurred';
                if (err instanceof Error) {
                    errorMessage = err.message;
                }

                toast.error(`Failed to load data: ${errorMessage}`, {
                    icon: <ShieldX className="text-red-500" size={18} />,
                    cancel: {
                        label: 'close',
                        onClick: () => toast.dismiss(),
                    },
                    duration: Infinity,
                });
            } finally {
                setLoading(false);
            }
        },
        [sorting],
    );

    useEffect(() => {
        if (prevSearchRef.current !== debouncedSearchQuery) {
            prevSearchRef.current = debouncedSearchQuery;

            if (pagination.pageIndex !== 0) {
                setPagination((prev) => ({
                    ...prev,
                    pageIndex: 0,
                }));

                return;
            }
        }

        const pageIndex = pagination.pageIndex;
        const pageSize = pagination.pageSize;
        fetchData(pageIndex + 1, debouncedSearchQuery, pageSize);
    }, [pagination, debouncedSearchQuery, sorting, fetchData]); // Added fetchData as dependency

    // Handle opening modal for adding a new user
    const handleAddUser = () => {
        setCurrentUser(undefined);
        setFormModalTitle('Add User');
        setIsFormModalOpen(true);
    };

    // Handle opening modal for editing a user
    const handleEditUser = useCallback(async (user: User) => {
        try {
            // Fetch the latest user data directly from the server
            const response = await fetch(`/api/users/${user.id}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch latest user data: ${response.statusText}`);
            }

            const latestUserData = await response.json();

            // If this is a direct response, unwrap it from the 'data' property if necessary
            const userData = latestUserData.data || latestUserData;

            console.log('Latest user data for modal:', userData);

            // Update with the latest data
            setCurrentUser(userData);
            setFormModalTitle('Edit User');
            setIsFormModalOpen(true);
        } catch (error) {
            // If fetch fails, fall back to using the provided user data
            console.error('Error fetching latest user data:', error);
            toast.error('Could not fetch latest user data. Using cached data instead.');

            setCurrentUser(user);
            setFormModalTitle('Edit User');
            setIsFormModalOpen(true);
        }
    }, []);

    // Handle opening delete confirmation modal
    const handleDeleteClick = useCallback((user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    }, []);

    // Handle actual user deletion with Inertia
    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        return new Promise<void>((resolve) => {
            router.delete(`/api/users/${userToDelete.id}`, {
                onSuccess: () => {
                    toast.success(`User ${userToDelete.name} has been deleted.`, {
                        description: 'The user has been removed from the system.',
                        duration: 3000,
                    });

                    // Force a reset to the first page and fetch fresh data
                    setPagination((prev) => ({
                        ...prev,
                        pageIndex: 0,
                    }));

                    // Add a small delay to ensure state is updated before fetching
                    setTimeout(() => {
                        fetchData(1, debouncedSearchQuery, pagination.pageSize);
                    }, 100);

                    // Clear any row selection
                    setRowSelection({});

                    resolve();
                },
                onError: (errors) => {
                    // Check if this is a "not found" error
                    const errorValues = Object.values(errors);
                    const isNotFoundError = errorValues.some((msg) =>
                        msg.toString().toLowerCase().includes('not found'),
                    );

                    if (isNotFoundError) {
                        toast.error('User not found', {
                            description: 'This user may have already been deleted. Refreshing data.',
                            duration: 5000,
                        });

                        // Force full refresh to sync with database
                        setPagination((prev) => ({
                            ...prev,
                            pageIndex: 0,
                        }));

                        setTimeout(() => {
                            fetchData(1, debouncedSearchQuery, pagination.pageSize);
                        }, 100);
                    } else {
                        toast.error('Failed to delete user', {
                            description: errorValues.join('\n'),
                            duration: 5000,
                        });
                    }

                    // Still clear row selection on error
                    setRowSelection({});

                    resolve();
                },
                onFinish: () => {
                    // Always close the delete modal
                    setIsDeleteModalOpen(false);
                },
            });
        });
    };

    // Handle success toast
    const handleOperationSuccess = (message: string) => {
        toast.success(message, { duration: 3000 });

        // Force a reset to the first page for fresh data
        setPagination((prev) => ({
            ...prev,
            pageIndex: 0,
        }));

        // Add a small delay to ensure state is updated before fetching
        setTimeout(() => {
            fetchData(1, debouncedSearchQuery, pagination.pageSize);
        }, 100);
    };

    // Handle error toast
    const handleOperationError = (message: string) => {
        toast.error('Operation failed', {
            description: message,
            duration: 5000,
        });
    };

    // Handler for the delete selected button
    const handleDeleteSelected = (selectedRows: RowSelectionState) => {
        setRowsToDelete(selectedRows);
        setIsDeleteMultipleModalOpen(true);
    };

    // Handler for confirming multiple delete
    const handleConfirmMultipleDelete = async () => {
        // Get the actual database IDs of the selected rows, not just the row indices
        const selectedRowIndices = Object.keys(rowsToDelete);
        const selectedUserIds = selectedRowIndices
            .map((index) => {
                // Convert string index to integer to access data array directly
                const rowIndex = parseInt(index);
                // Access the user data at that index
                const user = data[rowIndex];
                console.log(`Row index ${rowIndex} maps to user:`, user);
                return user?.id; // Return the actual database ID
            })
            .filter((id) => id !== undefined) as string[]; // Filter out any undefined IDs

        const count = selectedUserIds.length;

        if (count === 0) return;

        // Close the modal first to prevent double-clicks
        setIsDeleteMultipleModalOpen(false);

        // Track progress with a toast
        const progressToastId = toast.loading(`Deleting ${count} users...`);

        // Log the selected IDs for debugging
        console.log('Row indices from rowsToDelete:', selectedRowIndices);
        console.log('Data array length:', data.length);
        console.log('First few items in data array:', data.slice(0, 3));
        console.log('Mapped user IDs for deletion:', selectedUserIds);

        // Dump the entire data structure for debugging
        console.log('Full data array with all user objects:', JSON.stringify(data));

        try {
            // Use fetch directly instead of Inertia router
            const response = await fetch('/api/users/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ ids: selectedUserIds }),
            });

            // Parse the JSON response
            const responseData = await response.json();
            console.log('Batch delete response:', responseData);

            const deleted = responseData.deleted || 0;
            const failed = responseData.failed || 0;
            const errors = responseData.errors || [];

            // Dismiss progress toast
            toast.dismiss(progressToastId);

            // Show success toast if any users were deleted
            if (deleted > 0) {
                toast.success(`Successfully deleted ${deleted} users`, {
                    duration: 3000,
                });
            }

            // Show error toast if any deletions failed
            if (failed > 0) {
                // Create a more user-friendly error message
                const errorMessage =
                    errors.length > 0
                        ? `Some users could not be deleted: ${errors.join('. ')}`
                        : `Failed to delete ${failed} users`;

                toast.error(`Failed to delete ${failed} users`, {
                    description: errorMessage,
                    duration: 5000,
                });

                // Log detailed error information for debugging
                console.warn('Deletion errors:', errors);
            }

            // Reset all checkboxes properly using the table instance
            if (tableRef.current) {
                // Use the table instance to properly clear all row selections
                tableRef.current.toggleAllRowsSelected(false);
            }
            setRowSelection({});

            // Fetch updated data after deletion is complete
            // Reset to first page in case deleted items affect pagination
            fetchData(1, debouncedSearchQuery, pagination.pageSize);
        } catch (error) {
            console.error('Batch delete error:', error);

            // Dismiss progress toast
            toast.dismiss(progressToastId);

            // Even on error, reset selection to clear checkboxes
            if (tableRef.current) {
                // Use the table instance to properly clear all row selections
                tableRef.current.toggleAllRowsSelected(false);
            }
            setRowSelection({});

            // Refresh data
            fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);

            // Show error toast
            toast.error('Failed to delete users', {
                description: error instanceof Error ? error.message : 'Unknown error',
                duration: 5000,
            });

            // Reset row selection
            setRowSelection({});
        }
    };

    // Generic field update handler for all inline editable fields
    const handleFieldUpdate = useCallback((userId: string | number, fieldName: string, newValue: string) => {
        // Optimistically update the local data
        setData((prev) => prev.map((user) => (user.id === userId ? { ...user, [fieldName]: newValue } : user)));
    }, []);

    // Specific field update handlers
    const handleNameUpdate = useCallback(
        (userId: string | number, newValue: string) => {
            handleFieldUpdate(userId, 'name', newValue);
        },
        [handleFieldUpdate],
    );

    const handleEmailUpdate = useCallback(
        (userId: string | number, newValue: string) => {
            handleFieldUpdate(userId, 'email', newValue);
        },
        [handleFieldUpdate],
    );

    const handleClearPwUpdate = useCallback(
        (userId: string | number, newValue: string) => {
            handleFieldUpdate(userId, 'clearpw', newValue);
        },
        [handleFieldUpdate],
    );

    // Field blur handlers that actually save the data
    const handleNameBlur = useCallback(
        async (userId: string | number, newValue: string) => {
            const toastId = toast.loading('Updating name...');
            try {
                // Make a simple update to just change the name
                const apiResponse = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ name: newValue }),
                    credentials: 'same-origin',
                });

                const result = await apiResponse.json();

                if (apiResponse.ok) {
                    toast.success('Name updated successfully', { id: toastId, duration: 2000 });
                    // Update the data table
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                } else {
                    toast.error(`Failed to update: ${result.message || 'Server error'}`, {
                        id: toastId,
                        duration: 3000,
                    });
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                }
            } catch (error) {
                console.error('Error updating name:', error);
                toast.error('Network error when updating name', { id: toastId, duration: 3000 });
                fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
            }
        },
        [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, fetchData],
    );

    const handleEmailBlur = useCallback(
        async (userId: string | number, newValue: string) => {
            const toastId = toast.loading('Updating email...');
            try {
                // Make a simple update to just change the email
                const apiResponse = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ email: newValue }),
                    credentials: 'same-origin',
                });

                const result = await apiResponse.json();

                if (apiResponse.ok) {
                    toast.success('Email updated successfully', { id: toastId, duration: 2000 });
                    // Update the data table
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                } else {
                    toast.error(`Failed to update: ${result.message || 'Server error'}`, {
                        id: toastId,
                        duration: 3000,
                    });
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                }
            } catch (error) {
                console.error('Error updating email:', error);
                toast.error('Network error when updating email', { id: toastId, duration: 3000 });
                fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
            }
        },
        [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, fetchData],
    );

    const handleClearPwBlur = useCallback(
        async (userId: string | number, newValue: string) => {
            const toastId = toast.loading('Updating password...');
            try {
                // Make a simple update to just change the password
                const apiResponse = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ clearpw: newValue }),
                    credentials: 'same-origin',
                });

                const result = await apiResponse.json();

                if (apiResponse.ok) {
                    toast.success('Password updated successfully', { id: toastId, duration: 2000 });
                    // Update the data table
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                } else {
                    toast.error(`Failed to update: ${result.message || 'Server error'}`, {
                        id: toastId,
                        duration: 3000,
                    });
                    fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
                }
            } catch (error) {
                console.error('Error updating password:', error);
                toast.error('Network error when updating password', { id: toastId, duration: 3000 });
                fetchData(pagination.pageIndex + 1, debouncedSearchQuery, pagination.pageSize);
            }
        },
        [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, fetchData],
    );

    // Memoize columns to avoid unnecessary re-renders
    const columns = useMemo(() => {
        // Log the base columns for debugging
        console.log(
            'Base columns:',
            baseColumns.map((col) => {
                // Safely access column identifiers
                return col.id || (col as any).accessorKey || 'unknown';
            }),
        );

        // Add handlers to all columns that need them
        return baseColumns.map((column) => {
            // Add handlers to action column
            if (column.id === 'actions') {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        onEdit: handleEditUser,
                        onDelete: handleDeleteClick,
                    },
                };
            }

            // Type guard to check if column has accessorKey property
            const hasAccessorKey = (col: any): col is { accessorKey: string } =>
                'accessorKey' in col && typeof col.accessorKey === 'string';

            // Add handlers to name column for inline editing
            if (hasAccessorKey(column) && column.accessorKey === 'name') {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        updateData: handleNameUpdate, // For real-time update
                        onCellBlur: handleNameBlur, // For saving to server
                    },
                };
            }

            // Add handlers to email column for inline editing
            if (hasAccessorKey(column) && column.accessorKey === 'email') {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        updateData: handleEmailUpdate,
                        onCellBlur: handleEmailBlur,
                    },
                };
            }

            // Add handlers to clearpw column for inline editing
            if (column.id === 'clearpw' || (hasAccessorKey(column) && column.accessorKey === 'clearpw')) {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        updateData: handleClearPwUpdate,
                        onCellBlur: handleClearPwBlur,
                    },
                };
            }

            return column;
        });
    }, [
        handleNameUpdate,
        handleNameBlur,
        handleEmailUpdate,
        handleEmailBlur,
        handleClearPwUpdate,
        handleClearPwBlur,
        handleEditUser,
        handleDeleteClick,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User list" />
            <Toaster theme={appearance} position="top-right" closeButton />

            <div className="container space-y-6 p-5">
                <HeadingSmall title="User" description="Manage user data and profile" />

                <div className="relative">
                    <DataTable
                        columns={columns}
                        data={data}
                        pageCount={pageCount}
                        pagination={pagination}
                        setPagination={setPagination}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        addButtonText="Add User"
                        onAddClick={handleAddUser}
                        initialSorting={sorting}
                        onSortingChange={setSorting}
                        initialRowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                        onDeleteSelected={handleDeleteSelected}
                        tableRef={tableRef}
                        totalCount={totalCount}
                    />

                    {/* User Form Modal */}
                    <UserFormModal
                        isOpen={isFormModalOpen}
                        onClose={() => setIsFormModalOpen(false)}
                        onSuccess={handleOperationSuccess}
                        onError={handleOperationError}
                        user={currentUser}
                        title={formModalTitle}
                    />

                    {/* Delete Confirmation Modal */}
                    {/* Delete single user confirmation modal */}
                    <DeleteConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleDeleteConfirm}
                        title="Delete User"
                        description={
                            userToDelete
                                ? `Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`
                                : 'Are you sure you want to delete this user? This action cannot be undone.'
                        }
                    />

                    {/* Delete multiple users confirmation modal */}
                    <DeleteConfirmationModal
                        isOpen={isDeleteMultipleModalOpen}
                        onClose={() => setIsDeleteMultipleModalOpen(false)}
                        onConfirm={handleConfirmMultipleDelete}
                        title="Delete Selected Users"
                        description={`Are you sure you want to delete ${Object.keys(rowsToDelete).length} selected users? This action cannot be undone.`}
                    />

                    {loading && data.length > 0 && (
                        <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-md">
                            <div className="flex flex-col items-center space-y-2">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                <p className="text-muted-foreground text-sm">Loading...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
