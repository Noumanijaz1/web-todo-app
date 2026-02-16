import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  User,
  FolderKanban,
  MessageSquare,
  Paperclip,
  Loader2,
  Send,
  FileText,
} from 'lucide-react'
import { todosAPI } from '@/api/todos'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:3000'

export default function TaskDetail() {
  const { taskId } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const fileInputRef = useRef(null)

  const fetchTask = () => {
    if (!taskId) return
    setLoading(true)
    todosAPI
      .getTodoById(taskId)
      .then(setTask)
      .catch(() => setTask(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !taskId) return
    setSubmittingComment(true)
    try {
      const updated = await todosAPI.addComment(taskId, commentText.trim())
      setTask(updated)
      setCommentText('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStatusChange = async (value) => {
    if (!taskId) return
    setStatusUpdating(true)
    try {
      const updated = await todosAPI.updateTodo(taskId, { status: value })
      setTask(updated)
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !taskId) return
    setUploadingFile(true)
    try {
      const updated = await todosAPI.addAttachment(taskId, file)
      setTask(updated)
      e.target.value = ''
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploadingFile(false)
    }
  }

  const attachmentUrl = (path) => `${API_BASE_URL}/uploads/${path}`

  const priorityVariant = (p) => {
    const v = (p || 'medium').toLowerCase()
    if (v === 'high') return 'bg-red-500 text-white border-0'
    if (v === 'medium') return 'bg-blue-500 text-white border-0'
    return 'bg-green-500 text-white border-0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <p className="text-muted-foreground">Task not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
      </div>

      {/* Task info */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <Select
              value={task.status || (task.completed ? 'done' : 'todo')}
              onValueChange={handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <p className="text-muted-foreground text-sm">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span>{task.dueDate ? format(new Date(task.dueDate), 'PPP') : '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned:</span>
              <span>{task.assignedTo ? (task.assignedTo.name || task.assignedTo.email) : 'Unassigned'}</span>
            </div>
            {task.projectId && (
              <div className="flex items-center gap-1.5">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Project:</span>
                <span>{task.projectId.name}</span>
              </div>
            )}
            <Badge className={cn('uppercase', priorityVariant(task.priority))}>
              {task.priority || 'medium'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({task.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="resize-none"
              disabled={submittingComment}
            />
            <Button type="submit" size="icon" disabled={!commentText.trim() || submittingComment}>
              {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <ul className="space-y-3">
            {(task.comments || []).map((c, i) => (
              <li key={i} className="flex gap-2 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                    {(c.userName || '?').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.userName || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                  {c.createdAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(c.createdAt), 'PPp')}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <li className="text-sm text-muted-foreground py-4">No comments yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments ({task.attachments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Paperclip className="h-4 w-4 mr-2" />
              )}
              Upload file
            </Button>
            <span className="text-xs text-muted-foreground">PDF, DOC, images</span>
          </div>
          <ul className="space-y-2">
            {(task.attachments || []).map((a, i) => (
              <li key={i} className="flex items-center gap-2 p-2 rounded border">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={attachmentUrl(a.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {a.originalName}
                </a>
              </li>
            ))}
            {(!task.attachments || task.attachments.length === 0) && (
              <li className="text-sm text-muted-foreground py-2">No attachments yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
