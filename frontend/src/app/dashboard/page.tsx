'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Mail, Settings, Bell, LogOut, Send, Archive, Inbox, 
  Zap, BarChart3, Users, Clock, Search,
  MessageSquare, Activity, Sparkles, Brain, Target, Award,
  ArrowUp, ChevronRight, Download, Share2, TrendingUp,
  Menu, X, Home, FolderOpen, Star, Tag, FileText, Trash2,
  Filter, Calendar, PieChart, HelpCircle, Shield, UserCircle,
  LayoutDashboard, BookOpen, Boxes, AlertCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [stats, setStats] = useState<any[]>([])
  const [recentEmails, setRecentEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
      // Compose email with C key
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        router.push('/compose')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchDashboardData()

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [router])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:8003/api/v1/messages/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats([
          { label: 'Total Emails', value: statsData.total?.toString() || '0', icon: Mail, color: 'from-blue-500 via-blue-600 to-cyan-500', change: '+12.5%', trend: 'up', subtitle: 'This week' },
          { label: 'Unread', value: statsData.unread?.toString() || '0', icon: Inbox, color: 'from-purple-500 via-purple-600 to-pink-500', change: '+5.2%', trend: 'up', subtitle: 'Needs attention' },
          { label: 'Sent Today', value: statsData.sent_today?.toString() || '0', icon: Send, color: 'from-green-500 via-green-600 to-emerald-500', change: '+8.1%', trend: 'up', subtitle: 'Outgoing' },
          { label: 'Response Rate', value: '94%', icon: Target, color: 'from-orange-500 via-orange-600 to-red-500', change: '+2.3%', trend: 'up', subtitle: 'Performance' },
        ])
      }

      // Fetch recent emails
      const emailsResponse = await fetch('http://localhost:8003/api/v1/messages?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json()
        const emails = Array.isArray(emailsData) ? emailsData : (emailsData.messages || emailsData.data || [])
        setRecentEmails(emails.map((email: any) => ({
          from: email.sender_name || email.sender_email,
          subject: email.subject,
          time: new Date(email.received_at).toLocaleString(),
          unread: !email.is_read,
          priority: 'medium',
          category: 'work',
          avatar: (email.sender_name || 'U').substring(0, 2).toUpperCase(),
        })))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-xl flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
          />
          Loading Dashboard...
        </motion.div>
      </div>
    )
  }

  const firstName = user.full_name?.split(' ')[0] || 'User'

  const statsDisplay = stats.length > 0 ? stats : [
    { label: 'Total Emails', value: '0', icon: Mail, color: 'from-blue-500 via-blue-600 to-cyan-500', change: '+0%', trend: 'up', subtitle: 'This week' },
    { label: 'Unread', value: '0', icon: Inbox, color: 'from-purple-500 via-purple-600 to-pink-500', change: '+0%', trend: 'up', subtitle: 'Needs attention' },
    { label: 'Sent Today', value: '0', icon: Send, color: 'from-green-500 via-green-600 to-emerald-500', change: '+0%', trend: 'up', subtitle: 'Outgoing' },
    { label: 'Response Rate', value: '0%', icon: Target, color: 'from-orange-500 via-orange-600 to-red-500', change: '+0%', trend: 'up', subtitle: 'Performance' },
  ]

  const recentEmailsDisplay = recentEmails.length > 0 ? recentEmails : []

  const quickActions = [
    { label: 'Compose', icon: Mail, color: 'from-blue-500 to-cyan-500', description: 'New email', gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' },
    { label: 'AI Reply', icon: Sparkles, color: 'from-purple-500 to-pink-500', description: 'Smart compose', gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' },
    { label: 'Analytics', icon: BarChart3, color: 'from-green-500 to-emerald-500', description: 'View insights', gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' },
    { label: 'Team Inbox', icon: Users, color: 'from-orange-500 to-red-500', description: 'Collaborate', gradient: 'bg-gradient-to-br from-orange-500/20 to-red-500/20' },
  ]

  const aiInsights = [
    { title: 'Peak Activity', value: '9-11 AM', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Avg Response', value: '2.3 hours', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'AI Suggestions', value: '12 pending', icon: Brain, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'Priority Score', value: '87/100', icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ]

  const activityData = [
    { day: 'Mon', emails: 45 },
    { day: 'Tue', emails: 52 },
    { day: 'Wed', emails: 38 },
    { day: 'Thu', emails: 65 },
    { day: 'Fri', emails: 48 },
    { day: 'Sat', emails: 20 },
    { day: 'Sun', emails: 15 },
  ]

  const maxEmails = Math.max(...activityData.map(d => d.emails))

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null, route: '/dashboard' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: '89', route: '/inbox' },
    { id: 'starred', label: 'Starred', icon: Star, badge: null, route: '/inbox?folder=starred' },
    { id: 'sent', label: 'Sent', icon: Send, badge: null, route: '/inbox?folder=sent' },
    { id: 'drafts', label: 'Drafts', icon: FileText, badge: '3', route: '/inbox?folder=drafts' },
    { id: 'archived', label: 'Archived', icon: Archive, badge: null, route: '/inbox?folder=archive' },
    { id: 'spam', label: 'Spam', icon: Shield, badge: '12', route: '/inbox?folder=spam' },
    { id: 'trash', label: 'Trash', icon: Trash2, badge: null, route: '/inbox?folder=trash' },
  ]

  const categoryItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', color: 'text-blue-400' },
    { id: 'contacts', label: 'Contacts', icon: Users, route: '/contacts', color: 'text-green-400' },
    { id: 'ai-features', label: 'AI Features', icon: Sparkles, route: '/ai-features', color: 'text-purple-400' },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings', color: 'text-orange-400' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
            left: mousePosition.x - 500,
            top: mousePosition.y - 500,
          }}
          animate={{ left: mousePosition.x - 500, top: mousePosition.y - 500 }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
      </div>

      {/* Backdrop Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              opacity: { duration: 0.2 }
            }}
            className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-50 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10">
              <motion.div className="flex items-center justify-between mb-4" whileHover={{ scale: 1.02 }}>
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg" 
                    animate={{ rotate: [0, 5, 0, -5, 0] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                  >
                    <Mail className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block">Mail Manager</span>
                    <span className="text-xs text-gray-500">AI-Powered</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Keyboard Shortcut Hint */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
              >
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-purple-300 font-mono">⌘B</span>
                  <span>Toggle sidebar</span>
                </p>
              </motion.div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2">
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
              </motion.div>
            </div>

            {/* Main Menu Items */}
            <div className="p-4 pt-2">
              <motion.p 
                className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Mail className="w-3 h-3" />
                Mail Folders
              </motion.p>
              <motion.div 
                className="space-y-1" 
                initial="hidden" 
                animate="visible" 
                variants={{ 
                  visible: { 
                    transition: { 
                      staggerChildren: 0.08,
                      delayChildren: 0.2
                    } 
                  }, 
                  hidden: {} 
                }}
              >
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = activeMenu === item.id
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id)
                        if (item.route && item.route !== '/dashboard') {
                          router.push(item.route)
                        }
                      }}
                      variants={{ 
                        visible: { 
                          opacity: 1, 
                          x: 0,
                          transition: { 
                            type: "spring",
                            stiffness: 300,
                            damping: 24
                          }
                        }, 
                        hidden: { 
                          opacity: 0, 
                          x: -20 
                        } 
                      }}
                      whileHover={{ scale: 1.03, x: 8 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                          : 'hover:bg-white/5 border border-transparent hover:border-purple-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className={`w-5 h-5 ${ isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-300' }`} />
                        </motion.div>
                        <span className={`text-sm font-medium ${ isActive ? 'text-white' : 'text-gray-300 group-hover:text-white' }`}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <motion.span
                          className="px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full text-xs font-medium"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>

              {/* Quick Access Section */}
              <div className="mt-8">
                <motion.p 
                  className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Boxes className="w-3 h-3" />
                  Quick Access
                </motion.p>
                <motion.div 
                  className="space-y-1" 
                  initial="hidden" 
                  animate="visible" 
                  variants={{ 
                    visible: { 
                      transition: { 
                        staggerChildren: 0.1, 
                        delayChildren: 0.6 
                      } 
                    }, 
                    hidden: {} 
                  }}
                >
                  {categoryItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.id} href={item.route}>
                        <motion.button
                          variants={{ 
                            visible: { 
                              opacity: 1, 
                              x: 0,
                              transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 24
                              }
                            }, 
                            hidden: { 
                              opacity: 0, 
                              x: -20 
                            } 
                          }}
                          whileHover={{ scale: 1.05, x: 8 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-purple-500/20 group"
                        >
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon className={`w-5 h-5 ${item.color} group-hover:drop-shadow-lg`} />
                          </motion.div>
                          <span className="text-sm font-medium text-gray-300 group-hover:text-white">{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      </Link>
                    )
                  })}
                </motion.div>
              </div>

              {/* Email Service Providers Section */}
              <div className="mt-8 pb-4">
                <motion.div 
                  className="flex items-center justify-between px-4 mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Providers</p>
                  <motion.button 
                    whileHover={{ scale: 1.2, rotate: 90 }} 
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                </motion.div>
                <motion.div 
                  className="space-y-2" 
                  initial="hidden" 
                  animate="visible" 
                  variants={{ 
                    visible: { 
                      transition: { 
                        staggerChildren: 0.08, 
                        delayChildren: 0.9 
                      } 
                    }, 
                    hidden: {} 
                  }}
                >
                  {/* Gmail */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-red-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">Gmail</p>
                          <p className="text-[10px] text-gray-500">Connected • Syncing</p>
                        </div>
                      </div>
                      <motion.div 
                        className="flex items-center gap-2"
                        initial={{ opacity: 1 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-medium">●</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Outlook */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-blue-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 7.387v9.226a.389.389 0 0 1-.389.387h-7.775v-1.937h6.194v-7.064l-6.194 4.516-6.193-4.516v7.064h6.193v1.937H.389A.389.389 0 0 1 0 16.613V7.387c0-.214.175-.387.389-.387h23.222c.214 0 .389.173.389.387zm-12 4.129l10.938-7.742H1.062L12 11.516z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Outlook</p>
                          <p className="text-[10px] text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, backgroundColor: "rgba(59, 130, 246, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium hover:bg-blue-500/30 transition-colors"
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Yahoo Mail */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-purple-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.5h-2.8l-1.85-5.95-3.6 5.95H6.5l5.05-8.25L9.9 6.5h2.75l1.7 5.5 3.35-5.5h2.75l-4.75 7.75 1.8 3.25z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">Yahoo Mail</p>
                          <p className="text-[10px] text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, backgroundColor: "rgba(168, 85, 247, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* ProtonMail */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-indigo-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.906 12.906l-3.5 3.5a.5.5 0 0 1-.707 0l-3.5-3.5a.5.5 0 0 1 0-.707l3.5-3.5a.5.5 0 0 1 .707 0l3.5 3.5a.5.5 0 0 1 0 .707z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">ProtonMail</p>
                          <p className="text-[10px] text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, backgroundColor: "rgba(99, 102, 241, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-medium hover:bg-indigo-500/30 transition-colors"
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* iCloud Mail */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-cyan-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 8.94a4.38 4.38 0 0 0-2.32-3.68 4.45 4.45 0 0 0-3.32-.53 4.54 4.54 0 0 0-6.58-1.25 4.5 4.5 0 0 0-1.48 5.15A4.39 4.39 0 0 0 2 12.78a4.5 4.5 0 0 0 3.23 4.33v.01A4.5 4.5 0 0 0 9.59 20h4.82a4.5 4.5 0 0 0 4.36-3.88 4.5 4.5 0 0 0-.06-7.18z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">iCloud Mail</p>
                          <p className="text-[10px] text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, backgroundColor: "rgba(6, 182, 212, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-medium hover:bg-cyan-500/30 transition-colors"
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Zoho Mail */}
                  <motion.div
                    variants={{ 
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }, 
                      hidden: { opacity: 0, y: 20 } 
                    }}
                    whileHover={{ scale: 1.03, x: 8 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-3 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-yellow-500/30 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-600 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.15
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 3.18l7 3.5v6.07c0 4.33-2.98 8.38-7 9.37-4.02-.99-7-5.04-7-9.37V8.68l7-3.5z"/>
                          </svg>
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">Zoho Mail</p>
                          <p className="text-[10px] text-gray-500">Not connected</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, backgroundColor: "rgba(234, 179, 8, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-[10px] font-medium hover:bg-yellow-500/30 transition-colors"
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
            </div>
            {/* End Scrollable Content Area */}

            {/* Sidebar Footer */}
            <motion.div 
              className="flex-shrink-0 p-4 border-t border-white/10 glass backdrop-blur-xl space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.3 }}
            >
              {/* Compose Button */}
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 25px -5px rgba(168, 85, 247, 0.3), 0 10px 10px -5px rgba(236, 72, 153, 0.3)"
                }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/compose')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut",
                    repeatDelay: 2
                  }}
                >
                  <Mail className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-sm font-semibold text-white">Compose</span>
              </motion.button>

              {/* User Profile */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.03, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold"
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1
                  }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                >
                  {user?.full_name?.charAt(0) || 'U'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                </div>
              </motion.div>

              {/* Help Button */}
              <Link href="/help">
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ scale: 1.03, x: 5 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-purple-500/20 group"
                >
                  <motion.div
                    whileHover={{ 
                      rotate: [0, -15, 15, -15, 0],
                      scale: 1.2
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Help & Support</span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        className="glass border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl" 
        style={{ opacity: headerOpacity }}
        animate={{ marginLeft: sidebarOpen ? '256px' : '0' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Sidebar Toggle */}
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors mr-4"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <Menu className="w-6 h-6 text-gray-300" />
              </motion.div>
            </motion.button>

            <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
              <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Mail className="w-8 h-8 text-purple-400" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Mail Manager Pro
              </span>
            </motion.div>

            <motion.div className="flex-1 max-w-2xl mx-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input type="text" placeholder="Search emails, contacts, or use AI commands..." className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all" />
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button className="relative p-3 hover:bg-white/10 rounded-xl transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Bell className="w-6 h-6 text-gray-300" />
                <motion.span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.button>

              <motion.button className="p-3 hover:bg-white/10 rounded-xl transition-colors" whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.95 }}>
                <Settings className="w-6 h-6 text-gray-300" />
              </motion.button>

              <motion.div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10 cursor-pointer" whileHover={{ scale: 1.05 }}>
                <motion.div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  {firstName[0]}
                  <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-50 blur-xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                </motion.div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-white">{user.full_name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </motion.div>

              <motion.button onClick={handleLogout} className="ml-2 p-3 hover:bg-red-500/20 rounded-xl transition-colors group" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <LogOut className="w-6 h-6 text-gray-300 group-hover:text-red-400 transition-colors" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div
        className="relative z-10 px-6 py-8"
        animate={{ marginLeft: sidebarOpen ? '256px' : '0', paddingRight: sidebarOpen ? '0' : '0' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ maxWidth: sidebarOpen ? 'calc(100vw - 256px)' : '100vw' }}
      >
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{firstName}</span>! 👋
              </h1>
              <p className="text-gray-400 text-lg">Here's what's happening with your emails today</p>
            </div>
            <div className="flex gap-3">
              <motion.button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Export</span>
              </motion.button>
              <motion.button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Share2 className="w-4 h-4" />
                <span className="hidden lg:inline">Share</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {statsDisplay.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} whileHover={{ scale: 1.05, y: -5 }} className="relative group">
              <div className="glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <motion.div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 3, repeat: Infinity }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`} whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{stat.change}</span>
                    </div>
                  </div>
                  <motion.h3 className="text-3xl font-bold text-white mb-1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 * index, type: "spring" }}>{stat.value}</motion.h3>
                  <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-gray-500 text-xs">{stat.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Email Activity</h2>
                  <p className="text-sm text-gray-400">Last 7 days overview</p>
                </div>
                <div className="flex gap-2">
                  {['day', 'week', 'month'].map((timeframe) => (
                    <motion.button key={timeframe} onClick={() => setSelectedTimeframe(timeframe)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeframe === timeframe ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between h-64 gap-4">
                {activityData.map((data, index) => (
                  <motion.div key={data.day} className="flex-1 flex flex-col items-center gap-2" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.5 + index * 0.1 }}>
                    <motion.div className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg relative group cursor-pointer" style={{ height: `${(data.emails / maxEmails) * 100}%` }} whileHover={{ scale: 1.1, y: -5 }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.emails} emails
                      </div>
                    </motion.div>
                    <span className="text-sm text-gray-400 font-medium">{data.day}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Emails */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Recent Emails</h2>
                  <p className="text-sm text-gray-400">Your latest inbox messages</p>
                </div>
                <motion.button className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium" whileHover={{ x: 5 }}>
                  View all <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {recentEmailsDisplay.map((email, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ scale: 1.02, x: 10 }} className="group relative">
                    <div className={`p-4 rounded-xl cursor-pointer transition-all ${email.unread ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                      <div className="flex items-start gap-4">
                        <motion.div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                          {email.avatar}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div>
                              <h4 className="text-white font-medium mb-1">{email.from}</h4>
                              <p className={`text-sm ${email.unread ? 'text-white' : 'text-gray-400'} line-clamp-1`}>{email.subject}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{email.time}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {email.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">High Priority</span>
                            )}
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">{email.category}</span>
                            {email.unread && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Unread</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button key={action.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} className="relative group">
                    <div className={`${action.gradient} border border-white/10 rounded-xl p-4 text-center transition-all`}>
                      <motion.div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`} whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                        <action.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <p className="text-white font-medium text-sm mb-1">{action.label}</p>
                      <p className="text-gray-400 text-xs">{action.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <motion.div key={insight.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ scale: 1.02, x: 5 }} className={`${insight.bg} border border-white/10 rounded-xl p-4 cursor-pointer transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                          <insight.icon className={`w-5 h-5 ${insight.color}`} />
                        </motion.div>
                        <div>
                          <p className="text-gray-400 text-sm">{insight.title}</p>
                          <p className="text-white font-bold">{insight.value}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Performance */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Performance</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Response Rate</span>
                    <span className="text-sm text-white font-bold">94%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 1, delay: 0.6 }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Inbox Zero Progress</span>
                    <span className="text-sm text-white font-bold">72%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1, delay: 0.7 }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">AI Efficiency Boost</span>
                    <span className="text-sm text-white font-bold">88%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" initial={{ width: 0 }} animate={{ width: '88%' }} transition={{ duration: 1, delay: 0.8 }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
