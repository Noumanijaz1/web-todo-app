import { useState, useEffect } from 'react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'
import { CreateTodoDialog } from '../components/ui/create-todo-dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { Edit2, Trash2, Plus, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {todosAPI} from '../api/todos'

export default function AdminDashboard() {
  const { user } = useContext(AuthContext)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const data = await todosAPI.getTodos()
      setTodos(data)
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingTodo(null)
    setDialogOpen(true)
  }

  const handleEditClick = (todo) => {
    setEditingTodo(todo)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTodo(null)
  }

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true)
      if (editingTodo) {
        // Remove assignedTo if it's the 'unassigned' sentinel
        const updateData = { ...formData }
        if (updateData.assignedTo === 'unassigned') {
          updateData.assignedTo = null
        }
        await todosAPI.updateTodo(editingTodo._id, updateData)
      } else {
        // Remove assignedTo if it's the 'unassigned' sentinel
        const createData = { ...formData }
        if (createData.assignedTo === 'unassigned') {
          delete createData.assignedTo
        }
        await todosAPI.createTodo(createData)
      }
      await fetchTodos()
      handleDialogClose()
    } catch (error) {
      console.error('Failed to save todo:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (todo) => {
    setTodoToDelete(todo)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true)
      await todosAPI.deleteTodo(todoToDelete._id)
      await fetchTodos()
      setDeleteConfirmOpen(false)
      setTodoToDelete(null)
    } catch (error) {
      console.error('Failed to delete todo:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCompleted = async (todo) => {
    try {
      await todosAPI.updateTodo(todo._id, { completed: !todo.completed })
      await fetchTodos()
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return colors[priority] || colors.medium
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Manage and assign tasks to team members</p>
          </div>
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        <div className="grid gap-6">
          {todos.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500 text-lg">No tasks yet. Create one to get started!</p>
            </Card>
          ) : (
            todos.map(todo => (
              <Card key={todo._id} className={`p-6 transition-all hover:shadow-lg ${todo.completed ? 'bg-slate-50' : ''}`}>
                <div className="flex gap-4">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleCompleted(todo)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-slate-600 text-sm mt-2">{todo.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(todo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(todo)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <Badge className={getPriorityColor(todo.priority)}>
                        {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                      </Badge>

                      {todo.dueDate && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue(todo.dueDate) ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                            {isOverdue(todo.dueDate) ? '⚠️ Overdue: ' : ''}
                            {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      {todo.assignedTo && (
                        <div className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          Assigned to: {todo.assignedTo.name}
                        </div>
                      )}

                      {!todo.assignedTo && (
                        <div className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          Unassigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreateTodoDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        loading={submitting}
        initialData={editingTodo}
        isEditing={!!editingTodo}
        isAdmin={true}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{todoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
