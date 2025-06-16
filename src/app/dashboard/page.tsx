'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Calendar, 
  Tag, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Circle, 
  Pause,
  X,
  Edit,
  Save,
  Download,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Trash2,
  FileText
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Task {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  startDate: string | null
  endDate: string | null
  tags: string[]
  assignee: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

const Dashboard = () => {
  const { data: session, status } = useSession()
  const [darkMode, setDarkMode] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [currentView, setCurrentView] = useState('kanban')

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  const statusConfig = {
    OPEN: { label: 'פתוחה', icon: Circle, color: 'text-blue-500', bg: 'bg-blue-50' },
    IN_PROGRESS: { label: 'בביצוע', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    COMPLETED: { label: 'הושלמה', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    PAUSED: { label: 'מושהית', icon: Pause, color: 'text-gray-500', bg: 'bg-gray-50' },
    CANCELLED: { label: 'מבוטלת', icon: X, color: 'text-red-500', bg: 'bg-red-50' }
  }
  
  const priorityConfig = {
    HIGH: { label: 'גבוה', color: 'text-red-600 bg-red-100' },
    MEDIUM: { label: 'בינוני', color: 'text-yellow-600 bg-yellow-100' },
    LOW: { label: 'נמוך', color: 'text-green-600 bg-green-100' }
  }

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const data = await response.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchTasks()
    }
  }, [session])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const open = tasks.filter(t => t.status === 'OPEN').length
    const paused = tasks.filter(t => t.status === 'PAUSED').length
    
    return {
      total,
      completed,
      inProgress,
      open,
      paused,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, searchTerm, filterStatus, filterPriority])

  const createTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [newTask, ...prev])
        return true
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
    return false
  }

  const updateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ))
        return true
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
    return false
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        return true
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
    return false
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    updateTask(taskId, { status: newStatus })
  }

  const exportToCSV = () => {
    const headers = ['שם המשימה', 'תיאור', 'סטטוס', 'עדיפות', 'אחראי', 'תאריך התחלה', 'תאריך סיום', 'תגיות']
    const data = tasks.map(task => [
      task.title,
      task.description,
      statusConfig[task.status].label,
      priorityConfig[task.priority].label,
      task.assignee.name,
      task.startDate || '',
      task.endDate || '',
      task.tags.join(', ')
    ])
    
    const csvContent = [headers, ...data]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusConfig[task.status].icon
    
    return (
      <div
        className={`p-4 rounded-lg border shadow-sm cursor-move transition-all hover:shadow-md ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setEditingTask(task)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        <p className={`text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {task.description}
        </p>
        
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full ${priorityConfig[task.priority].color}`}>
            {priorityConfig[task.priority].label}
          </span>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {task.assignee.name}
          </span>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const KanbanView = () => (
    <div className="kanban-container">
      {Object.entries(statusConfig).map(([status, config]) => {
        const statusTasks = filteredTasks.filter(task => task.status === status)
        const StatusIcon = config.icon
        
        return (
          <div
            key={status}
            className={`p-4 rounded-lg border-2 border-dashed min-h-96 ${
              darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center gap-2 mb-4">
              <StatusIcon size={16} className={config.color} />
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {config.label}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'
              }`}>
                {statusTasks.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {statusTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  const AnalyticsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>סה"כ משימות</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>הושלמו</p>
              <p className={`text-2xl font-bold text-green-600`}>{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>בביצוע</p>
              <p className={`text-2xl font-bold text-yellow-600`}>{stats.inProgress}</p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>אחוז השלמה</p>
              <p className={`text-2xl font-bold text-blue-600`}>{stats.completionRate}%</p>
            </div>
            <BarChart3 className="text-blue-500" size={24} />
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          התפלגות משימות לפי סטטוס
        </h3>
        <div className="space-y-3">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = tasks.filter(t => t.status === status).length
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
            
            return (
              <div key={status} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-24">
                  <config.icon size={16} className={config.color} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {config.label}
                  </span>
                </div>
                <div className="flex-1">
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className={`h-2 rounded-full ${config.color.replace('text-', 'bg-').replace('-500', '-400')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm w-12 text-right ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const CreateTaskModal = () => {
    const [newTask, setNewTask] = useState({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      startDate: '',
      endDate: '',
      tags: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newTask.title.trim()) return

      const taskData = {
        ...newTask,
        tags: newTask.tags.split(',').map(t => t.trim()).filter(t => t)
      }

      const success = await createTask(taskData)
      if (success) {
        setShowCreateModal(false)
        setNewTask({
          title: '',
          description: '',
          status: 'OPEN',
          priority: 'MEDIUM',
          startDate: '',
          endDate: '',
          tags: ''
        })
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`max-w-md w-full mx-4 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            משימה חדשה
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="שם המשימה"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
            
            <textarea
              placeholder="תיאור המשימה"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg h-20 resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Object.entries(priorityConfig).map(([priority, config]) => (
                  <option key={priority} value={priority}>{config.label}</option>
                ))}
              </select>
              
              <select
                value={newTask.status}
                onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as any }))}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newTask.startDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <input
                type="date"
                value={newTask.endDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, endDate: e.target.value }))}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <input
              type="text"
              placeholder="תגיות (מופרדות בפסיק)"
              value={newTask.tags}
              onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                יצירה
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const EditTaskModal = () => {
    if (!editingTask) return null

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingTask.title.trim()) return

      const updatedTask = {
        ...editingTask,
        tags: typeof editingTask.tags === 'string' 
          ? editingTask.tags.split(',').map(t => t.trim()).filter(t => t)
          : editingTask.tags
      }

      const success = await updateTask(editingTask.id, updatedTask)
      if (success) {
        setEditingTask(null)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`max-w-md w-full mx-4 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            עריכת משימה
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="שם המשימה"
              value={editingTask.title}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
            
            <textarea
              placeholder="תיאור המשימה"
              value={editingTask.description}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              className={`w-full px-3 py-2 border rounded-lg h-20 resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editingTask.priority}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Object.entries(priorityConfig).map(([priority, config]) => (
                  <option key={priority} value={priority}>{config.label}</option>
                ))}
              </select>
              
              <select
                value={editingTask.status}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={editingTask.startDate || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <input
                type="date"
                value={editingTask.endDate || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                className={`px-3 py-2 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <input
              type="text"
              placeholder="תגיות (מופרדות בפסיק)"
              value={Array.isArray(editingTask.tags) ? editingTask.tags.join(', ') : editingTask.tags}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, tags: e.target.value } : null)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                שמירה
              </button>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>טוען משימות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                TaskFlow
              </h1>
              <nav className="flex gap-1">
                <button
                  onClick={() => setCurrentView('kanban')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'kanban'
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  לוח Kanban
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'analytics'
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ניתוחים
                </button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                משימה חדשה
              </button>
              
              <button
                onClick={exportToCSV}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Download size={16} />
                ייצוא
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div className="flex items-center gap-2">
                <User size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {session?.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className={`p-1 rounded hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
                >
                  <LogOut size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-80 border-r min-h-screen ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search size={18} className={`absolute right-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="חיפוש משימות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pr-10 pl-4 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 border rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">כל הסטטוסים</option>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <option key={status} value={status}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`px-3 py-2 border rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">כל העדיפויות</option>
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <option key={priority} value={priority}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                סטטיסטיקות מהירות
              </h3>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-green-800'}`}>הושלמו</span>
                  <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {stats.completed}
                  </span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-yellow-800'}`}>בביצוע</span>
                  <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {stats.inProgress}
                  </span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>פתוחות</span>
                  <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {stats.open}
                  </span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-purple-800'}`}>אחוז השלמה</span>
                  <span className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {stats.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'kanban' && <KanbanView />}
          {currentView === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateTaskModal />}
      {editingTask && <EditTaskModal />}
    </div>
  )
}

export default Dashboard