import { useState, useEffect, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import UserModal from '@/components/ui/user-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usersAPI } from '@/api/users'
import { AuthContext } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export default function Users() {
  const { user } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingUser, setEditingUser] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role
  const isAdmin = effectiveRole === 'admin'

  const roleLabel = (r) => {
    if (r === 'admin') return 'Admin'
    if (r === 'project_manager') return 'Project Manager'
    return 'Employee'
  }

  const fetchUsers = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    try {
      const data = await usersAPI.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isAdmin])

  const handleAddUser = () => {
    setEditingUser(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleEditUser = (u) => {
    setEditingUser(u)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleModalSubmit = async (payload) => {
    setSubmitLoading(true)
    try {
      if (modalMode === 'create') {
        await usersAPI.create(payload)
      } else if (editingUser?._id) {
        await usersAPI.update(editingUser._id, payload)
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed'
      setError(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteClick = (u) => setDeleteTarget(u)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return
    setDeleteLoading(true)
    try {
      await usersAPI.delete(deleteTarget._id)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!user) return null
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="h-7 w-7" />
          User management
        </h1>
        <p className="text-muted-foreground">
          Create, update, and delete users. Only admins can access this page.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>All users in the workspace</CardDescription>
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add user
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8">No users yet. Add one to get started.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Designation</th>
                    <th className="text-right p-3 font-medium w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <span className="font-medium">{u.name}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge
                          variant={(u.role === 'user' ? 'employee' : u.role) === 'admin' ? 'default' : 'secondary'}
                          className={cn(
                            (u.role === 'user' ? 'employee' : u.role) === 'admin' && 'bg-primary/90'
                          )}
                        >
                          {(u.role === 'user' ? 'employee' : u.role) === 'admin' ? (
                            <Shield className="h-3 w-3 mr-1 inline" />
                          ) : (
                            <User className="h-3 w-3 mr-1 inline" />
                          )}
                          {roleLabel(u.role === 'user' ? 'employee' : u.role)}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {u.designation || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(u)}
                            aria-label="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(u)}
                            aria-label="Delete user"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={editingUser}
        loading={submitLoading}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
