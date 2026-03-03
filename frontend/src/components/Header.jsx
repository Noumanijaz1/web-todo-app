import React, { useContext, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, User } from 'lucide-react'
import { Input } from '@/components/ui/input'

const Header = () => {
    const { logout, user } = useContext(AuthContext)
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const handleLogout = () => {
        logout()
        navigate('/login')
    }
    const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
    return (
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
                                        onClick={() => {
                                            setShowUserMenu(false)
                                            navigate('/profile')
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <User className="h-4 w-4" />
                                        Profile
                                    </button>
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
    )
}

export default Header