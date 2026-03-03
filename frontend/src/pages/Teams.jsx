import { useState, useEffect, useMemo, useContext, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Palette,
  Code2,
  TrendingUp,
  Heart,
  ChevronRight,
  User,
  X,
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { teamsAPI } from '@/api/teams'
import { usersAPI } from '@/api/users'
import { AuthContext } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'all', label: 'All Teams' },
  { id: 'my', label: 'My Teams' },
  { id: 'archived', label: 'Archived' },
]

const PAGE_SIZE = 6

const TEAM_ICONS = [
  { Icon: Palette, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { Icon: Code2, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { Icon: TrendingUp, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  { Icon: Heart, bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
]

function getTeamIcon(index) {
  return TEAM_ICONS[index % TEAM_ICONS.length]
}

function HealthBadge({ health }) {
  const status = (health || 'stable').toLowerCase()
  const config = {
    great: { label: 'Great', dot: 'bg-emerald-500', text: 'text-emerald-500' },
    stable: { label: 'Stable', dot: 'bg-emerald-500', text: 'text-emerald-500' },
    at_risk: { label: 'At Risk', dot: 'bg-amber-500', text: 'text-amber-500' },
  }
  const { label, dot, text } = config[status] || config.stable
  return (
    <span className={cn('flex items-center gap-1 text-sm font-bold', text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  )
}

function MemberAvatars({ members, maxShow = 3 }) {
  const list = members || []
  const show = list.slice(0, maxShow)
  const overflow = list.length - maxShow

  return (
    <div className="flex -space-x-2">
      {show.map((m) => (
        <div
          key={m._id}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-primary/15 text-xs font-semibold text-primary"
          title={m.name || m.email}
        >
          {(m.name || m.email || '?').charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
          +{overflow}
        </div>
      )}
    </div>
  )
}

export default function Teams() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState([])
  const [memberSearchOpen, setMemberSearchOpen] = useState(false)
  const memberSearchRef = useRef(null)
  const [creating, setCreating] = useState(false)
  const [actionTeamId, setActionTeamId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmTeamId, setConfirmTeamId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const effectiveRole = user?.role === 'user' ? 'employee' : user?.role
  const isAdmin = effectiveRole === 'admin'

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await teamsAPI.getTeams()
      setTeams(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch teams:', err)
      setError(err.response?.data?.message || 'Failed to load teams')
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (createOpen && user) {
      const current = { _id: user.id || user._id, name: user.name, email: user.email }
      setSelectedMembers([current])
    } else if (!createOpen) {
      setSelectedMembers([])
      setMemberSearchQuery('')
      setMemberSearchResults([])
      setMemberSearchOpen(false)
    }
  }, [createOpen, user])

  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setMemberSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await usersAPI.search(memberSearchQuery.trim())
        setMemberSearchResults(Array.isArray(data) ? data : [])
        setMemberSearchOpen(true)
      } catch {
        setMemberSearchResults([])
      }
    }, 200)
    return () => clearTimeout(t)
  }, [memberSearchQuery])

  const addMember = (member) => {
    const id = member._id
    if (selectedMembers.some((m) => (m._id || m) === id)) return
    setSelectedMembers((prev) => [...prev, { _id: id, name: member.name, email: member.email }])
    setMemberSearchQuery('')
    setMemberSearchResults([])
    setMemberSearchOpen(false)
  }

  const removeMember = (id) => {
    setSelectedMembers((prev) => prev.filter((m) => (m._id || m) !== id))
  }

  const filteredTeams = useMemo(() => {
    let list = teams

    if (activeTab === 'my') {
      const myId = user?.id || user?._id
      if (myId) list = list.filter((t) => (t.members || []).some((m) => (m._id || m) === myId))
      else list = []
    } else if (activeTab === 'archived') {
      list = list.filter((t) => t.archived)
    } else {
      list = list.filter((t) => !t.archived)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
    }
    return list
  }, [teams, activeTab, searchQuery, user])

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE))
  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTeams.slice(start, start + PAGE_SIZE)
  }, [filteredTeams, currentPage])

  const handleCreateTeam = async (e) => {
    e?.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    try {
      const memberIds = selectedMembers.map((m) => m._id)
      await teamsAPI.createTeam(createName.trim(), createDescription.trim() || undefined, memberIds)
      setCreateOpen(false)
      setCreateName('')
      setCreateDescription('')
      setSelectedMembers([])
      fetchTeams()
    } catch (err) {
      console.error('Failed to create team:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTeam = async (id) => {
    if (!isAdmin || !id) return
    setDeletingId(id)
    try {
      await teamsAPI.deleteTeam(id)
      setTeams((prev) => prev.filter((t) => t._id !== id))
      setActionTeamId(null)
      setConfirmTeamId(null)
    } catch (err) {
      console.error('Failed to delete team:', err)
      setError(err.response?.data?.message || 'Failed to delete team')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Teams
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization's specialized groups and permissions.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
          Loading teams…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Teams
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization's specialized groups and permissions.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Teams
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization's specialized groups and permissions.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <PlusCircle className="h-5 w-5" />
          Create Team
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search teams by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-1.5 text-xs font-bold rounded-md transition-colors',
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedTeams.map((team, index) => {
          const { Icon, bg, text } = getTeamIcon(index)
          return (
            <div
              key={team._id}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    bg,
                    text
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                {isAdmin && (
                  <div className="relative">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded"
                      aria-label="More options"
                      onClick={() =>
                        setActionTeamId((prev) => (prev === team._id ? null : team._id))
                      }
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {actionTeamId === team._id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          aria-hidden
                          onClick={() => setActionTeamId(null)}
                        />
                        <div className="absolute right-0 top-8 z-50 w-40 rounded-md border border-border bg-popover shadow-md py-1 text-sm">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted text-foreground"
                            onClick={() => {
                              setActionTeamId(null)
                              navigate(`/teams/${team._id}`)
                            }}
                          >
                            <span>Open details</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setActionTeamId(null)
                              setConfirmTeamId(team._id)
                            }}
                            disabled={deletingId === team._id}
                          >
                            <span>{deletingId === team._id ? 'Deleting…' : 'Delete team'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                {team.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2">
                {team.description || 'No description.'}
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Active Projects
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    {team.activeProjects ?? 0} Projects
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Health
                  </span>
                  <HealthBadge health={team.health} />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <MemberAvatars members={team.members} />
              </div>
            </div>
          )
        })}

        {/* Create new team card */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white dark:hover:bg-slate-900 hover:border-primary/50 transition-all group cursor-pointer min-h-[280px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-4">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Create new team
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[180px]">
            Organize a new group of people for a specific goal.
          </p>
        </button>
      </div>

      {filteredTeams.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
          No teams match your filters. Create a team to get started.
        </div>
      )}

      {/* Pagination */}
      {filteredTeams.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {Math.min(currentPage * PAGE_SIZE, filteredTeams.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {filteredTeams.length}
            </span>{' '}
            teams
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

      {/* Create New Team modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Team</DialogTitle>
            <DialogDescription>
              Set up a new space for your collaborators.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-5">
            <div>
              <label htmlFor="team-name" className="text-sm font-medium text-foreground">
                Team Name
              </label>
              <Input
                id="team-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g., Marketing Squad"
                className="mt-1.5 border-input"
                required
              />
            </div>
            <div>
              <label htmlFor="team-desc" className="text-sm font-medium text-foreground">
                Team Description
              </label>
              <textarea
                id="team-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Briefly describe the team's purpose..."
                rows={3}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Add Team Members
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 min-h-[42px]">
                {selectedMembers.map((m) => (
                  <span
                    key={m._id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                  >
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {m.name || m.email}
                    <button
                      type="button"
                      onClick={() => removeMember(m._id)}
                      className="rounded-full p-0.5 hover:bg-primary-foreground/20"
                      aria-label={`Remove ${m.name || m.email}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <div className="relative flex-1 min-w-[140px]">
                  <Input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onFocus={() => memberSearchResults.length > 0 && setMemberSearchOpen(true)}
                    placeholder="Search by name or email"
                    className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0"
                  />
                  {memberSearchOpen && memberSearchResults.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        aria-hidden
                        onClick={() => setMemberSearchOpen(false)}
                      />
                      <div
                        ref={memberSearchRef}
                        className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
                      >
                        {memberSearchResults
                          .filter((u) => !selectedMembers.some((m) => (m._id || m) === u._id))
                          .map((u) => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => addMember(u)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate">{u.name || u.email}</span>
                              {u.email && u.name && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {u.email}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !createName.trim()}>
                {creating ? 'Creating…' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirmTeamId}
        onOpenChange={(open) => {
          if (!open && !deletingId) setConfirmTeamId(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!!deletingId}
              onClick={() => confirmTeamId && handleDeleteTeam(confirmTeamId)}
            >
              {deletingId ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
