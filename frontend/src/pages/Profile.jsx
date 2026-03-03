import { useContext, useEffect, useState, useMemo } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { usersAPI } from '@/api/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3000'

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const effectiveUserId = user?._id || user?.id

  const profileImageUrl = useMemo(() => {
    if (!user?.profileImage) return null
    if (user.profileImage.startsWith('http')) return user.profileImage
    if (user.profileImage.startsWith('/uploads/')) {
      return `${API_BASE_URL}${user.profileImage}`
    }
    return `${API_BASE_URL}/uploads/${user.profileImage}`
  }, [user])

  useEffect(() => {
    const load = async () => {
      try {
        const me = await usersAPI.getMe()
        if (me) {
          setForm({
            name: me.name || '',
            email: me.email || '',
            phone: me.phone || '',
            dob: me.dob ? new Date(me.dob).toISOString().split('T')[0] : '',
          })
          // keep existing auth user in sync with latest profile
          setUser((prev) => ({
            ...(prev || {}),
            id: me._id || prev?.id,
            _id: me._id || prev?._id,
            name: me.name,
            email: me.email,
            role: me.role || prev?.role,
            phone: me.phone,
            dob: me.dob,
            profileImage: me.profileImage,
          }))
        }
      } catch (e) {
        setError('Failed to load profile')
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [setUser])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setAvatarFile(file || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('email', form.email)
      if (form.phone) data.append('phone', form.phone)
      if (form.dob) data.append('dob', form.dob)
      if (avatarFile) data.append('avatar', avatarFile)

      const updated = await usersAPI.updateMe(data)
      if (updated) {
        setUser((prev) => ({
          ...(prev || {}),
          id: updated._id || prev?.id,
          _id: updated._id || prev?._id,
          name: updated.name,
          email: updated.email,
          role: updated.role || prev?.role,
          phone: updated.phone,
          dob: updated.dob,
          profileImage: updated.profileImage,
        }))
        setSuccess('Profile updated successfully')
        setAvatarFile(null)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your personal information and profile picture.
        </p>
      </header>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-6">
          <div className=" size-24 rounded-full overflow-hidden">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={user?.name || 'Profile'}
                width={96}
                height={96}
                className="size-full object-cover border border-border"
              />
            ) : (
              <div className="size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {effectiveUserId ? `User ID: ${effectiveUserId}` : null}
            </p>
            <div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-primary cursor-pointer">
                <span>Change photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {avatarFile && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Phone
              </label>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Date of birth
              </label>
              <Input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {success}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

