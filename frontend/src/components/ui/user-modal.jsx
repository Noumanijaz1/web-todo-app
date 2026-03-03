import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './dialog';
import { Input } from './input';
import { Button } from './button';
import { Form } from './form';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const UserModal = ({ open, onClose, onSubmit, mode = 'create', initialData = null, loading = false }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        setForm({
          name: initialData.name ?? '',
          email: initialData.email ?? '',
          password: '',
          role: initialData.role ?? 'user',
        });
      } else {
        setForm({ name: '', email: '', password: '', role: 'user' });
      }
    }
  }, [open, isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setForm((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password;
      onSubmit(payload);
    } else {
      if (!form.password.trim()) return;
      onSubmit({ name: form.name, email: form.email, password: form.password, role: form.role });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update user details. Leave password blank to keep the current password.'
              : 'Add a new user to the workspace.'}
          </DialogDescription>
        </DialogHeader>
        <Form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password {isEdit && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required={!isEdit}
                placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
                minLength={isEdit ? undefined : 6}
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
