'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, Inbox, Send, Star, Archive, Trash2, Search, 
  LayoutDashboard, Sparkles, BarChart3, Users, Settings,
  FileText, Shield, ChevronRight, Boxes, Plus
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: '89', route: '/inbox' },
    { id: 'starred', label: 'Starred', icon: Star, route: '/inbox?folder=starred' },
    { id: 'sent', label: 'Sent', icon: Send, route: '/inbox?folder=sent' },
    { id: 'drafts', label: 'Drafts', icon: FileText, badge: '3', route: '/inbox?folder=drafts' },
    { id: 'archived', label: 'Archived', icon: Archive, route: '/inbox?folder=archive' },
    { id: 'spam', label: 'Spam', icon: Shield, badge: '12', route: '/inbox?folder=spam' },
    { id: 'trash', label: 'Trash', icon: Trash2, route: '/inbox?folder=trash' },
  ]

  const categoryItems = [
    { id: 'compose', label: 'Compose', icon: Mail, route: '/compose', color: 'text-blue-400' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', color: 'text-green-400' },
    { id: 'contacts', label: 'Contacts', icon: Users, route: '/contacts', color: 'text-purple-400' },
    { id: 'ai-features', label: 'AI Features', icon: Sparkles, route: '/ai-features', color: 'text-pink-400' },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings', color: 'text-orange-400' },
  ]

  const isActiveRoute = (route: string) => {
    if (route === '/dashboard') return pathname === '/dashboard'
    if (route === '/inbox') return pathname === '/inbox' || pathname?.startsWith('/inbox')
    return pathname === route
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
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
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.route)
                  
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
                    </Link>
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
                    const isActive = isActiveRoute(item.route)
                    
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border group ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
                              : 'border-transparent hover:bg-white/5 hover:border-purple-500/20'
                          }`}
                        >
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : item.color} group-hover:drop-shadow-lg`} />
                          </motion.div>
                          <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      </Link>
                    )
                  })}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Link href="/compose">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Compose
              </motion.button>
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
