import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Todos from './pages/Todos'

function App() {
  // For now, we'll use a simple check. Later, you can implement proper auth state management
  // Set to true to allow access without login for testing, or implement proper auth
  const isAuthenticated = true // This will be managed with context/state when you add backend

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/todos"
          element={isAuthenticated ? <Todos /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
