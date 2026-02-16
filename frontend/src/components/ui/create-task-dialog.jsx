import { useState, useEffect, useRef } from 'react'
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
  DialogHeader,
  DialogTitle,
} from './dialog'
import { AlertCircle, Loader2, X, Calendar as CalendarIcon, Upload, Check } from 'lucide-react'
import { usersAPI } from '@/api/users'
import { cn } from '@/lib/utils'

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData = null,
  isEditing = false,
  isAdmin = false,
  projects = [],
  defaultProjectId,
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    priority: initialData?.priority ?? 'medium',
    status: initialData?.status ?? (initialData?.completed ? 'done' : 'todo'),
    dueDate: initialData?.dueDate ?? '',
    assignedTo: initialData?.assignedTo?._id ?? initialData?.assignedTo ?? 'unassigned',
    projectId: initialData?.projectId?._id ?? initialData?.projectId ?? defaultProjectId ?? 'none',
  })
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open && isAdmin) {
      usersAPI.getAll().then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => setUsers([]))
    }
  }, [open, isAdmin])

  const [prevInitialData, setPrevInitialData] = useState(initialData)
  if (prevInitialData !== initialData && initialData) {
    setFormData({
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      priority: initialData.priority ?? 'medium',
      status: initialData.status ?? (initialData.completed ? 'done' : 'todo'),
      dueDate: initialData.dueDate ?? '',
      assignedTo: initialData.assignedTo?._id ?? initialData.assignedTo ?? 'unassigned',
      projectId: initialData.projectId?._id ?? initialData.projectId ?? 'none',
    })
    setPrevInitialData(initialData)
  }
  useEffect(() => {
    if (open && !initialData && defaultProjectId) {
      setFormData((prev) => ({ ...prev, projectId: defaultProjectId }))
    }
  }, [open, defaultProjectId, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleFileSelect = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setAttachmentFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeFile = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Task title is required')
      return
    }
    onSubmit(formData, attachmentFiles)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      assignedTo: 'unassigned',
      projectId: defaultProjectId ?? 'none',
    })
    setAttachmentFiles([])
    setError('')
  }

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setAttachmentFiles([])
      setError('')
      onClose?.()
    }
  }

  const selectedUser = users.find((u) => u._id === formData.assignedTo)
  const assigneeInitial = selectedUser
    ? (selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()
    : '?'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl border border-border shadow-2xl"
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-8 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onClose(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Modal Body */}
          <div className="px-8 py-6 space-y-6">
            {/* Task Title */}
            <div>
              <Label htmlFor="task-title" className="block text-sm font-semibold mb-2">
                Task Title
              </Label>
              <Input
                id="task-title"
                name="title"
                placeholder="e.g., Design System Update"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg h-11"
                required
              />
            </div>

            {/* Project & Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-semibold mb-2">Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, projectId: v }))}
                >
                  <SelectTrigger className="w-full rounded-lg h-11">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-semibold mb-2">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-11 rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
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
                        setFormData((prev) => ({
                          ...prev,
                          dueDate: date ? format(date, 'yyyy-MM-dd') : '',
                        }))
                      }
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="task-description" className="block text-sm font-semibold mb-2">
                Description
              </Label>
              <Textarea
                id="task-description"
                name="description"
                placeholder="Add more details about this task..."
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg min-h-[120px] resize-none"
              />
            </div>

            {/* Priority & Assignee Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-semibold mb-2">Priority</Label>
                <div className="flex p-1 bg-muted rounded-lg gap-0.5">
                  {PRIORITIES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, priority: opt.value }))}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                        formData.priority === opt.value
                          ? 'bg-background text-primary border border-border shadow-sm font-bold'
                          : 'text-muted-foreground hover:bg-background/80'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="block text-sm font-semibold mb-2">Assignee</Label>
                {isAdmin ? (
                  <div className="flex items-center gap-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 h-11">
                    <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="text-[10px] font-bold">{assigneeInitial}</span>
                    </div>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, assignedTo: v }))}
                    >
                      <SelectTrigger
                        className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 min-w-0"
                        disabled={loadingUsers}
                      >
                        <SelectValue placeholder={loadingUsers ? 'Loading...' : 'Select assignee'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.name || u.email} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 h-11 text-muted-foreground text-sm">
                    <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      ?
                    </div>
                    Only admins can assign
                  </div>
                )}
              </div>
            </div>

            {/* Status (when editing) */}
            {isEditing && (
              <div>
                <Label className="block text-sm font-semibold mb-2">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="w-full rounded-lg h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Attachments (create only; edit view task detail for uploads) */}
            {!isEditing && (
              <div>
                <Label className="block text-sm font-semibold mb-2">Attachments</Label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="size-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Click or drag file to upload</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG, JPG or DOCX (max. 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={handleFileSelect}
                />
                {attachmentFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {attachmentFiles.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50"
                      >
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-muted-foreground"
                          onClick={() => removeFile(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-border px-8 py-5 flex justify-end gap-3 bg-muted/30 rounded-b-xl">
            <Button type="button" variant="ghost" onClick={() => onClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTaskDialog
