'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/pages/users/columns';
import { router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    user?: User; // Optional user for edit mode
    title: string;
}

export function UserFormModal({ isOpen, onClose, onSuccess, onError, user, title }: UserFormModalProps) {
    const isEditMode = !!user;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<User>>(
        user || {
            name: '',
            email: '',
            clearpw: '',
            emailpw: '',
            active: true,
            gid: 1000,
            uid: 1000,
            home: '',
        },
    );

    // Reset form data when user changes
    useEffect(() => {
        if (isOpen) {
            setFormData(user || {
                name: '',
                email: '',
                clearpw: '',
                emailpw: '',
                active: true,
                gid: 1000,
                uid: 1000,
                home: '',
            });
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        
        // Handle different input types
        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [name]: e.target.checked,
            }));
        } else if (type === 'number') {
            setFormData((prev) => ({
                ...prev,
                [name]: parseInt(value, 10) || 0,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Add a password field if creating a new user
        const dataToSubmit = isEditMode
            ? formData
            : {
                  ...formData,
                  // Generate a random password for new users
                  password:
                      Math.random().toString(36).slice(-10) +
                      Math.random().toString(36).slice(-2).toUpperCase() +
                      '!',
              };

        if (isEditMode && user) {
            // Update existing user with Inertia
            router.put(`/api/users/${user.id}`, dataToSubmit, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                    onSuccess(`User ${formData.name} has been updated successfully.`);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMessages = Object.values(errors).join('\n');
                    console.error('Update errors:', errors);
                    onError(errorMessages);
                },
            });
        } else {
            // Create new user with Inertia
            router.post('/api/users', dataToSubmit, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                    onSuccess(`User ${formData.name} has been created successfully.`);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMessages = Object.values(errors).join('\n');
                    console.error('Create errors:', errors);
                    onError(errorMessages);
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Update the user details below.'
                            : 'Fill in the information below to create a new user.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clearpw" className="text-right">
                                Clear Password
                            </Label>
                            <Input
                                id="clearpw"
                                name="clearpw"
                                value={formData.clearpw || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="emailpw" className="text-right">
                                Email Password
                            </Label>
                            <Input
                                id="emailpw"
                                name="emailpw"
                                value={formData.emailpw || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">
                                Active
                            </Label>
                            <div className="col-span-3 flex items-center">
                                <Input
                                    id="active"
                                    name="active"
                                    type="checkbox"
                                    checked={!!formData.active}
                                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                                    className="h-4 w-4"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="uid" className="text-right">
                                UID
                            </Label>
                            <Input
                                id="uid"
                                name="uid"
                                type="number"
                                value={formData.uid || 1000}
                                onChange={handleChange}
                                className="col-span-3"
                                disabled={isSubmitting}
                                min={0}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gid" className="text-right">
                                GID
                            </Label>
                            <Input
                                id="gid"
                                name="gid"
                                type="number"
                                value={formData.gid || 1000}
                                onChange={handleChange}
                                className="col-span-3"
                                disabled={isSubmitting}
                                min={0}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="home" className="text-right">
                                Home Directory
                            </Label>
                            <Input
                                id="home"
                                name="home"
                                value={formData.home || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : isEditMode ? (
                                'Update'
                            ) : (
                                'Create'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
