import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Filter, FolderKanban, Calendar, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { projectsAPI } from '@/api/projects'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Projects' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'completed', label: 'Completed' },
]

const statusBadgeClasses = {
  on_track: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  at_risk: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dotColor: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-orange-400' },
  { value: 'high', label: 'High', dotColor: 'bg-red-500' },
]

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('low')
  const [creating, setCreating] = useState(false)

  const fetchProjects = () => {
    projectsAPI
      .getAll()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const onRefresh = () => fetchProjects()
    window.addEventListener('projects-refresh', onRefresh)
    return () => window.removeEventListener('projects-refresh', onRefresh)
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        (project.name && project.name.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, searchQuery, statusFilter])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await projectsAPI.create({
        name: newProjectName,
        description: newProjectDesc,
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
    setDueDate('')
    setPriority('low')
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Projects
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your {filteredProjects.length} active workspace
            projects
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by project name, owner, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-xl h-10 border">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
            <Filter className="size-5" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading projects…</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project._id}
            className="p-5 hover:shadow-lg transition-all group flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="size-6" />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'uppercase tracking-wider text-[11px] font-bold',
                  statusBadgeClasses[project.status] || statusBadgeClasses.on_track
                )}
              >
                {project.status === 'on_track' ? 'On Track' : project.status === 'at_risk' ? 'At Risk' : 'Completed'}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {project.description || 'No description'}
            </p>
            {project.updatedAt && (
              <p className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1">
                <Calendar className="size-3.5" />
                Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </p>
            )}
            <div className="mt-auto pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/tasks?project=${project._id}`}>
                  View project tasks
                </Link>
              </Button>
            </div>
          </Card>
        ))}
        {/* New Project Card */}
        <Card
          className="p-5 flex flex-col items-center justify-center text-center cursor-pointer border-dashed bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all min-h-[240px]"
          onClick={() => setCreateDialogOpen(true)}
        >
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Plus className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">New Project</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Start a new workflow
          </p>
        </Card>
      </div>
      )}

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
          overlayClassName="backdrop-blur-sm"
          className="max-w-[560px] rounded-xl shadow-2xl overflow-hidden p-0 gap-0 border"
        >
          {/* Modal Header */}
          <div className="px-8 pt-8 pb-4 flex justify-between items-start">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold leading-tight tracking-tight">
                Create New Project
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Define your project scope and settings.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground -mr-2 -mt-2"
              onClick={() => setCreateDialogOpen(false)}
            >
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Modal Body / Form */}
          <form onSubmit={handleCreateProject}>
            <div className="px-8 py-4 space-y-6">
              {/* Project Name */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="project-name"
                  className="text-sm font-semibold"
                >
                  Project Name
                </Label>
                <Input
                  id="project-name"
                  placeholder="e.g. Q4 Marketing Campaign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="px-4 py-3 rounded-lg h-11"
                  required
                />
              </div>

              {/* Project Description */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="project-description"
                  className="text-sm font-semibold"
                >
                  Project Description
                </Label>
                <Textarea
                  id="project-description"
                  placeholder="Outline the goals and deliverables..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="px-4 py-3 rounded-lg resize-none min-h-0"
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="due-date"
                  className="text-sm font-semibold"
                >
                  Due Date (optional)
                </Label>
                <div className="relative">
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pr-10 h-11 px-4 py-3 rounded-lg"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Priority Selection */}
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold">
                  Project Priority
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'cursor-pointer group flex',
                        priority === opt.value &&
                          '[&>div]:border-primary [&>div]:bg-primary/5 [&>div]:text-primary'
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
                          'bg-background hover:bg-muted/50 border-input',
                          'text-muted-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'size-2 rounded-full shrink-0',
                            opt.dotColor
                          )}
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-8 bg-muted/50 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="font-bold"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="shadow-lg shadow-primary/20 font-bold"
                disabled={creating}
              >
                {creating ? 'Creating…' : (
                  <>
                    <Plus className="size-4" />
                    Create Project
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
