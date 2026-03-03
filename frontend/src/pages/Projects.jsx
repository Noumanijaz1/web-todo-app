import { useState, useMemo, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'
import { projectsAPI } from '@/api/projects'
import { todosAPI } from '@/api/todos'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const PROJECT_PAGE_PRIMARY = '#0b50da'

// Design status tabs: All Projects, Active, Completed, On Hold
// Backend: on_track, at_risk, completed
const STATUS_TABS = [
  { value: 'all', label: 'All Projects' },
  { value: 'on_track', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'at_risk', label: 'On Hold' },
]

const statusBadgeConfig = {
  on_track: {
    label: 'Active',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    dotClass: 'bg-blue-600',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    dotClass: 'bg-green-600',
  },
  at_risk: {
    label: 'On Hold',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-600',
  },
}

const PROJECT_ICONS = ['language', 'smartphone', 'campaign', 'security', 'folder']

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dotColor: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-orange-400' },
  { value: 'high', label: 'High', dotColor: 'bg-red-500' },
]

const INITIAL_STATUS_OPTIONS = [
  { value: 'on_track', label: 'Active' },
  { value: 'at_risk', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

const PAGE_SIZE = 5

const DIALOG_BORDER = 'border-[#dbdfe6]'
const DIALOG_MUTED = 'text-[#606e8a]'
const DIALOG_TEXT = 'text-[#111318]'
const DIALOG_BG_LIGHT = 'bg-[#f5f6f8]'

const MAX_DESCRIPTION_LENGTH = 500

export default function Projects() {
  const { user } = useContext(AuthContext)
  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role
  const canCreateProject = effectiveRole === 'admin' || effectiveRole === 'project_manager'
  const [projects, setProjects] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [initialStatus, setInitialStatus] = useState('on_track')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('low')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchProjects = () => {
    projectsAPI
      .getAll()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      projectsAPI.getAll().then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
      todosAPI.getTodos().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
    ]).then(([projs, taskList]) => {
      setProjects(projs)
      setTodos(taskList)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onRefresh = () => fetchProjects()
    window.addEventListener('projects-refresh', onRefresh)
    return () => window.removeEventListener('projects-refresh', onRefresh)
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => statusFilter === 'all' || p.status === statusFilter)
  }, [projects, statusFilter])

  const projectProgressMap = useMemo(() => {
    const map = {}
    for (const t of todos) {
      const pid = t.projectId?._id ?? t.projectId
      if (!pid) continue
      if (!map[pid]) map[pid] = { total: 0, done: 0 }
      map[pid].total += 1
      if (t.status === 'done') map[pid].done += 1
    }
    const out = {}
    for (const [pid, v] of Object.entries(map)) {
      out[pid] = v.total ? Math.round((v.done / v.total) * 100) : 0
    }
    return out
  }, [todos])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredProjects.slice(start, start + PAGE_SIZE)
  }, [filteredProjects, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))
  const overallCompletion = useMemo(() => {
    if (filteredProjects.length === 0) return 0
    const sum = filteredProjects.reduce((acc, p) => acc + (projectProgressMap[p._id] ?? 0), 0)
    return (sum / filteredProjects.length).toFixed(1)
  }, [filteredProjects, projectProgressMap])

  const activeCount = useMemo(
    () => filteredProjects.filter((p) => p.status === 'on_track').length,
    [filteredProjects]
  )

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await projectsAPI.create({
        name: newProjectName,
        description: newProjectDesc,
        status: initialStatus,
        dueDate: dueDate || undefined,
        priority,
      })
      window.dispatchEvent(new CustomEvent('projects-refresh'))
      resetCreateForm()
      setCreateDialogOpen(false)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setNewProjectName('')
    setNewProjectDesc('')
    setInitialStatus('on_track')
    setDueDate('')
    setPriority('low')
    setShowAdvanced(false)
  }

  const getProjectIcon = (project, index) => {
    const i = index % PROJECT_ICONS.length
    return PROJECT_ICONS[i]
  }

  const getProgressBarColor = (status, percent) => {
    if (status === 'completed' || percent === 100) return 'bg-green-500'
    if (status === 'at_risk') return 'bg-amber-500'
    return 'bg-primary'
  }

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full gap-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">
            Project Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Monitor status, progress, and team assignments across all initiatives.
          </p>
        </div>
        {canCreateProject && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: PROJECT_PAGE_PRIMARY }}
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span>Create Project</span>
          </Button>
        )}
      </div>

      {/* Filters & Status Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex p-1 gap-1 overflow-x-auto w-full sm:w-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === tab.value
                  ? 'text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
              style={statusFilter === tab.value ? { backgroundColor: PROJECT_PAGE_PRIMARY } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filter
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
            Sort
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              Loading projects…
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No projects match the current filter. Create a project to get started.
                    </td>
                  </tr>
                ) : (
                paginatedProjects.map((project, index) => {
                  const statusConfig = statusBadgeConfig[project.status] || statusBadgeConfig.on_track
                  const progress = projectProgressMap[project._id] ?? 0
                  const barColor = getProgressBarColor(project.status, progress)
                  const iconName = getProjectIcon(project, index)
                  const iconBg =
                    project.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                      : project.status === 'at_risk'
                        ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                        : 'bg-primary/10 text-primary'
                  return (
                    <tr
                      key={project._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-10 rounded-lg flex items-center justify-center',
                              iconBg
                            )}
                            style={
                              iconBg.includes('primary')
                                ? { color: PROJECT_PAGE_PRIMARY, backgroundColor: `${PROJECT_PAGE_PRIMARY}20` }
                                : undefined
                            }
                          >
                            <span className="material-symbols-outlined">{iconName}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {project.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {project.updatedAt
                                ? `Last updated ${formatDistanceToNow(new Date(project.updatedAt), {
                                    addSuffix: true,
                                  })}`
                                : project.description || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full border border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {(project.createdBy?.name || project.createdBy?.email || '?').charAt(
                              0
                            ).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {project.createdBy?.name || project.createdBy?.email || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase',
                            statusConfig.className
                          )}
                        >
                          <span
                            className={cn('size-1.5 rounded-full', statusConfig.dotClass)}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                              className={cn('h-full rounded-full', barColor)}
                              style={{
                                width: `${progress}%`,
                                ...(barColor === 'bg-primary'
                                  ? { backgroundColor: PROJECT_PAGE_PRIMARY }
                                  : {}),
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/tasks?project=${project._id}`}
                            className="text-xs font-bold flex items-center gap-1"
                            style={{ color: PROJECT_PAGE_PRIMARY }}
                          >
                            <span className="material-symbols-outlined text-sm">assignment</span>
                            Tasks
                          </Link>
                          <button
                            type="button"
                            className="material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            aria-label="More actions"
                          >
                            more_horiz
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredProjects.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {filteredProjects.length}
              </span>{' '}
              results
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
                  variant="outline"
                  size="sm"
                  className={cn(
                    'rounded px-3 py-1',
                    currentPage === page
                      ? 'border-white text-white'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                  style={
                    currentPage === page
                      ? { backgroundColor: PROJECT_PAGE_PRIMARY, borderColor: PROJECT_PAGE_PRIMARY }
                      : undefined
                  }
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

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
              Overall Completion
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: PROJECT_PAGE_PRIMARY }}
            >
              donut_large
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {overallCompletion}%
              </span>
              <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                +0%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${overallCompletion}%`,
                  backgroundColor: PROJECT_PAGE_PRIMARY,
                }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
              Active Projects
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: PROJECT_PAGE_PRIMARY }}
            >
              sprint
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {String(activeCount).padStart(2, '0')}
            </span>
            <span className="text-slate-500 text-sm font-medium">
              Across {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
              Efficiency Score
            </span>
            <span
              className="material-symbols-outlined"
              style={{ color: PROJECT_PAGE_PRIMARY }}
            >
              bolt
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">92</span>
            <span className="text-xs font-bold text-slate-500 flex items-center bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Target: 90
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Your team is performing{' '}
            <span className="font-bold" style={{ color: PROJECT_PAGE_PRIMARY }}>
              2.2% above
            </span>{' '}
            benchmark this month.
          </p>
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-[#111318]/40 backdrop-blur-[1px]"
          className={cn(
            'max-w-[560px] rounded-xl shadow-2xl overflow-hidden p-0 gap-0 border bg-white flex flex-col',
            DIALOG_BORDER
          )}
        >
          {/* Modal Header */}
          <div
            className={cn(
              'px-6 py-4 border-b flex items-center justify-between',
              DIALOG_BORDER
            )}
          >
            <DialogHeader>
              <DialogTitle className={cn('text-xl font-bold', DIALOG_TEXT)}>
                Create New Project
              </DialogTitle>
              <DialogDescription className={cn('text-sm', DIALOG_MUTED)}>
                Enter the details for your new workspace project.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              className={cn(
                'p-1 rounded-lg transition-colors hover:bg-[#f5f6f8]',
                DIALOG_MUTED
              )}
              onClick={() => setCreateDialogOpen(false)}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleCreateProject} className="flex flex-col flex-1 min-h-0">
            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Project Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="project-name"
                  className={cn('text-sm font-semibold', DIALOG_TEXT)}
                >
                  Project Name
                </Label>
                <Input
                  id="project-name"
                  autoFocus
                  placeholder="e.g. Website Redesign 2024"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={cn(
                    'w-full h-11 px-3 bg-white rounded-lg border outline-none transition-all text-[#111318] placeholder:opacity-100',
                    'focus:ring-2 focus:border-[#0b50da] focus:ring-[#0b50da]/20',
                    DIALOG_BORDER,
                    'placeholder:text-[#606e8a]'
                  )}
                  required
                />
              </div>

              {/* Project Owner + Initial Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="project-owner"
                    className={cn('text-sm font-semibold', DIALOG_TEXT)}
                  >
                    Project Owner
                  </Label>
                  <div
                    className={cn(
                      'relative flex items-center h-11 px-3 bg-white rounded-lg text-[#111318] border',
                      DIALOG_BORDER
                    )}
                  >
                    <span className="text-sm truncate">
                      {user?.name || user?.email || 'You'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="initial-status"
                    className={cn('text-sm font-semibold', DIALOG_TEXT)}
                  >
                    Initial Status
                  </Label>
                  <div className="relative">
                    <select
                      id="initial-status"
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className={cn(
                        'w-full h-11 pl-3 pr-10 appearance-none bg-white rounded-lg border outline-none transition-all text-[#111318]',
                        'focus:ring-2 focus:border-[#0b50da] focus:ring-[#0b50da]/20',
                        DIALOG_BORDER
                      )}
                    >
                      {INITIAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={cn(
                        'material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none',
                        DIALOG_MUTED
                      )}
                    >
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label
                    htmlFor="project-description"
                    className={cn('text-sm font-semibold', DIALOG_TEXT)}
                  >
                    Description
                  </Label>
                  <span className={cn('text-xs', DIALOG_MUTED)}>Optional</span>
                </div>
                <Textarea
                  id="project-description"
                  placeholder="Describe the goals and scope of this project..."
                  value={newProjectDesc}
                  onChange={(e) =>
                    setNewProjectDesc((e.target.value || '').slice(0, MAX_DESCRIPTION_LENGTH))
                  }
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className={cn(
                    'w-full p-3 bg-white rounded-lg border resize-none outline-none transition-all placeholder:opacity-100',
                    'focus:ring-2 focus:border-[#0b50da] focus:ring-[#0b50da]/20',
                    DIALOG_BORDER,
                    'placeholder:text-[#606e8a]'
                  )}
                />
                <div className="flex justify-end">
                  <p
                    className={cn(
                      'text-[10px] uppercase tracking-wider font-medium',
                      DIALOG_MUTED
                    )}
                  >
                    {newProjectDesc.length} / {MAX_DESCRIPTION_LENGTH} characters
                  </p>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold hover:underline outline-none"
                style={{ color: PROJECT_PAGE_PRIMARY }}
                onClick={() => setShowAdvanced((v) => !v)}
              >
                <span className="material-symbols-outlined text-[14px]">settings</span>
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>

              {/* Advanced: Due Date + Priority */}
              {showAdvanced && (
                <div className="space-y-5 pt-2 border-t border-[#dbdfe6]">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="due-date"
                      className={cn('text-sm font-semibold', DIALOG_TEXT)}
                    >
                      Due Date (optional)
                    </Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={cn(
                        'w-full h-11 px-3 bg-white rounded-lg border outline-none transition-all',
                        'focus:ring-2 focus:border-[#0b50da] focus:ring-[#0b50da]/20',
                        DIALOG_BORDER
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className={cn('text-sm font-semibold', DIALOG_TEXT)}>
                      Project Priority
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRIORITY_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'cursor-pointer flex',
                            priority === opt.value &&
                              '[&>div]:border-[#0b50da] [&>div]:bg-[#0b50da]/5 [&>div]:text-[#0b50da]'
                          )}
                        >
                          <input
                            type="radio"
                            name="priority"
                            value={opt.value}
                            checked={priority === opt.value}
                            onChange={(e) => setPriority(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              'flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all',
                              'bg-white hover:bg-[#f5f6f8] border-[#dbdfe6] text-[#606e8a]'
                            )}
                          >
                            <span
                              className={cn('size-2 rounded-full shrink-0', opt.dotColor)}
                            />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={cn(
                'px-6 py-4 border-t flex items-center justify-end gap-3',
                DIALOG_BG_LIGHT,
                DIALOG_BORDER
              )}
            >
              <button
                type="button"
                className={cn(
                  'px-5 py-2.5 text-sm font-bold rounded-lg transition-colors',
                  DIALOG_MUTED,
                  'hover:text-[#111318] hover:bg-[#dbdfe6]/50'
                )}
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </button>
              <Button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] hover:opacity-90"
                style={{ backgroundColor: PROJECT_PAGE_PRIMARY }}
                disabled={creating}
              >
                {creating ? 'Creating…' : (
                  <>
                    Create Project
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
