import { useState, useMemo } from 'react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  Filter,
  Megaphone,
  Globe,
  Smartphone,
  MessageSquare,
  Shield,
  Calendar,
  X,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Projects' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'completed', label: 'Completed' },
]

const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'Q4 Marketing Campaign',
    description:
      'Executing multi-channel social media strategy including LinkedIn ads and influencer outreach.',
    status: 'on_track',
    progress: 72,
    icon: Megaphone,
    iconBg: 'bg-primary/10 text-primary',
    barColor: 'bg-primary',
    updated: '2h ago',
  },
  {
    id: 2,
    name: 'Website Redesign',
    description:
      'Updating landing pages and component library to align with new brand guidelines.',
    status: 'at_risk',
    progress: 34,
    icon: Globe,
    iconBg: 'bg-orange-50 text-orange-500',
    barColor: 'bg-orange-500',
    updated: '5h ago',
  },
  {
    id: 3,
    name: 'Mobile App v2.0',
    description:
      'Beta testing new features with selected users. Focusing on offline mode stability.',
    status: 'on_track',
    progress: 88,
    icon: Smartphone,
    iconBg: 'bg-blue-50 text-blue-500',
    barColor: 'bg-primary',
    updated: '1d ago',
  },
  {
    id: 4,
    name: 'Q3 Review',
    description:
      'Compiling feedback from the third quarter stakeholders for executive reporting.',
    status: 'completed',
    progress: 100,
    icon: MessageSquare,
    iconBg: 'bg-gray-100 text-gray-500',
    barColor: 'bg-green-500',
    updated: '3d ago',
  },
  {
    id: 5,
    name: 'Internal Security Audit',
    description:
      'Critical review of all system access points and encryption protocols for compliance.',
    status: 'at_risk',
    progress: 15,
    icon: Shield,
    iconBg: 'bg-red-50 text-red-500',
    barColor: 'bg-red-500',
    updated: '4d ago',
  },
]

const statusBadgeClasses = {
  on_track: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  at_risk: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const WORKSPACE_OPTIONS = [
  { value: 'product-design', label: 'Product Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dotColor: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-orange-400' },
  { value: 'high', label: 'High', dotColor: 'bg-red-500' },
]

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [workspace, setWorkspace] = useState('product-design')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('low')

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const handleCreateProject = (e) => {
    e.preventDefault()
    // TODO: Wire up to API
    setNewProjectName('')
    setNewProjectDesc('')
    setWorkspace('product-design')
    setDueDate('')
    setPriority('low')
    setCreateDialogOpen(false)
  }

  const resetCreateForm = () => {
    setNewProjectName('')
    setNewProjectDesc('')
    setWorkspace('product-design')
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const Icon = project.icon
          return (
            <Card
              key={project.id}
              className="p-5 hover:shadow-lg transition-all group flex flex-col cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    project.iconBg
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'uppercase tracking-wider text-[11px] font-bold',
                    statusBadgeClasses[project.status]
                  )}
                >
                  {project.status === 'on_track' ? 'On Track' : project.status === 'at_risk' ? 'At Risk' : 'Completed'}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                {project.description}
              </p>
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    Progress
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      project.status === 'at_risk' && project.progress < 40
                        ? 'text-red-500'
                        : 'text-primary'
                    )}
                  >
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-6">
                  <div
                    className={cn('h-full rounded-full', project.barColor)}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="size-7 rounded-full border-2 border-background bg-muted"
                      />
                    ))}
                    <div className="size-7 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      +4
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Updated {project.updated}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
        {/* New Project Card */}
        <Card
          className="p-5 flex flex-col items-center justify-center text-center cursor-pointer border-dashed bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all min-h-[280px]"
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

              {/* Workspace & Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="workspace"
                    className="text-sm font-semibold"
                  >
                    Select Workspace
                  </Label>
                  <Select value={workspace} onValueChange={setWorkspace}>
                    <SelectTrigger
                      id="workspace"
                      className="w-full h-11 px-4 py-3 rounded-lg"
                    >
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="due-date"
                    className="text-sm font-semibold"
                  >
                    Due Date
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
              >
                <Plus className="size-4" />
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
