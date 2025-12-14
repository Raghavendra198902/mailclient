'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings as SettingsIcon, Mail, Key, Shield, Save, Plus, 
  Trash2, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailProvider {
  id?: number
  provider: string
  email: string
  password: string
  status: 'active' | 'inactive' | 'error'
  lastSync?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [providers, setProviders] = useState<EmailProvider[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [syncingProviders, setSyncingProviders] = useState<Set<number>>(new Set())
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)

  const [formData, setFormData] = useState({
    provider: 'gmail',
    email: '',
    password: '',
    appPassword: ''
  })

  const providerOptions = [
    { value: 'gmail', label: 'Gmail', icon: '🔴', color: 'from-red-500 to-orange-500' },
    { value: 'outlook', label: 'Outlook', icon: '🔵', color: 'from-blue-600 to-blue-400' },
    { value: 'yahoo', label: 'Yahoo Mail', icon: '🟣', color: 'from-purple-600 to-purple-400' },
    { value: 'protonmail', label: 'ProtonMail', icon: '🔐', color: 'from-indigo-600 to-indigo-400' },
    { value: 'icloud', label: 'iCloud Mail', icon: '☁️', color: 'from-cyan-500 to-blue-500' },
    { value: 'zoho', label: 'Zoho Mail', icon: '🟡', color: 'from-yellow-600 to-orange-500' },
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
    loadProviders()

    // Set up auto-sync interval (every 5 minutes)
    let syncInterval: NodeJS.Timeout | null = null
    if (autoSyncEnabled) {
      syncInterval = setInterval(() => {
        syncAllProviders(true) // Silent sync
      }, 5 * 60 * 1000)
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval)
    }
  }, [router, autoSyncEnabled])

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8003/api/v1/email-providers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8003/api/v1/email-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newProvider = await response.json()
        setMessage({ type: 'success', text: 'Email provider added successfully! Starting initial sync...' })
        setFormData({ provider: 'gmail', email: '', password: '', appPassword: '' })
        setShowAddForm(false)
        await loadProviders()
        
        // Automatically sync the newly added provider
        if (newProvider.id) {
          await handleSyncProvider(newProvider.id)
        }
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to add provider' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('Are you sure you want to remove this email provider?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8003/api/v1/email-providers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Provider removed successfully!' })
        loadProviders()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove provider' })
    }
  }

  const handleSyncProvider = async (id: number, silent = false) => {
    setSyncingProviders(prev => new Set(prev).add(id))
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8003/api/v1/email-providers/${id}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        if (!silent) {
          setMessage({ type: 'success', text: 'Sync completed successfully!' })
        }
        await loadProviders()
      } else {
        if (!silent) {
          setMessage({ type: 'error', text: 'Sync failed. Please check your credentials.' })
        }
      }
    } catch (error) {
      if (!silent) {
        setMessage({ type: 'error', text: 'Failed to sync provider' })
      }
    } finally {
      setSyncingProviders(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const syncAllProviders = async (silent = false) => {
    if (providers.length === 0) return
    
    if (!silent) {
      setMessage({ type: 'success', text: 'Syncing all providers...' })
    }

    for (const provider of providers) {
      if (provider.id) {
        await handleSyncProvider(provider.id, silent)
      }
    }
  }

  const togglePasswordVisibility = (index: number) => {
    setShowPassword(prev => ({ ...prev, [index]: !prev[index] }))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-pink-500/10 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 glass border-b border-white/10 sticky top-0 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-6 h-6 text-gray-300" />
              </motion.button>
              <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Email Provider Settings
                </h1>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        {/* Message Alert */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Provider Button */}
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Add Email Provider
          </motion.button>
        </motion.div>

        {/* Add Provider Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <form onSubmit={handleAddProvider} className="glass rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  Add New Email Provider
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Provider</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    >
                      {providerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                      <span className="text-xs text-gray-500 ml-2">(Account Password)</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>

                  {/* App Password (for Gmail, etc.) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      App Password
                      <span className="text-xs text-gray-500 ml-2">(For Gmail/Outlook)</span>
                    </label>
                    <input
                      type="password"
                      value={formData.appPassword}
                      onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Help Text */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> For Gmail and Outlook, you need to generate an App Password from your account security settings. 
                    Regular passwords won't work for IMAP/SMTP access.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Adding...' : 'Add Provider'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Connected Providers ({providers.length})
            </h3>
            {providers.length > 0 && (
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                    autoSyncEnabled 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${autoSyncEnabled ? 'animate-spin-slow' : ''}`} />
                  Auto-sync {autoSyncEnabled ? 'ON' : 'OFF'}
                </motion.button>
                <motion.button
                  onClick={() => syncAllProviders(false)}
                  disabled={syncingProviders.size > 0}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-purple-400 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-purple-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${syncingProviders.size > 0 ? 'animate-spin' : ''}`} />
                  Sync All
                </motion.button>
              </div>
            )}
          </div>

          {providers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-12 border border-purple-500/20 text-center"
            >
              <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No email providers connected yet</p>
              <p className="text-gray-500 text-sm mt-2">Add your first email provider to start syncing emails</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {providers.map((provider, index) => {
                const providerConfig = providerOptions.find(p => p.value === provider.provider)
                return (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Provider Icon */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${providerConfig?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-2xl shadow-lg`}>
                          {providerConfig?.icon}
                        </div>

                        {/* Provider Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-white">{providerConfig?.label || provider.provider}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              provider.status === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : provider.status === 'error'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {provider.status === 'active' ? '● Active' : provider.status === 'error' ? '● Error' : '● Inactive'}
                            </span>
                            {syncingProviders.has(provider.id!) && (
                              <motion.span 
                                className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-2"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Syncing...
                              </motion.span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-400">{provider.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-400">
                                {showPassword[index] ? provider.password : '••••••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(index)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                              >
                                {showPassword[index] ? (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {provider.lastSync && (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                                <span className="text-xs text-gray-500">Last sync: {provider.lastSync}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => provider.id && handleSyncProvider(provider.id)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="Sync now"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => provider.id && handleDeleteProvider(provider.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="Remove provider"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
