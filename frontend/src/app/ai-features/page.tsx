'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Zap, TrendingUp, MessageSquare, FileText, Tag, Clock, Send } from 'lucide-react'

interface AIFeature {
  id: string
  name: string
  description: string
  icon: any
  color: string
  enabled: boolean
  usage: number
  maxUsage: number
}

export default function AIFeaturesPage() {
  const [features, setFeatures] = useState<AIFeature[]>([])
  const [loading, setLoading] = useState(true)

  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchAIFeatures()
  }, [])

  const fetchAIFeatures = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8003/api/v1/ml/features', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      }
    } catch (error) {
      console.error('Failed to fetch AI features:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (featureId: string) => {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ))
  }

  const testAIFeature = async () => {
    if (!testEmail.trim()) return
    
    setTesting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8003/api/v1/ml/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testEmail }),
      })
      if (response.ok) {
        const data = await response.json()
        setTestResult(data)
      }
    } catch (error) {
      console.error('Failed to analyze email:', error)
    } finally {
      setTesting(false)
    }
  }

  const enabledCount = features.filter(f => f.enabled).length
  const totalUsage = features.reduce((acc, f) => acc + f.usage, 0)

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">AI Features</h1>
          </div>
          <p className="text-gray-400">Manage and test your AI-powered email capabilities</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="text-gray-400">Active Features</h3>
            </div>
            <p className="text-3xl font-bold text-white">{enabledCount}/{features.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-gray-400">Total Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white">{totalUsage.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <h3 className="text-gray-400">AI Model</h3>
            </div>
            <p className="text-xl font-semibold text-white">GPT-4 Enhanced</p>
          </motion.div>
        </div>

        {/* AI Features Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Available Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const usagePercentage = (feature.usage / feature.maxUsage) * 100
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color}`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{feature.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        feature.enabled ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: feature.enabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Usage</span>
                      <span className="text-white font-semibold">
                        {feature.usage}/{feature.maxUsage}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${feature.color} rounded-full`}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* AI Testing Playground */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">AI Testing Playground</h2>
          </div>
          <p className="text-gray-400 mb-6">Test AI features with sample email content</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sample Email Content</label>
              <textarea
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Paste or type email content to analyze..."
                className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={testAIFeature}
              disabled={testing || !testEmail.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze Email
                </>
              )}
            </button>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-white/5 rounded-lg border border-purple-500/30"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Intent</p>
                    <p className="text-purple-400 font-semibold">{testResult.intent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tone</p>
                    <p className="text-purple-400 font-semibold">{testResult.tone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <p className="text-purple-400 font-semibold">{testResult.priority}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">AI Summary</p>
                  <p className="text-gray-300 text-sm">{testResult.summary}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Suggested Replies</p>
                  <div className="space-y-2">
                    {testResult.suggestedReplies.map((reply: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {reply}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
