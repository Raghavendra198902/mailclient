'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, LayoutDashboard, Settings, Sparkles, BarChart3, Users, HelpCircle, Menu, X, Search, Bell, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ai-features', label: 'AI Features', icon: Sparkles },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help', icon: HelpCircle }
  ];

  // Don't show navigation on landing page and auth pages
  if (pathname === '/' || pathname === '/connect' || pathname?.startsWith('/auth/')) return null;

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 via-purple-900/30 to-slate-900/95 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-purple-600/5 opacity-50"></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 relative">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl shadow-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Email AI Manager
              </span>
              <div className="flex items-center gap-1 -mt-0.5">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Online</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Bar */}
            <motion.div 
              initial={false}
              animate={{ width: searchOpen ? 280 : 40 }}
              className="relative"
            >
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors z-10"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                </motion.button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      type="text"
                      placeholder="Search emails..."
                      className="w-full h-10 pl-12 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className={`relative flex items-center gap-2 ${isActive ? 'z-10' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-purple-600/30' 
                          : 'bg-slate-700/30 group-hover:bg-purple-600/20'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                3
              </span>
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-700/50">
                      <p className="text-sm font-semibold text-white">John Doe</p>
                      <p className="text-xs text-slate-400">john@example.com</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <div className="my-1 h-px bg-slate-700/50"></div>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-slate-700/50"
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-purple-600/30' : 'bg-slate-700/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
