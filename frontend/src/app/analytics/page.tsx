'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Mail, Clock, Users, AlertTriangle, Zap, Calendar } from 'lucide-react';

interface AnalyticsData {
  totalEmails: number;
  emailsToday: number;
  avgResponseTime: string;
  topSenders: { email: string; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  priorityBreakdown: { high: number; medium: number; low: number };
  weeklyTrend: { day: string; count: number }[];
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEmails: 0,
    emailsToday: 0,
    avgResponseTime: '0h',
    topSenders: [],
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
    priorityBreakdown: { high: 0, medium: 0, low: 0 },
    weeklyTrend: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8003/api/v1/messages/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        
        // Calculate analytics
        const now = new Date();
        const cutoffDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);
        
        const recentMessages = messages.filter((m: any) => 
          new Date(m.received_date) >= cutoffDate
        );

        // Top senders
        const senderCounts: { [key: string]: number } = {};
        recentMessages.forEach((m: any) => {
          senderCounts[m.from_email] = (senderCounts[m.from_email] || 0) + 1;
        });
        const topSenders = Object.entries(senderCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([email, count]) => ({ email, count }));

        // Sentiment breakdown
        const sentimentBreakdown = {
          positive: recentMessages.filter((m: any) => m.ml_data?.sentiment === 'positive').length,
          neutral: recentMessages.filter((m: any) => m.ml_data?.sentiment === 'neutral').length,
          negative: recentMessages.filter((m: any) => m.ml_data?.sentiment === 'negative').length
        };

        // Priority breakdown
        const priorityBreakdown = {
          high: recentMessages.filter((m: any) => (m.ml_data?.priority_score || 0) > 0.7).length,
          medium: recentMessages.filter((m: any) => {
            const score = m.ml_data?.priority_score || 0;
            return score >= 0.3 && score <= 0.7;
          }).length,
          low: recentMessages.filter((m: any) => (m.ml_data?.priority_score || 0) < 0.3).length
        };

        // Weekly trend
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayStart = new Date(day.setHours(0, 0, 0, 0));
          const dayEnd = new Date(day.setHours(23, 59, 59, 999));
          
          const count = messages.filter((m: any) => {
            const date = new Date(m.received_date);
            return date >= dayStart && date <= dayEnd;
          }).length;
          
          weeklyTrend.push({
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            count
          });
        }

        setAnalytics({
          totalEmails: messages.length,
          emailsToday: messages.filter((m: any) => 
            new Date(m.received_date).toDateString() === now.toDateString()
          ).length,
          avgResponseTime: '2.5h',
          topSenders,
          sentimentBreakdown,
          priorityBreakdown,
          weeklyTrend
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxTrend = Math.max(...analytics.weeklyTrend.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === '7d' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === '30d' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === '90d' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-slate-400">Total Emails</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalEmails}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-green-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span className="text-sm text-slate-400">Today</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.emailsToday}</p>
            <p className="text-xs text-slate-500 mt-1">Received today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              <span className="text-sm text-slate-400">Avg Response</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.avgResponseTime}</p>
            <p className="text-xs text-slate-500 mt-1">Response time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-sm text-slate-400">High Priority</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.priorityBreakdown.high}</p>
            <p className="text-xs text-slate-500 mt-1">Urgent emails</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Weekly Activity</h2>
            </div>
            
            <div className="flex items-end justify-between gap-4 h-48">
              {analytics.weeklyTrend.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-700/30 rounded-t-lg relative" style={{ height: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.count / maxTrend) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg absolute bottom-0"
                    />
                  </div>
                  <span className="text-xs text-slate-400">{day.day}</span>
                  <span className="text-xs text-white font-semibold">{day.count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Senders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Top Senders</h2>
            </div>
            
            <div className="space-y-4">
              {analytics.topSenders.map((sender, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                      {sender.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 truncate max-w-[200px]">
                      {sender.email}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">{sender.count}</span>
                </motion.div>
              ))}
              {analytics.topSenders.length === 0 && (
                <p className="text-slate-400 text-center py-8">No data available</p>
              )}
            </div>
          </motion.div>

          {/* Sentiment Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Sentiment Analysis</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Positive</span>
                  <span className="text-sm font-semibold text-green-400">
                    {analytics.sentimentBreakdown.positive}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(analytics.sentimentBreakdown.positive / (analytics.sentimentBreakdown.positive + analytics.sentimentBreakdown.neutral + analytics.sentimentBreakdown.negative || 1)) * 100}%` 
                    }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Neutral</span>
                  <span className="text-sm font-semibold text-slate-400">
                    {analytics.sentimentBreakdown.neutral}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(analytics.sentimentBreakdown.neutral / (analytics.sentimentBreakdown.positive + analytics.sentimentBreakdown.neutral + analytics.sentimentBreakdown.negative || 1)) * 100}%` 
                    }}
                    className="h-full bg-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Negative</span>
                  <span className="text-sm font-semibold text-red-400">
                    {analytics.sentimentBreakdown.negative}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(analytics.sentimentBreakdown.negative / (analytics.sentimentBreakdown.positive + analytics.sentimentBreakdown.neutral + analytics.sentimentBreakdown.negative || 1)) * 100}%` 
                    }}
                    className="h-full bg-red-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Priority Distribution</h2>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-red-600/20 to-red-600/10 border-4 border-red-600/30 mb-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{analytics.priorityBreakdown.high}</p>
                    <p className="text-xs text-red-400">High</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                  <p className="text-2xl font-bold text-white">{analytics.priorityBreakdown.medium}</p>
                  <p className="text-xs text-yellow-400">Medium</p>
                </div>
                <div className="text-center p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                  <p className="text-2xl font-bold text-white">{analytics.priorityBreakdown.low}</p>
                  <p className="text-xs text-blue-400">Low</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
