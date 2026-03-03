import { useState, useEffect, useRef, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AuthContext } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { todosAPI } from '@/api/todos'
import { projectsAPI } from '@/api/projects'
import CreateTaskDialog from '@/components/ui/create-task-dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3000'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function TaskDetail() {
  const { taskId } = useParams()
  const { user } = useContext(AuthContext)
  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role
  const isAdmin = effectiveRole === 'admin'
  const isAdminOrPM = effectiveRole === 'admin' || effectiveRole === 'project_manager'
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [projects, setProjects] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    projectsAPI.getAll?.().then((data) => setProjects(Array.isArray(data) ? data : [])).catch(() => setProjects([]))
  }, [])

  const fetchTask = () => {
    if (!taskId) return
    setLoading(true)
    todosAPI
      .getTodoById(taskId)
      .then(setTask)
      .catch(() => setTask(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !taskId) return
    setSubmittingComment(true)
    try {
      const updated = await todosAPI.addComment(taskId, commentText.trim())
      setTask(updated)
      setCommentText('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStatusChange = async (value) => {
    if (!taskId) return
    setStatusUpdating(true)
    try {
      const updated = await todosAPI.updateTodo(taskId, { status: value })
      setTask(updated)
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !taskId) return
    setUploadingFile(true)
    try {
      const updated = await todosAPI.addAttachment(taskId, file)
      setTask(updated)
      e.target.value = ''
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleEditSubmit = async (formData) => {
    if (!task?.id) return
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        assignedTo: formData.assignedTo && formData.assignedTo !== 'unassigned' ? formData.assignedTo : undefined,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
      }
      const updated = await todosAPI.updateTodo(task.id, payload)
      setTask(updated)
      setShowEditDialog(false)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleDelete = async () => {
    if (!task?.id) return
    setDeleting(true)
    try {
      await todosAPI.deleteTodo(task.id)
      window.location.href = '/tasks'
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const attachmentUrl = (path) => `${API_BASE_URL}/uploads/${path}`

  const projectName = task?.projectId?.name ?? 'Project'
  const taskDisplayId = task?.id ? `TASK-${String(task.id).slice(-4).toUpperCase()}` : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Button variant="outline" asChild className="rounded-lg border-slate-200 shadow-sm">
          <Link to="/tasks" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to task list
          </Link>
        </Button>
        <p className="text-slate-600 dark:text-slate-400">Task not found.</p>
      </div>
    )
  }

  const currentStatus = task.status || (task.completed ? 'done' : 'todo')
  const priority = (task.priority || 'medium').toLowerCase()
  const priorityStyles = {
    high: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    urgent: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    medium: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    low: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/tasks" className="hover:text-primary transition-colors">
            Tasks
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          {task.projectId ? (
            <>
              <Link to="/projects" className="hover:text-primary transition-colors">
                {projectName}
              </Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </>
          ) : null}
          <span className="text-slate-900 dark:text-slate-100 font-medium">{taskDisplayId || task.title}</span>
        </div>
        <Button
          variant="outline"
          asChild
          className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95"
        >
          <Link to="/tasks">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to task list
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Task Header Card */}
          <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {task.title}
              </h2>
              <button
                type="button"
                onClick={() => setShowEditDialog(true)}
                className="text-slate-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Edit task"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Description
              </h3>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="italic text-slate-400">No description provided.</p>
                )}
              </div>
            </div>
          </section>

          {/* Activity & Comments */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">forum</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Activity & Comments</h3>
            </div>

            <div className="space-y-6">
              {(task.comments || []).map((c, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {(c.userName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.userName || 'User'}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {c.createdAt ? format(new Date(c.createdAt), 'PPp') : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">{c.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* New Comment */}
              <form onSubmit={handleAddComment} className="flex gap-4 pt-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="relative">
                    <Textarea
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 min-h-[80px] resize-none"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      disabled={submittingComment}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-md active:scale-95 text-sm"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Post Comment'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* Sidebar (Right 1 column) */}
        <aside className="space-y-6">
          {/* Status & Action Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Status
              </label>
              <Select
                value={currentStatus}
                onValueChange={handleStatusChange}
                disabled={statusUpdating}
              >
                <SelectTrigger className="w-full appearance-none bg-primary/10 border-none text-primary font-bold py-3 pl-4 pr-10 rounded-lg cursor-pointer focus:ring-2 focus:ring-primary/20 h-auto">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Priority
                </label>
                <div
                  className={cn(
                    'flex items-center gap-2 font-bold px-3 py-2 rounded-lg text-sm',
                    priorityStyles[priority] || priorityStyles.medium
                  )}
                >
                  <span className="material-symbols-outlined text-base">priority_high</span>
                  {priority === 'urgent' ? 'High' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Due Date
                </label>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-3 py-2 rounded-lg text-sm">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Assigned User
              </label>
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {task.assignedTo
                    ? (task.assignedTo.name || task.assignedTo.email || '?').charAt(0).toUpperCase()
                    : '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {task.assignedTo
                      ? (task.assignedTo.name || task.assignedTo.email || 'Unassigned')
                      : 'Unassigned'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {task.assignedTo?.email ?? ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Attachments
              </h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Upload
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileUpload}
            />
            <div className="space-y-3">
              {(task.attachments || []).map((a, i) => (
                <a
                  key={i}
                  href={attachmentUrl(a.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-primary">description</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {a.originalName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
                  </div>
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="mt-6 w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 group hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-1">
                {uploadingFile ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Drop files here</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">or click to browse from device</p>
            </button>
          </div>

          {/* Danger Zone (Admin only) */}
          {isAdmin && (
            <div className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Manage Task</p>
                <p className="text-[10px] text-red-500 dark:text-red-400/80">Archive or delete this task forever</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <span className="material-symbols-outlined">delete_forever</span>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Edit Task Dialog */}
      <CreateTaskDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleEditSubmit}
        loading={false}
        initialData={task}
        isEditing
        isAdmin={isAdmin}
        canAssign={isAdminOrPM}
        projects={projects}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all its comments and attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
