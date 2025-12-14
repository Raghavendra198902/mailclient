'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Mail, Clock, Star, Zap, Calendar } from 'lucide-react'

interface EmailStats {
  totalEmails: number
  unreadEmails: number
  sentEmails: number
  receivedToday: number
  avgResponseTime: string
  topSenders: { email: string; count: number }[]
  emailsByDay: { day: string; count: number }[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8003/api/v1/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayStats = stats

  const statCards = stats ? [
    {
      title: 'Total Emails',
      value: stats.totalEmails,
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Unread',
      value: stats.unreadEmails,
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      trend: '-8%',
      trendUp: false,
    },
    {
      title: 'Sent Today',
      value: stats.sentEmails,
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Avg Response',
      value: stats.avgResponseTime,
      icon: Clock,
      color: 'from-orange-500 to-red-500',
      trend: '-15%',
      trendUp: false,
    },
  ] : []

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Analytics</h1>
          <p className="text-gray-400">Track your email performance and insights</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : 
               range === '7d' ? 'Last 7 Days' :
               range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          </div>
        ) : !displayStats ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400">No analytics data available</p>
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                  {card.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {card.trend}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emails by Day */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Emails by Day</h2>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {displayStats.emailsByDay.map((day) => {
                const maxCount = Math.max(...displayStats.emailsByDay.map(d => d.count))
                const height = (day.count / maxCount) * 100
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        {day.count} emails
                      </div>
                    </motion.div>
                    <span className="text-xs text-gray-400">{day.day}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Top Senders */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Top Senders</h2>
            </div>
            <div className="space-y-4">
              {displayStats.topSenders.map((sender, index) => {
                const maxCount = displayStats.topSenders[0].count
                const percentage = (sender.count / maxCount) * 100
                return (
                  <div key={sender.email}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 truncate">{sender.email}</span>
                      <span className="text-sm text-gray-400">{sender.count}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
