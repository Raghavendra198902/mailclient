'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Star, Send, Archive, Trash2, Inbox, RefreshCw, LogOut, 
  Sparkles, AlertCircle, Clock, TrendingUp, Edit, Zap, Filter, SortDesc,
  Search, Command, MoreVertical, CheckSquare, Square, List, Grid, Keyboard,
  Move, Tag, Eye, EyeOff, Download, Share2, Flag
} from 'lucide-react';

interface Message {
  id: string;
  subject: string;
  from_email: string;
  snippet: string;
  received_date: string;
  is_read: boolean;
  labels?: string[];
  ml_data?: {
    summary?: string;
    priority_score?: number;
    sentiment?: string;
    intent?: string;
  };
}

export default function Dashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [hasToken, setHasToken] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchMessages();
  }, []); // Only fetch on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      // Compose: C
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        // Open compose modal
      }
      // Refresh: R
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        handleSync();
      }
      // Select all: Cmd/Ctrl + A
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const allIds = new Set(messages.map(m => m.id));
        setSelectedMessages(allIds);
      }
      // Escape: Clear selection or close panels
      if (e.key === 'Escape') {
        setSelectedMessages(new Set());
        setCommandPaletteOpen(false);
        setQuickActionsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [messages]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMessages();
      setLastRefresh(new Date());
    }, 120000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setHasToken(false);
        setLoading(false);
        return;
      }

      setHasToken(true);
      const response = await fetch(`${API_URL}/api/v1/messages/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Debug: Log first message labels to console
        if (data.messages && data.messages.length > 0) {
          console.log('Sample message labels:', data.messages[0].labels);
          console.log('Total messages loaded:', data.messages.length);
          
          // Show label distribution
          const labelCounts: Record<string, number> = {};
          data.messages.forEach((msg: Message) => {
            msg.labels?.forEach(label => {
              labelCounts[label] = (labelCounts[label] || 0) + 1;
            });
          });
          console.log('Label distribution:', labelCounts);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/connect';
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      const token = localStorage.getItem('access_token');
      console.log('Starting sync with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${API_URL}/api/v1/messages/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Sync response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Sync failed' }));
        throw new Error(errorData.detail || 'Failed to sync messages');
      }

      const result = await response.json();
      console.log('Sync result:', result);
      
      await fetchMessages();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to sync messages');
      setTimeout(() => setSyncError(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const folders = [
    { 
      id: 'inbox', 
      name: 'Inbox', 
      icon: Inbox, 
      count: messages.length
    },
    { 
      id: 'starred', 
      name: 'Starred', 
      icon: Star, 
      count: messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('STAR') || label.toUpperCase().includes('IMPORTANT'))).length 
    },
    { 
      id: 'sent', 
      name: 'Sent', 
      icon: Send, 
      count: messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('SENT'))).length 
    },
    { 
      id: 'archive', 
      name: 'Archive', 
      icon: Archive, 
      count: messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('ARCHIV'))).length 
    },
    { 
      id: 'trash', 
      name: 'Trash', 
      icon: Trash2, 
      count: messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('TRASH'))).length 
    }
  ];

  const unreadCount = messages.filter(m => !m.is_read).length;
  const highPriorityCount = messages.filter(m => {
    const priority = m.ml_data?.priority_score || 0;
    return priority > 0.7;
  }).length;

  // Filter messages based on selected folder
  const getFilteredMessages = () => {
    let filtered = messages;
    
    // Folder filter
    switch (selectedFolder) {
      case 'inbox':
        filtered = messages;
        break;
      case 'starred':
        filtered = messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('STARRED')));
        break;
      case 'sent':
        filtered = messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('SENT')));
        break;
      case 'archive':
        filtered = messages.filter(m => !m.labels?.some(label => label.toUpperCase().includes('INBOX')) && !m.labels?.some(label => label.toUpperCase().includes('TRASH')));
        break;
      case 'trash':
        filtered = messages.filter(m => m.labels?.some(label => label.toUpperCase().includes('TRASH')));
        break;
      default:
        filtered = messages;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(query) ||
        m.from_email.toLowerCase().includes(query) ||
        m.snippet.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const handleBulkAction = async (action: 'star' | 'unstar' | 'archive' | 'delete' | 'markRead' | 'markUnread') => {
    if (selectedMessages.size === 0) return;
    
    const token = localStorage.getItem('access_token');
    const promises = Array.from(selectedMessages).map(async (messageId) => {
      try {
        if (action === 'delete') {
          await fetch(`${API_URL}/api/v1/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } else {
          const message = messages.find(m => m.id === messageId);
          if (!message) return;
          
          let newLabels = [...(message.labels || [])];
          let isRead = message.is_read;
          
          switch (action) {
            case 'star':
              if (!newLabels.includes('STARRED')) newLabels.push('STARRED');
              break;
            case 'unstar':
              newLabels = newLabels.filter(l => l !== 'STARRED');
              break;
            case 'archive':
              newLabels = newLabels.filter(l => l !== 'INBOX');
              break;
            case 'markRead':
              isRead = true;
              break;
            case 'markUnread':
              isRead = false;
              break;
          }
          
          await fetch(`${API_URL}/api/v1/messages/${messageId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_read: true })
          });
        }
      } catch (error) {
        console.error(`Failed to ${action} message ${messageId}:`, error);
      }
    });
    
    await Promise.all(promises);
    setSelectedMessages(new Set());
    await fetchMessages();
  };

  const filteredMessages = getFilteredMessages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/80 via-purple-900/40 to-slate-900/80 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl"
      >
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Email AI Manager
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Dashboard
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all backdrop-blur-sm flex items-center gap-2 shadow-lg hover:shadow-purple-500/20"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Sync</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 text-white hover:bg-slate-800/50 rounded-xl transition-all backdrop-blur-sm flex items-center gap-2 border border-slate-700/50 hover:border-slate-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-slate-800/40 via-purple-900/20 to-slate-800/40 backdrop-blur-xl border-b border-slate-700/30"
      >
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400">
                  <span className="text-white font-semibold">{messages.length}</span> Total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-400">
                  <span className="text-blue-400 font-semibold">{unreadCount}</span> Unread
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-400">
                  <span className="text-yellow-400 font-semibold">{highPriorityCount}</span> Priority
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Sync Status Notifications */}
        <AnimatePresence>
          {syncSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Messages synced successfully!</span>
            </motion.div>
          )}
          {syncError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-8 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{syncError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Floating Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl shadow-purple-500/50 flex items-center justify-center z-50 hover:shadow-purple-500/70 transition-shadow"
        >
          <Edit className="w-6 h-6 text-white" />
        </motion.button>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-3 space-y-4"
          >
            {/* Folders Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Folders</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div className="space-y-2">
                {folders.map((folder, index) => (
                  <motion.button
                    key={folder.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`group w-full flex items-center justify-between px-4 py-3 text-slate-300 rounded-xl transition-all border ${
                      selectedFolder === folder.id
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 shadow-lg shadow-purple-500/20'
                        : 'hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        selectedFolder === folder.id
                          ? 'bg-purple-600/50'
                          : 'bg-slate-700/50 group-hover:bg-purple-600/30'
                      }`}>
                        <folder.icon className={`w-4 h-4 transition-colors ${
                          selectedFolder === folder.id ? 'text-white' : 'group-hover:text-purple-400'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        selectedFolder === folder.id ? 'text-white' : ''
                      }`}>{folder.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
                      selectedFolder === folder.id
                        ? 'text-white bg-purple-600/50'
                        : 'text-slate-500 bg-slate-700/50 group-hover:bg-purple-600/30'
                    }`}>{folder.count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            </div>

            {/* AI Stats Card */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              {/* Gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Processed</span>
                  <span className="text-lg font-bold text-white">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">High Priority</span>
                  <span className="text-lg font-bold text-yellow-400">{highPriorityCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: messages.length > 0 ? `${(highPriorityCount / messages.length) * 100}%` : '0%' }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-purple-400">
                <Zap className="w-3 h-3" />
                <span>AI Processing Active</span>
              </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Messages List */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="col-span-5"
          >
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/80 to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Messages</h2>
                      <p className="text-xs text-slate-500">All conversations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-slate-700/30 hover:bg-purple-600/20 rounded-lg transition-colors"
                    >
                      <Filter className="w-4 h-4 text-slate-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-slate-700/30 hover:bg-purple-600/20 rounded-lg transition-colors"
                    >
                      <SortDesc className="w-4 h-4 text-slate-400" />
                    </motion.button>
                    <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
                      <Clock className="w-3 h-3" />
                      <span>Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-700/50 max-h-[calc(100vh-250px)] overflow-y-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  !hasToken ? (
                    <div className="p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50">
                          <Mail className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Connect Your Email</h3>
                        <p className="text-slate-400 mb-6">Get started by connecting your email account to access your messages with AI-powered features.</p>
                        <motion.a
                          href="/connect"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-shadow"
                        >
                          <Mail className="w-5 h-5" />
                          Connect Email Account
                        </motion.a>
                        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>AI-Powered</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span>Fast Sync</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400" />
                      <p className="text-slate-400 mb-4">No messages in {folders.find(f => f.id === selectedFolder)?.name}</p>
                      <div className="mb-4 p-4 bg-slate-800/50 rounded-lg text-left max-w-lg mx-auto">
                        <p className="text-xs text-slate-500 mb-2">Debug Info:</p>
                        <p className="text-xs text-slate-400">Total messages: {messages.length}</p>
                        <p className="text-xs text-slate-400">Current folder: {selectedFolder}</p>
                        {messages.length > 0 && (
                          <>
                            <p className="text-xs text-slate-400 mt-2">Sample message labels:</p>
                            <pre className="text-xs text-green-400 mt-1 overflow-auto max-h-32">
                              {JSON.stringify(messages[0]?.labels, null, 2)}
                            </pre>
                            <p className="text-xs text-slate-400 mt-2">All unique labels in your messages:</p>
                            <pre className="text-xs text-green-400 mt-1 overflow-auto max-h-32">
                              {JSON.stringify([...new Set(messages.flatMap(m => m.labels || []))], null, 2)}
                            </pre>
                          </>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors inline-flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Messages'}
                      </motion.button>
                    </div>
                  )
                ) : (
                  filteredMessages.map((message, index) => {
                    const isSelected = selectedMessage?.id === message.id;
                    const isUnread = !message.is_read;
                    
                    return (
                      <motion.button
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        onClick={() => setSelectedMessage(message)}
                        className={`group w-full p-4 text-left hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-purple-900/30 transition-all border-l-2 ${
                          isSelected ? 'bg-purple-900/30 border-l-purple-500' : isUnread ? 'bg-slate-700/20 border-l-blue-500/50' : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                              {message.from_email}
                            </p>
                            <p className={`text-sm truncate ${isUnread ? 'text-purple-300' : 'text-slate-400'}`}>
                              {message.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {message.ml_data?.priority_score && message.ml_data.priority_score > 0.7 && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {message.snippet}
                        </p>
                        {message.ml_data?.summary && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="truncate text-purple-300">{message.ml_data.summary}</span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* Message Detail */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="col-span-4"
          >
            {selectedMessage ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/80 to-purple-900/20">
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedMessage.subject}</h3>
                  <p className="text-sm text-slate-400">{selectedMessage.from_email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedMessage.received_date).toLocaleString()}
                  </p>
                </div>

                {selectedMessage.ml_data && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-b border-purple-500/20"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedMessage.ml_data.summary && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
                          <div className="text-xs font-semibold text-purple-400 mb-1">SUMMARY</div>
                          <p className="text-sm text-slate-300">{selectedMessage.ml_data.summary}</p>
                        </div>
                      )}
                      {selectedMessage.ml_data.sentiment && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
                          <div className="text-xs font-semibold text-purple-400 mb-1">SENTIMENT</div>
                          <p className="text-sm text-slate-300 capitalize">{selectedMessage.ml_data.sentiment}</p>
                        </div>
                      )}
                      {selectedMessage.ml_data.intent && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
                          <div className="text-xs font-semibold text-purple-400 mb-1">INTENT</div>
                          <p className="text-sm text-slate-300 capitalize">{selectedMessage.ml_data.intent}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="p-6 max-h-[calc(100vh-450px)] overflow-y-auto">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 whitespace-pre-wrap">
                      {selectedMessage.snippet}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-slate-700/30 rounded-2xl p-12 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-12 h-12 text-slate-600" />
                </div>
                <p className="text-slate-400 text-lg font-medium">Select a message to view details</p>
                <p className="text-slate-500 text-sm mt-2">Choose from your messages on the left</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
