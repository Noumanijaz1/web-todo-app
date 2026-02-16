import { useState, useEffect, useContext, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, MoreVertical, Edit2, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { todosAPI } from '@/api/todos'
import { projectsAPI } from '@/api/projects'
import { usersAPI } from '@/api/users'
import { AuthContext } from '@/context/AuthContext'
import CreateTaskDialog from '@/components/ui/create-task-dialog'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 5
const TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'shared', label: 'Shared' },
]

function StatusBadge({ status, completed }) {
  const s = status || (completed ? 'done' : 'todo')
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
  const styles = {
    todo: 'bg-muted text-muted-foreground border-0',
    in_progress: 'bg-blue-100 text-blue-800 border-0',
    done: 'bg-green-100 text-green-800 border-0',
  }
  return (
    <Badge className={cn('font-medium text-xs', styles[s] || styles.todo)}>
      {labels[s] || 'To Do'}
    </Badge>
  )
}

function PriorityBadge({ priority }) {
  const p = (priority || 'medium').toUpperCase()
  const style =
    p === 'HIGH'
      ? 'bg-red-500 text-white border-0'
      : p === 'MEDIUM'
        ? 'bg-blue-500 text-white border-0'
        : 'bg-green-500 text-white border-0'
  return (
    <Badge className={cn('font-medium text-xs', style)}>
      {p}
    </Badge>
  )
}

function formatDueDate(dueDate, completed) {
  if (!dueDate) return '—'
  const d = new Date(dueDate)
  const now = new Date()
  if (!completed && d < now) {
    return (
      <span className="text-destructive font-medium">
        Overdue ({d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
      </span>
    )
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AssigneeCell({ assignee }) {
  if (!assignee) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  const name = assignee.name || assignee.email || '?'
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
        {initial}
      </div>
      <span className="text-sm truncate max-w-[100px]">{name}</span>
    </div>
  )
}

function Todos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectFromUrl = searchParams.get('project') || ''

  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [filterProject, setFilterProject] = useState(projectFromUrl || 'all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [actionOpenId, setActionOpenId] = useState(null)
  const { user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'
  const userId = user?.id || user?._id

  useEffect(() => {
    setFilterProject(projectFromUrl || 'all')
  }, [projectFromUrl])

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const params = filterProject && filterProject !== 'all' ? { projectId: filterProject } : {}
        const data = await todosAPI.getTodos(params)
        setTodos(data)
      } catch (err) {
        console.error('Failed to fetch todos:', err)
      }
    }
    fetchTodos()
  }, [filterProject])

  useEffect(() => {
    projectsAPI.getAll().then((d) => setProjects(Array.isArray(d) ? d : [])).catch(() => {})
    if (isAdmin) {
      usersAPI.getAll().then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [isAdmin])

  useEffect(() => {
    const onRefresh = () => {
      const params = filterProject && filterProject !== 'all' ? { projectId: filterProject } : {}
      todosAPI.getTodos(params).then(setTodos).catch(() => {})
    }
    window.addEventListener('todos-refresh', onRefresh)
    return () => window.removeEventListener('todos-refresh', onRefresh)
  }, [filterProject])

  const filteredTodos = useMemo(() => {
    let list = todos
    if (activeTab === 'assigned') {
      list = list.filter((t) => {
        const id = t.assignedTo?._id || t.assignedTo
        return id && String(id) === String(userId)
      })
    }
    if (filterStatus === 'done') list = list.filter((t) => t.status === 'done' || t.completed)
    if (filterStatus === 'todo') list = list.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) !== 'done')
    if (filterPriority !== 'all') {
      list = list.filter((t) => (t.priority || 'medium') === filterPriority)
    }
    if (filterAssignee !== 'all') {
      list = list.filter((t) => {
        const id = t.assignedTo?._id || t.assignedTo
        return id && String(id) === filterAssignee
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
    }
    return list
  }, [todos, activeTab, filterStatus, filterPriority, filterAssignee, searchQuery, userId])

  const totalFiltered = filteredTodos.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const start = (currentPage - 1) * PAGE_SIZE
  const pageTodos = filteredTodos.slice(start, start + PAGE_SIZE)

  const handleCreateTaskDialog = async (formData, attachmentFiles = []) => {
    setCreating(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status || 'todo',
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        assignedTo: formData.assignedTo && formData.assignedTo !== 'unassigned' ? formData.assignedTo : undefined,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
      }
      const newTodo = await todosAPI.createTodo(payload)
      for (const file of attachmentFiles) {
        try {
          await todosAPI.addAttachment(newTodo.id, file)
        } catch (e) {
          console.error('Failed to upload attachment:', e)
        }
      }
      const taskToAdd = attachmentFiles.length > 0 ? await todosAPI.getTodoById(newTodo.id) : newTodo
      setTodos((prev) => [...prev, taskToAdd])
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleEditTaskDialog = async (formData) => {
    if (!editingTodo) return
    setCreating(true)
    try {
      const dueDate = formData.dueDate ? new Date(formData.dueDate) : null
      const updatedTodo = await todosAPI.updateTodo(editingTodo.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status || 'todo',
        dueDate,
        assignedTo: formData.assignedTo && formData.assignedTo !== 'unassigned' ? formData.assignedTo : null,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : null,
      })
      setTodos(todos.map((t) => (t.id === editingTodo.id ? updatedTodo : t)))
      setShowEditDialog(false)
      setEditingTodo(null)
    } catch (err) {
      console.error('Failed to update todo:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      await todosAPI.deleteTodo(id)
      setTodos(todos.filter((t) => t.id !== id))
      setSelectedIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Failed to delete todo:', err)
    }
  }

  const handleToggleComplete = async (id) => {
    try {
      const todo = todos.find((t) => t.id === id)
      const isDone = todo.status === 'done' || todo.completed
      const updated = await todosAPI.updateTodo(id, { status: isDone ? 'todo' : 'done' })
      setTodos(todos.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      console.error('Failed to update todo:', err)
    }
  }

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pageTodos.map((t) => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = pageTodos.length > 0 && pageTodos.every((t) => selectedIds.has(t.id))

  return (
    <>
      <div className="space-y-5">
        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-muted-foreground mr-4">Tasks</span>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title + Add Task */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            All Tasks ({totalFiltered})
          </h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterProject}
            onValueChange={(v) => {
              setFilterProject(v)
              if (v && v !== 'all') setSearchParams({ project: v })
              else setSearchParams({})
            }}
          >
            <SelectTrigger className="w-[160px] bg-white border border-input">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] bg-white border border-input">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px] bg-white border border-input">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-[160px] bg-white border border-input">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u._id} value={u._id}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter tasks by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border border-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-4 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                    Task name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide w-24">
                    Assignee
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide w-24">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide w-24">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide w-28">
                    Due date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide w-14">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageTodos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  pageTodos.map((todo) => (
                    <tr
                      key={todo.id}
                      className={cn(
                        'border-b border-border last:border-b-0 transition-colors',
                        selectedIds.has(todo.id) && 'bg-primary/5'
                      )}
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedIds.has(todo.id)}
                          onCheckedChange={() => toggleSelectOne(todo.id)}
                          aria-label={`Select ${todo.title}`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p
                            className={cn(
                              'font-medium',
                              todo.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            <Link to={`/tasks/${todo.id}`} className="hover:text-primary hover:underline">
                              {todo.title}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {todo.projectId?.name || (todo.description || '—')}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <AssigneeCell assignee={todo.assignedTo} />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={todo.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={todo.status} completed={todo.completed} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDueDate(todo.dueDate, todo.completed)}
                      </td>
                      <td className="py-3 px-4">
                        {isAdmin && (
                          <Popover
                            open={actionOpenId === todo.id}
                            onOpenChange={(open) => setActionOpenId(open ? todo.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="end">
                              <div className="flex flex-col">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start"
                                  onClick={() => {
                                    handleToggleComplete(todo.id)
                                    setActionOpenId(null)
                                  }}
                                >
                                  {(todo.status === 'done' || todo.completed) ? 'Mark as To Do' : 'Mark as Done'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start"
                                  onClick={() => {
                                    setEditingTodo(todo)
                                    setShowEditDialog(true)
                                    setActionOpenId(null)
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setDeleteConfirmId(todo.id)
                                    setActionOpenId(null)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalFiltered > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {start + 1}-{Math.min(start + PAGE_SIZE, totalFiltered)} of {totalFiltered} tasks
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTaskDialog}
        loading={creating}
        isAdmin={isAdmin}
        projects={projects}
        defaultProjectId={filterProject && filterProject !== 'all' ? filterProject : undefined}
      />

      {editingTodo && (
        <CreateTaskDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setEditingTodo(null)
          }}
          onSubmit={handleEditTaskDialog}
          loading={creating}
          isAdmin={isAdmin}
          projects={projects}
          initialData={{
            title: editingTodo.title,
            description: editingTodo.description ?? '',
            priority: editingTodo.priority ?? 'medium',
            status: editingTodo.status ?? (editingTodo.completed ? 'done' : 'todo'),
            dueDate: editingTodo.dueDate
              ? new Date(editingTodo.dueDate).toISOString().split('T')[0]
              : '',
            assignedTo: editingTodo.assignedTo?._id ?? editingTodo.assignedTo,
            projectId: editingTodo.projectId?._id ?? editingTodo.projectId,
          }}
          isEditing
        />
      )}

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteTodo(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Todos
