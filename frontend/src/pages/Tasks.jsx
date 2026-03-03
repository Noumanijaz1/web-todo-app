import { useState, useEffect, useContext, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { todosAPI } from '@/api/todos'
import { projectsAPI } from '@/api/projects'
import { usersAPI } from '@/api/users'
import { AuthContext } from '@/context/AuthContext'
import CreateTaskDialog from '@/components/ui/create-task-dialog'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function StatusBadge({ status, completed }) {
  const s = status || (completed ? 'done' : 'todo')
  const config = {
    todo: { label: 'Pending', className: 'text-gray-400 dark:text-gray-500', dot: 'bg-gray-300 dark:bg-gray-600' },
    in_progress: { label: 'In Progress', className: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    done: { label: 'Done', className: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  }
  const { label, className, dot } = config[s] || config.todo
  return (
    <span className={cn('flex items-center gap-1.5 text-xs font-bold', className)}>
      <span className={cn('w-2 h-2 rounded-full', dot)} />
      {label}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const p = (priority || 'medium').toLowerCase()
  const config = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={cn('px-2 py-1 rounded text-[10px] font-black uppercase', config[p] || config.medium)}>
      {p === 'urgent' ? 'High' : p}
    </span>
  )
}

function formatDueDate(dueDate) {
  if (!dueDate) return '—'
  return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AssigneeCell({ assignee }) {
  if (!assignee) return <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
  const name = assignee.name || assignee.email || '?'
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0"
        style={{ backgroundColor: 'var(--tw-gradient-from, #e5e7eb)' }}
      >
        {initial}
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{name}</span>
    </div>
  )
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3000'

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectFromUrl = searchParams.get('project') || ''

  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [filterProject, setFilterProject] = useState(projectFromUrl || 'all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [actionOpenId, setActionOpenId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedTaskFull, setSelectedTaskFull] = useState(null)
  const [sidebarNote, setSidebarNote] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { user } = useContext(AuthContext)
  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role
  const isAdmin = effectiveRole === 'admin'
  const isAdminOrPM = effectiveRole === 'admin' || effectiveRole === 'project_manager'
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
    if (isAdminOrPM) {
      usersAPI.getAll().then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [isAdminOrPM])

  useEffect(() => {
    const onRefresh = () => {
      const params = filterProject && filterProject !== 'all' ? { projectId: filterProject } : {}
      todosAPI.getTodos(params).then(setTodos).catch(() => {})
    }
    window.addEventListener('todos-refresh', onRefresh)
    return () => window.removeEventListener('todos-refresh', onRefresh)
  }, [filterProject])

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTaskFull(null)
      return
    }
    todosAPI
      .getTodoById(selectedTaskId)
      .then(setSelectedTaskFull)
      .catch(() => setSelectedTaskFull(null))
  }, [selectedTaskId])

  const filteredTodos = useMemo(() => {
    let list = todos
    if (filterStatus !== 'all') {
      if (filterStatus === 'done') list = list.filter((t) => t.status === 'done' || t.completed)
      else list = list.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) === filterStatus)
    }
    if (filterPriority !== 'all') list = list.filter((t) => (t.priority || 'medium') === filterPriority)
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
  }, [todos, filterStatus, filterPriority, filterAssignee, searchQuery])

  const currentProject = useMemo(
    () => projects.find((p) => p._id === filterProject) || null,
    [projects, filterProject]
  )
  const projectTitle = currentProject?.name || 'All Tasks'
  const doneCount = useMemo(() => filteredTodos.filter((t) => t.status === 'done' || t.completed).length, [filteredTodos])
  const totalCount = filteredTodos.length
  const progressPercent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0

  const totalPages = Math.max(1, Math.ceil(filteredTodos.length / PAGE_SIZE))
  const start = (currentPage - 1) * PAGE_SIZE
  const pageTodos = filteredTodos.slice(start, start + PAGE_SIZE)

  const handleCreateTask = async (formData, attachmentFiles = []) => {
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

  const handleEditTask = async (formData) => {
    if (!editingTodo) return
    setCreating(true)
    try {
      const updated = await todosAPI.updateTodo(editingTodo.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status || 'todo',
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        assignedTo: formData.assignedTo && formData.assignedTo !== 'unassigned' ? formData.assignedTo : null,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : null,
      })
      setTodos((prev) => prev.map((t) => (t.id === editingTodo.id ? updated : t)))
      if (selectedTaskId === editingTodo.id) setSelectedTaskFull(updated)
      setShowEditDialog(false)
      setEditingTodo(null)
    } catch (err) {
      console.error('Failed to update task:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      await todosAPI.deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
      if (selectedTaskId === id) setSelectedTaskId(null)
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleToggleComplete = async (id) => {
    try {
      const todo = todos.find((t) => t.id === id)
      const isDone = todo?.status === 'done' || todo?.completed
      const updated = await todosAPI.updateTodo(id, { status: isDone ? 'todo' : 'done' })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
      if (selectedTaskId === id) setSelectedTaskFull(updated)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleAddNote = async (e) => {
    e?.preventDefault()
    if (!sidebarNote.trim() || !selectedTaskId) return
    setSubmittingNote(true)
    try {
      const updated = await todosAPI.addComment(selectedTaskId, sidebarNote.trim())
      setSelectedTaskFull(updated)
      setSidebarNote('')
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedTaskId) return
    setUploadingFile(true)
    todosAPI
      .addAttachment(selectedTaskId, file)
      .then(setSelectedTaskFull)
      .catch((err) => console.error('Failed to upload file:', err))
      .finally(() => {
        setUploadingFile(false)
        e.target.value = ''
      })
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterAssignee('all')
    setFilterProject('all')
    setSearchParams({})
    setSearchQuery('')
  }

  const selectedForSidebar = selectedTaskFull || pageTodos.find((t) => t.id === selectedTaskId)
  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all' || filterProject !== 'all' || searchQuery.trim()

  return (
    <>
      <div className="px-4 lg:px-10 py-8 max-w-[1440px] mx-auto w-full bg-[#f5f6f8] dark:bg-[#101622] min-h-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to="/projects" className="hover:opacity-80 transition-colors text-primary">
            Projects
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{projectTitle}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {projectTitle}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {doneCount} of {totalCount} tasks completed
              </p>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary">
                {progressPercent}%
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm bg-primary text-primary-foreground"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Task
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Task List */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-auto min-w-[120px] flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-primary/50 transition-colors h-auto">
                      <SelectValue />
                   
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-auto min-w-[120px] flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-primary/50 transition-colors h-auto">
                      <SelectValue />
             
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAdminOrPM && (
                    <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                      <SelectTrigger className="w-auto min-w-[120px] flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-primary/50 transition-colors h-auto">
                        <SelectValue placeholder="User" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u._id} value={u._id}>{u.name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={filterProject}
                    onValueChange={(v) => {
                      setFilterProject(v)
                      if (v && v !== 'all') setSearchParams({ project: v })
                      else setSearchParams({})
                    }}
                  >
                    <SelectTrigger className="w-auto min-w-[120px] flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-primary/50 transition-colors h-auto">
                      <SelectValue placeholder="Project" />
                    
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p._id} value={p._id}>{p.name?.length > 12 ? `${p.name.slice(0, 12)}...` : p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-800 pl-4">
                  <button type="button" className="flex items-center gap-1 text-gray-500 text-xs font-bold px-2 py-1.5 hover:opacity-80 transition-colors text-primary">
                    <span className="material-symbols-outlined text-sm">sort</span> Sort
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-gray-500 text-xs font-bold px-2 py-1.5 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">filter_alt_off</span> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 max-w-xs items-center rounded-lg bg-gray-100 dark:bg-gray-800 pl-4 pr-2 h-10">
                <span className="material-symbols-outlined text-lg text-gray-400">search</span>
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none pl-2 h-9 text-sm"
                />
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Task Name</th>
                      <th className="px-4 py-4">Assignee</th>
                      <th className="px-4 py-4">Priority</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pageTodos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No tasks found.
                        </td>
                      </tr>
                    ) : (
                      pageTodos.map((todo) => {
                        const isDone = todo.status === 'done' || todo.completed
                        const isSelected = selectedTaskId === todo.id
                        return (
                          <tr
                            key={todo.id}
                            onClick={() => setSelectedTaskId(todo.id)}
                            className={cn(
                              'hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer',
                              isSelected && 'bg-blue-50/30 dark:bg-blue-900/10'
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleComplete(todo.id)
                                  }}
                                  className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors border-gray-300 dark:border-gray-600 group-hover:border-primary"
                                  style={isDone ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
                                >
                                  {isDone && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                                </button>
                                <span
                                  className={cn(
                                    'text-sm font-semibold text-gray-900 dark:text-white',
                                    isDone && 'line-through text-gray-500 dark:text-gray-400'
                                  )}
                                >
                                  {todo.title}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <AssigneeCell assignee={todo.assignedTo} />
                            </td>
                            <td className="px-4 py-4">
                              <PriorityBadge priority={todo.priority} />
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={todo.status} completed={todo.completed} />
                            </td>
                            <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                              {formatDueDate(todo.dueDate)}
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <Popover open={actionOpenId === todo.id} onOpenChange={(open) => setActionOpenId(open ? todo.id : null)}>
                                <PopoverTrigger asChild>
                                  <button type="button" className="text-gray-400 hover:opacity-80 transition-colors p-1">
                                    <span className="material-symbols-outlined">more_horiz</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" align="end">
                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                      onClick={() => {
                                        handleToggleComplete(todo.id)
                                        setActionOpenId(null)
                                      }}
                                    >
                                      {isDone ? 'Mark as To Do' : 'Mark as Done'}
                                    </button>
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                      onClick={() => {
                                        setEditingTodo(todo)
                                        setShowEditDialog(true)
                                        setActionOpenId(null)
                                      }}
                                    >
                                      <span className="material-symbols-outlined text-lg">edit</span>
                                      Edit
                                    </button>
                                    <Link
                                      to={`/tasks/${todo.id}`}
                                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                      onClick={() => setActionOpenId(null)}
                                    >
                                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                                      Open
                                    </Link>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        onClick={() => {
                                          setDeleteConfirmId(todo.id)
                                          setActionOpenId(null)
                                        }}
                                      >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer (same layout/style as Projects) */}
            {filteredTodos.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {start + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(start + PAGE_SIZE, filteredTodos.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredTodos.length}
                  </span>{' '}
                  tasks
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded border-slate-200 dark:border-slate-700"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'rounded px-3 py-1',
                        currentPage === page
                          ? 'bg-primary text-primary-foreground'
                          : 'border-slate-200 dark:border-slate-700'
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded border-slate-200 dark:border-slate-700"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Detail View */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Details</h3>
                {selectedForSidebar?.id && (
                  <Link
                    to={`/tasks/${selectedForSidebar.id}`}
                    className="text-gray-400 hover:opacity-80 transition-colors"
                  
                  >
                    <span className="material-symbols-outlined text-xl">open_in_new</span>
                  </Link>
                )}
              </div>

              {!selectedForSidebar ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a task to view details.</p>
              ) : (
                <>
                  <div className="mb-8">
                    <PriorityBadge priority={selectedForSidebar.priority} />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-3 mb-2 leading-snug">
                      {selectedForSidebar.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedForSidebar.description || 'No description.'}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-black uppercase tracking-widest text-gray-400">Notes</h5>
                      {selectedTaskFull?.comments?.length > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {selectedTaskFull.comments.length} note(s)
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                      {selectedTaskFull?.comments?.length > 0 ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 italic">
                          "{selectedTaskFull.comments[selectedTaskFull.comments.length - 1].text}"
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">No notes yet.</p>
                      )}
                      <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                        <textarea
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 resize-none"
                          placeholder="Add a quick note..."
                          rows={2}
                          value={sidebarNote}
                          onChange={(e) => setSidebarNote(e.target.value)}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!sidebarNote.trim() || submittingNote}
                          className="self-end rounded-lg text-xs"

                        >
                          {submittingNote ? 'Sending…' : 'Add note'}
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="mb-8">
                    <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                      Attachments ({selectedTaskFull?.attachments?.length ?? 0})
                    </h5>
                    <div className="space-y-2">
                      {(selectedTaskFull?.attachments ?? []).map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="material-symbols-outlined text-primary shrink-0">description</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {att.originalName || att.path}
                              </p>
                            </div>
                          </div>
                    <a
                            href={`${API_BASE_URL}/uploads/${att.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                    <label className="mt-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer transition-colors group">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                      <span className="material-symbols-outlined text-gray-400 group-hover:opacity-80 text-primary">
                        upload_file
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {uploadingFile ? 'Uploading…' : 'Upload New File'}
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg border-gray-200 dark:border-gray-800 text-sm font-bold"
                      onClick={() => {
                        setEditingTodo(selectedForSidebar)
                        setShowEditDialog(true)
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit
                    </Button>
                    <Button
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground"
                      onClick={() => handleToggleComplete(selectedForSidebar.id)}
                    >
                      <span className="material-symbols-outlined text-lg">done_all</span>
                      {(selectedForSidebar.status === 'done' || selectedForSidebar.completed) ? 'Mark To Do' : 'Mark Done'}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Project Insights */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/10">
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-primary">
                Project Insights
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {doneCount} / {totalCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{progressPercent}%</span>
                </div>
                <div className="pt-4 border-t border-primary/10">
                  <p className="text-[11px] leading-relaxed font-medium opacity-90 text-primary">
                    {progressPercent >= 100
                      ? 'All tasks completed for this view.'
                      : `${totalCount - doneCount} task(s) remaining.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTask}
        loading={creating}
        isAdmin={isAdmin}
        canAssign={isAdminOrPM}
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
          onSubmit={handleEditTask}
          loading={creating}
          isAdmin={isAdmin}
          canAssign={isAdminOrPM}
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

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
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
