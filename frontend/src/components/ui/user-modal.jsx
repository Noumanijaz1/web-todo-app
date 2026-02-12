import React, { useState } from 'react';
import Dialog from './dialog';
import Input from './input';
import Button from './button';
import Form from './form';
import Label from './label';

const UserModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <h2>Create User</h2>
        <Label htmlFor="name">Name</Label>
        <Input name="name" value={form.name} onChange={handleChange} required />
        <Label htmlFor="email">Email</Label>
        <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        <Label htmlFor="password">Password</Label>
        <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="button" onClick={onClose} style={{ marginRight: '0.5rem' }}>Cancel</Button>
          <Button type="submit">Create</Button>
        </div>
      </Form>
    </Dialog>
  );
};

export default UserModal;
