import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, AlertCircle, Eye, EyeOff, CheckSquare } from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'
import { authAPI } from '@/api/auth'
import { cn } from '@/lib/utils'

function GoogleIcon({ className }) {
  return (
    <svg className={cn('h-5 w-5', className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login: authLogin } = useContext(AuthContext)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const data = await authAPI.login(formData.email, formData.password)
      authLogin(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // Placeholder – wire to your Google OAuth when ready
    setError('Sign in with Google is not configured yet.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] p-4">
      {/* Header / Branding */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#2563eb] flex items-center justify-center rotate-[-4deg] shadow-sm">
          <CheckSquare className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">TaskFlow</span>
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-[400px] rounded-xl bg-white border border-border shadow-lg p-8">
        <h1 className="text-2xl font-bold text-foreground text-center">
          Sign in to your account
        </h1>
        <p className="text-muted-foreground text-sm text-center mt-1.5 mb-6">
          Welcome back! Please enter your details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="h-10 border-input bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                to="#"
                className="text-sm text-[#2563eb] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="h-10 border-input bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              name="remember"
              checked={formData.remember}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, remember: !!checked })
              }
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer text-muted-foreground"
            >
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider text-muted-foreground">
            <span className="bg-white px-2">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 border-input bg-white font-medium text-foreground hover:bg-muted/50"
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon className="mr-2" />
          Sign in with Google
        </Button>
      </div>

      {/* Footer */}
      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="text-[#2563eb] hover:underline font-medium"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  )
}

export default Login
