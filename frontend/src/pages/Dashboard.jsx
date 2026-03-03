import { useState, useEffect, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ListTodo,
  CheckCircle2,
  FolderOpen,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react'
import { todosAPI } from '@/api/todos'
import { projectsAPI } from '@/api/projects'
import { AuthContext } from '@/context/AuthContext'
import { format, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'

function StatCard({ title, value, subtitle, icon: Icon, trend, trendDown, progress, status, statusClass }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              'text-2xl font-bold mt-1',
              statusClass === 'overdue' && 'text-destructive'
            )}>
              {value}
            </p>
            {trend != null && (
              <p className={cn('text-xs mt-1', trendDown ? 'text-destructive' : 'text-muted-foreground')}>
                {trend}
              </p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {status && <p className={cn('text-xs font-medium mt-1', statusClass)}>{status}</p>}
            {progress != null && (
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            )}
          </div>
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            title === 'Total Tasks' && 'bg-muted',
            title === 'Completed' && 'bg-green-100 text-green-600',
            title === 'Pending' && 'bg-amber-100 text-amber-600',
            title === 'Overdue' && 'bg-red-100 text-red-600'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      todosAPI.getTodos().catch(() => []),
      projectsAPI.getAll().catch(() => []),
    ])
      .then(([todosData, projectsData]) => {
        setTodos(Array.isArray(todosData) ? todosData : [])
        setProjects(Array.isArray(projectsData) ? projectsData : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const onRefresh = () => {
      todosAPI.getTodos().then(setTodos).catch(() => {})
      projectsAPI.getAll().then(setProjects).catch(() => {})
    }
    window.addEventListener('todos-refresh', onRefresh)
    window.addEventListener('projects-refresh', onRefresh)
    return () => {
      window.removeEventListener('todos-refresh', onRefresh)
      window.removeEventListener('projects-refresh', onRefresh)
    }
  }, [])

  const totalTasks = todos.length
  const completed = todos.filter((t) => t.completed).length
  const pending = todos.filter((t) => !t.completed).length
  const now = new Date()
  const overdue = todos.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length
  const userId = user?.id || user?._id
  const myTasksCount = todos.filter((t) => {
    const id = t.assignedTo?._id || t.assignedTo
    return id && String(id) === String(userId)
  }).length
  const totalProjects = projects.length
  const completedPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

  const recentActivity = useMemo(() => {
    const events = []

    todos.forEach((t) => {
      if (t.createdAt) {
        events.push({
          id: `created-${t.id}`,
          type: 'created',
          taskTitle: t.title,
          date: new Date(t.createdAt),
          userName: 'Someone',
        })
      }

      ;(t.comments ?? []).forEach((c, idx) => {
        const created = c.createdAt ? new Date(c.createdAt) : null
        events.push({
          id: `comment-${t.id}-${idx}`,
          type: 'comment',
          taskTitle: t.title,
          date: created || new Date(),
          userName: c.userName || 'Someone',
          text: c.text,
        })
      })
    })

    events.sort((a, b) => b.date - a.date)
    return events.slice(0, 5)
  }, [todos])

  const upcomingDeadlines = todos
    .filter((t) => t.dueDate && !t.completed && new Date(t.dueDate) >= now)
    .map((t) => ({ ...t, due: new Date(t.dueDate) }))
    .sort((a, b) => a.due - b.due)
    .slice(0, 5)

  const formatDeadline = (date) => {
    const d = new Date(date)
    if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
    if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, yyyy')
  }

  const priorityVariant = (p) => {
    if (p === 'high') return 'bg-red-500 text-white border-0'
    if (p === 'medium') return 'bg-blue-500 text-white border-0'
    return 'bg-sky-100 text-sky-800 border-0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your tasks and activity</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderOpen}
        />
        <StatCard
          title="Total Pending Tasks"
          value={pending}
          status="Ongoing"
          statusClass="text-amber-600"
          icon={ListTodo}
        />
        <StatCard
          title="My Tasks"
          value={myTasksCount}
          icon={CheckCircle2}
        />
        <StatCard
          title="Overdue Tasks"
          value={overdue}
          status="Immediate Action"
          statusClass="text-destructive"
          icon={AlertCircle}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Team Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No recent team activity.</p>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {(item.userName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.type === 'comment' ? (
                        <>
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{item.userName}</span>
                            {' commented on '}
                            <Link to="/tasks" className="text-primary hover:underline font-medium">
                              {item.taskTitle}
                            </Link>
                          </p>
                          {item.text && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{item.text}"</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{item.userName}</span>
                          {' created task '}
                          <Link to="/tasks" className="text-primary hover:underline font-medium">
                            {item.taskTitle}
                          </Link>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(item.date, 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{todo.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDeadline(todo.dueDate)}
                    </p>
                  </div>
                  <Badge className={cn('shrink-0 text-[10px] uppercase', priorityVariant(todo.priority))}>
                    {todo.priority || 'medium'}
                  </Badge>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full border-dashed mt-2" asChild>
              <Link to="/tasks">
                <Calendar className="h-4 w-4 mr-2" />
                View All Deadlines
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
