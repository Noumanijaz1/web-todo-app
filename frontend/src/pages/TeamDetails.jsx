import { useState, useEffect, useContext, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  UserPlus,
  Palette,
  Users,
  Rocket,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { teamsAPI } from '@/api/teams'
import { cn } from '@/lib/utils'
import { AuthContext } from '@/context/AuthContext'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'projects', label: 'Projects' },
  { id: 'settings', label: 'Settings' },
]

// Mock recent projects (replace with API when available)
const MOCK_RECENT_PROJECTS = [
  { id: 1, name: 'Q4 Design System', category: 'Internal Branding', priority: 'high', progress: 80 },
  { id: 2, name: 'Mobile App Redesign', category: 'Client: FinTech Corp', priority: 'medium', progress: 45 },
]

function getRoleBadgeClass(role) {
  const r = (role || 'contributor').toLowerCase()
  if (r === 'team_lead' || r === 'admin') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  return 'bg-muted text-muted-foreground'
}

export default function TeamDetails() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = useMemo(() => {
    const role = user?.role === 'user' ? 'employee' : user?.role
    return role === 'admin'
  }, [user])

  useEffect(() => {
    if (!teamId) return
    const fetch = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await teamsAPI.getTeam(teamId)
        setTeam(data)
      } catch (err) {
        setError(err.response?.status === 404 ? 'Team not found' : err.response?.data?.message || 'Failed to load team')
        setTeam(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [teamId])

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    if (!teamId || !team || !isAdmin) return
    setSaving(true)
    try {
      const payload = {
        name: team.name,
        description: team.description,
        health: team.health,
        archived: !!team.archived,
      }
      const updated = await teamsAPI.updateTeam(teamId, payload)
      setTeam(updated)
    } catch (err) {
      console.error('Failed to update team', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!teamId || !isAdmin) return
    if (!window.confirm('Are you sure you want to delete this team? This cannot be undone.')) return
    setDeleting(true)
    try {
      await teamsAPI.deleteTeam(teamId)
      navigate('/teams')
    } catch (err) {
      console.error('Failed to delete team', err)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Loading team…
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-destructive font-medium">{error || 'Team not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/teams')}>
            Back to Teams
          </Button>
        </div>
      </div>
    )
  }

  const members = team.members || []
  const memberCount = members.length
  const activeProjects = team.activeProjects ?? 0
  // Mock tasks completed (replace with API when available)
  const tasksCompleted = 148

  return (
    <div className="space-y-0">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center text-sm text-muted-foreground mb-4 gap-2">
            <Link to="/teams" className="hover:text-primary transition-colors">
              Teams
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground font-medium">{team.name}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                <Palette className="size-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
                <p className="text-muted-foreground font-medium">
                  {memberCount} Member{memberCount !== 1 ? 's' : ''} • {activeProjects} Active Project{activeProjects !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button className="shrink-0 shadow-sm">
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          </div>
          {/* Tabs */}
          <div className="flex gap-8 mt-8 border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 text-sm font-semibold border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-muted-foreground/30'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Users className="size-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                    +2%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Members</p>
                <h3 className="text-3xl font-bold text-foreground">{memberCount}</h3>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Rocket className="size-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold text-muted-foreground bg-muted">
                    0%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
                <h3 className="text-3xl font-bold text-foreground">{activeProjects}</h3>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                    +12%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tasks Completed</p>
                <h3 className="text-3xl font-bold text-foreground">{tasksCompleted}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Team Members List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-foreground">Team Members</h4>
                  <button type="button" className="text-sm font-semibold text-primary hover:underline">
                    View all
                  </button>
                </div>
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Member</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {members.slice(0, 5).map((m, i) => (
                          <tr key={m._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                                  {(m.name || m.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{m.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={cn('text-xs font-semibold', getRoleBadgeClass(i === 0 ? 'team_lead' : 'contributor'))}>
                                {i === 0 ? 'Team Lead' : 'Contributor'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-xs font-medium text-muted-foreground">Active</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button type="button" className="text-muted-foreground hover:text-foreground p-1 rounded">
                                <MoreVertical className="size-4" />
                                <span className="sr-only">Actions</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-foreground">Recent Projects</h4>
                  <button type="button" className="text-sm font-semibold text-primary hover:underline">
                    See all
                  </button>
                </div>
                <div className="space-y-4">
                  {MOCK_RECENT_PROJECTS.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-card p-5 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-bold text-foreground">{proj.name}</h5>
                          <p className="text-xs text-muted-foreground">{proj.category}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-bold',
                            proj.priority === 'high' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {proj.priority}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground">{proj.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                      <div className="mt-4 flex -space-x-2">
                        <div className="size-7 rounded-full border-2 border-background bg-muted" />
                        <div className="size-7 rounded-full border-2 border-background bg-muted" />
                        <div className="size-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          +3
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-muted-foreground">Members tab — coming soon.</p>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-muted-foreground">Projects tab — coming soon.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            {!isAdmin && (
              <p className="text-sm text-muted-foreground">
                Only admins can update or delete teams.
              </p>
            )}
            <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="team-name">
                  Team name
                </label>
                <Input
                  id="team-name"
                  value={team.name || ''}
                  onChange={(e) => setTeam((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5"
                  disabled={!isAdmin}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="team-desc">
                  Description
                </label>
                <Textarea
                  id="team-desc"
                  value={team.description || ''}
                  onChange={(e) => setTeam((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1.5 min-h-[100px]"
                  placeholder="Briefly describe what this team is responsible for."
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Danger zone</p>
                  <p className="text-xs text-muted-foreground">
                    Deleting a team is permanent and cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteTeam}
                  disabled={!isAdmin || deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete team'}
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={!isAdmin || saving}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
