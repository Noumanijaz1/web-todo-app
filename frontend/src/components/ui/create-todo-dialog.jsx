import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Calendar } from './calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { AlertCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { usersAPI } from '../../api/users'

export function CreateTodoDialog({ open, onClose, onSubmit, loading = false, initialData = null, isEditing = false, isAdmin = false, projects = [], defaultProjectId }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate || '',
    assignedTo: initialData?.assignedTo?._id || 'unassigned',
    projectId: initialData?.projectId?._id || initialData?.projectId || defaultProjectId || 'none'
  })
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch users when dialog opens and user is admin
  useEffect(() => {
    if (open && isAdmin) {
      fetchUsers()
    }
  }, [open, isAdmin])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const allUsers = await usersAPI.getAll()
      setUsers(allUsers)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Update formData when initialData changes
  const [prevInitialData, setPrevInitialData] = useState(initialData)
  if (prevInitialData !== initialData && initialData) {
    setFormData({
      title: initialData.title || '',
      description: initialData.description || '',
      priority: initialData.priority || 'medium',
      dueDate: initialData.dueDate || '',
      assignedTo: initialData.assignedTo?._id || 'unassigned',
      projectId: initialData.projectId?._id || initialData.projectId || 'none'
    })
    setPrevInitialData(initialData)
  }
  useEffect(() => {
    if (open && !initialData && defaultProjectId) {
      setFormData(prev => ({ ...prev, projectId: defaultProjectId }))
    }
  }, [open, defaultProjectId, initialData])

  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    onSubmit(formData)
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: 'unassigned', projectId: defaultProjectId || 'none' })
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Todo' : 'Create New Todo'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your task details' : 'Add a new task with details and priority'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter task description (optional)"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate
                      ? format(new Date(formData.dueDate), 'PPP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onSelect={(date) =>
                      setFormData(prev => ({
                        ...prev,
                        dueDate: date ? format(date, 'yyyy-MM-dd') : ''
                      }))
                    }
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To (Optional)</Label>
              <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger disabled={loadingUsers}>
                  <SelectValue placeholder={loadingUsers ? 'Loading users...' : 'Select a user'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Todo' : 'Create Todo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTodoDialog
