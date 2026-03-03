import React, { useContext } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Zap,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  UserCog,
  Settings
} from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'

/*
  ROLE-BASED SIDEBAR CONFIG
  You can change order here to set preference
*/

const sidebarConfig = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: UserCog, label: 'Users' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],

  project_manager: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],

  employee: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
  ],
}

const getNavItems = (role) => {
  const r = role === 'user' ? 'employee' : role
  return sidebarConfig[r] || sidebarConfig.employee || []
}

const Sidebar = () => {
  const { user } = useContext(AuthContext)
  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role

  return (
    <aside className="w-56 bg-white border-r border-border shadow-sm flex flex-col fixed left-0 top-0 h-full z-30">

      {/* Logo Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-lg block">
              TaskFlow
            </span>
            <span className="text-xs text-muted-foreground block">
              Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {getNavItems(effectiveRole).map(({ to, icon: Icon, label }) => (
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

      {/* Bottom Button (Only Admin & Project Manager) */}
      {(effectiveRole === 'admin' || effectiveRole === 'project_manager') && (
        <div className="p-3 border-t border-border space-y-1">
          <Button className="w-full justify-start" size="sm" asChild>
            <Link to="/projects">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      )}
    </aside>
  )
}

export default Sidebar