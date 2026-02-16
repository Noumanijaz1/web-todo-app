import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  Search,
  Plus,
  Bell,
  LogOut,
  Zap,
} from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'
import CreateTaskDialog from '@/components/ui/create-task-dialog'
import { todosAPI } from '@/api/todos'
import { cn } from '@/lib/utils'

// Sidebar order: Dashboard, Tasks, Settings, Projects, Teams
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppLayout() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleQuickCreate = async (formData, attachmentFiles = []) => {
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
      const newTask = await todosAPI.createTodo(payload)
      for (const file of attachmentFiles) {
        try {
          await todosAPI.addAttachment(newTask.id, file)
        } catch (e) {
          console.error('Failed to upload attachment:', e)
        }
      }
      setShowQuickCreate(false)
      window.dispatchEvent(new CustomEvent('todos-refresh'))
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setCreating(false)
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-border shadow-sm flex flex-col fixed left-0 top-0 h-full z-30">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-foreground text-lg block">TaskFlow</span>
              <span className="text-xs text-muted-foreground block">Workspace</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Button className="w-full justify-start" size="sm" asChild>
            <Link to="/projects">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 pl-56 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex-1 flex items-center gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Global search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-0"
                />
              </div>
              <Button onClick={() => setShowQuickCreate(true)} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Quick Create Task
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                    {initial}
                  </div>
                </button>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <CreateTaskDialog
        open={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSubmit={handleQuickCreate}
        loading={creating}
      />
    </div>
  )
}
