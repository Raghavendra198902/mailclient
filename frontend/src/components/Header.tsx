'use client'

import { motion } from 'framer-motion'
import { Mail, Menu, Search, Bell, Settings } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <motion.header 
      className="glass border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl"
      animate={{ marginLeft: sidebarOpen ? '256px' : '0' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Sidebar Toggle */}
          <motion.button
            onClick={onToggleSidebar}
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
              <input 
                type="text" 
                placeholder="Search emails, contacts, or use AI commands..." 
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all" 
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.button className="relative p-3 hover:bg-white/10 rounded-xl transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Bell className="w-6 h-6 text-gray-300" />
              <motion.span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.button>

            <Link href="/settings">
              <motion.button className="p-3 hover:bg-white/10 rounded-xl transition-colors" whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.95 }}>
                <Settings className="w-6 h-6 text-gray-300" />
              </motion.button>
            </Link>

            <motion.div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10 cursor-pointer" whileHover={{ scale: 1.05 }}>
              <motion.div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                D
                <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-50 blur-xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium text-white">Demo User</p>
                <p className="text-xs text-gray-400">demo@mailmanager.com</p>
              </div>
            </motion.div>

            <Link href="/dashboard">
              <motion.button className="ml-2 p-3 hover:bg-purple-500/20 rounded-xl transition-colors group" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Mail className="w-6 h-6 text-gray-300 group-hover:text-purple-400 transition-colors" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
