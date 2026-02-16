import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LogOut, Plus, Check, X, Edit2, Trash2, ClipboardList, Calendar, AlertCircle } from 'lucide-react'
import { todosAPI } from '@/api/todos'
import { AuthContext } from '@/context/AuthContext'
import CreateTodoDialog from '@/components/ui/create-todo-dialog'

function Todos() {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const navigate = useNavigate()
  const { logout, user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin'

  // If admin, redirect to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin-dashboard')
    }
  }, [isAdmin, navigate])

  // Fetch todos from backend
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const data = await todosAPI.getTodos()
        setTodos(data)
      } catch (err) {
        console.error('Failed to fetch todos:', err)
        setError('Failed to load todos')
      }
    }
    fetchTodos()
  }, [])


  // Add new todo
  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (inputValue.trim() === '') return

    try {
      const newTodo = await todosAPI.createTodo(inputValue.trim(), '', 'medium', null)
      setTodos([...todos, newTodo])
      setInputValue('')
      setError('')
    } catch (err) {
      console.error('Failed to create todo:', err)
      setError('Failed to create todo')
    }
  }

  // Handle create todo from dialog
  const handleCreateTodoDialog = async (formData) => {
    setCreating(true)
    try {
      const dueDate = formData.dueDate ? new Date(formData.dueDate) : null
      const newTodo = await todosAPI.createTodo(
        formData.title,
        formData.description,
        formData.priority,
        dueDate
      )
      setTodos([...todos, newTodo])
      setShowCreateDialog(false)
      setError('')
    } catch (err) {
      console.error('Failed to create todo:', err)
      setError('Failed to create todo')
    } finally {
      setCreating(false)
    }
  }

  // Open edit dialog with current todo
  const handleOpenEditDialog = (todo) => {
    setEditingTodo(todo)
    setShowEditDialog(true)
  }

  // Handle edit todo from dialog
  const handleEditTodoDialog = async (formData) => {
    setCreating(true)
    try {
      const dueDate = formData.dueDate ? new Date(formData.dueDate) : null
      const updatedTodo = await todosAPI.updateTodo(editingTodo._id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: dueDate
      })
      setTodos(todos.map(t => (t._id === editingTodo._id ? updatedTodo : t)))
      setShowEditDialog(false)
      setEditingTodo(null)
      setError('')
    } catch (err) {
      console.error('Failed to update todo:', err)
      setError('Failed to update todo')
    } finally {
      setCreating(false)
    }
  }

  // Delete todo
  const handleDeleteTodo = async (id) => {
    try {
      await todosAPI.deleteTodo(id)
      setTodos(todos.filter(todo => todo._id !== id))
      setError('')
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Failed to delete todo:', err)
      setError('Failed to delete todo')
    }
  }

  // Toggle todo completion
  const handleToggleComplete = async (id) => {
    try {
      const todo = todos.find(t => t._id === id)
      const updatedTodo = await todosAPI.updateTodo(id, { completed: !todo.completed })
      setTodos(todos.map(t => (t._id === id ? updatedTodo : t)))
      setError('')
    } catch (err) {
      console.error('Failed to update todo:', err)
      setError('Failed to update todo')
    }
  }

  // Start editing
  const handleStartEdit = (id, text) => {
    const todo = todos.find(t => t._id === id)
    handleOpenEditDialog(todo)
  }

  // Save edit
  const handleSaveEdit = async (id) => {
    if (editValue.trim() === '') {
      handleDeleteTodo(id)
      return
    }

    try {
      const updatedTodo = await todosAPI.updateTodo(id, { title: editValue.trim() })
      setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)))
      setEditingId(null)
      setEditValue('')
      setError('')
    } catch (err) {
      console.error('Failed to update todo:', err)
      setError('Failed to update todo')
    }
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const completedCount = todos.filter(t => t.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Todo App</h1>
            <p className="text-muted-foreground mt-1">Manage your tasks efficiently</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Add Todo Form */}
        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAddTodo} className="flex gap-2">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Add a quick task..."
                  className="flex-1"
                />
                <Button type="submit" variant="outline">
                  <Plus className="h-4 w-4" />
                  Quick Add
                </Button>
                <Button 
                  type="button"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>
              {totalCount > 0
                ? `${completedCount} of ${totalCount} tasks completed`
                : 'No tasks yet. Add one above to get started!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No todos yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add one above to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo._id}
                    className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    {editingId === todo._id ? (
                      // Removed inline edit mode - now using dialog
                      <div />
                    ) : (
                      // View Mode
                      <div className="space-y-3">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={todo.completed}
                              onCheckedChange={() => handleToggleComplete(todo._id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <span
                                className={`text-lg font-medium block ${
                                  todo.completed
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                }`}
                              >
                                {todo.title}
                              </span>
                              {todo.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {todo.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOpenEditDialog(todo)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirmId(todo._id)}
                                  title="Delete"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          {/* Priority Badge */}
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                todo.priority === 'high'
                                  ? 'bg-red-500'
                                  : todo.priority === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                            />
                            <span className="text-muted-foreground capitalize">
                              {todo.priority} Priority
                            </span>
                          </div>

                          {/* Due Date */}
                          {todo.dueDate && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(todo.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              {new Date(todo.dueDate) < new Date() && !todo.completed && (
                                <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Todo Dialog */}
      <CreateTodoDialog 
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTodoDialog}
        loading={creating}
      />

      {/* Edit Todo Dialog */}
      {editingTodo && (
        <CreateTodoDialog 
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setEditingTodo(null)
          }}
          onSubmit={handleEditTodoDialog}
          loading={creating}
          initialData={{
            title: editingTodo.title,
            description: editingTodo.description || '',
            priority: editingTodo.priority || 'medium',
            dueDate: editingTodo.dueDate ? new Date(editingTodo.dueDate).toISOString().split('T')[0] : ''
          }}
          isEditing={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this todo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteTodo(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Todos
