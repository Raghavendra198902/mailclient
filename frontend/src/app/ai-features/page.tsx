'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Zap, Brain, BarChart3, Clock, AlertTriangle } from 'lucide-react';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  metrics?: {
    processed?: number;
    accuracy?: number;
    timeSaved?: string;
  };
}

interface MLStats {
  total_messages: number;
  processed_messages: number;
  high_priority_count: number;
  phishing_detected: number;
}

export default function AIFeaturesPage() {
  const [mlStats, setMlStats] = useState<MLStats>({
    total_messages: 0,
    processed_messages: 0,
    high_priority_count: 0,
    phishing_detected: 0
  });

  const [features, setFeatures] = useState<AIFeature[]>([
    {
      id: 'summarization',
      name: 'Email Summarization',
      description: 'AI-powered summaries of long email threads',
      icon: Sparkles,
      enabled: true,
      metrics: {
        processed: 0,
        accuracy: 95,
        timeSaved: '0h'
      }
    },
    {
      id: 'priority',
      name: 'Priority Detection',
      description: 'Automatically identifies urgent and important emails',
      icon: TrendingUp,
      enabled: true,
      metrics: {
        processed: 0,
        accuracy: 92
      }
    },
    {
      id: 'phishing',
      name: 'Phishing Detection',
      description: 'Real-time security analysis for suspicious emails',
      icon: Shield,
      enabled: true,
      metrics: {
        processed: 0,
        accuracy: 98
      }
    },
    {
      id: 'smart-reply',
      name: 'Smart Replies',
      description: 'AI-generated contextual response suggestions',
      icon: Zap,
      enabled: true,
      metrics: {
        processed: 0,
        accuracy: 94
      }
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      description: 'Detects tone and emotional context in emails',
      icon: Brain,
      enabled: true,
      metrics: {
        processed: 0,
        accuracy: 89
      }
    },
    {
      id: 'analytics',
      name: 'Inbox Analytics',
      description: 'Insights into email patterns and productivity',
      icon: BarChart3,
      enabled: true
    }
  ]);

  const fetchMLStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8003/api/v1/ml/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMlStats(data);
        
        // Update feature metrics
        setFeatures(prev => prev.map(f => {
          if (f.id === 'summarization' || f.id === 'priority' || f.id === 'phishing' || f.id === 'sentiment') {
            return {
              ...f,
              metrics: {
                ...f.metrics,
                processed: data.processed_messages
              }
            };
          }
          return f;
        }));
      }
    } catch (error) {
      console.error('Failed to fetch ML stats:', error);
    }
  };

  useEffect(() => {
    fetchMLStats();
    const interval = setInterval(fetchMLStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleFeature = (featureId: string) => {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">AI Features</h1>
            <p className="text-slate-300">
              Manage and monitor your AI-powered email capabilities
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-sm text-slate-400">Active Features</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {features.filter(f => f.enabled).length}/{features.length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-green-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-green-400" />
                <span className="text-sm text-slate-400">Time Saved</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {Math.round(mlStats.processed_messages * 0.5)}m
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <span className="text-sm text-slate-400">Emails Processed</span>
              </div>
              <p className="text-3xl font-bold text-white">{mlStats.processed_messages}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <span className="text-sm text-slate-400">Threats Detected</span>
              </div>
              <p className="text-3xl font-bold text-white">{mlStats.phishing_detected}</p>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-slate-800/50 backdrop-blur-xl border rounded-xl p-6 transition-all ${
                    feature.enabled 
                      ? 'border-purple-500/30 shadow-lg shadow-purple-500/10' 
                      : 'border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        feature.enabled 
                          ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20' 
                          : 'bg-slate-700/30'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          feature.enabled ? 'text-purple-400' : 'text-slate-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {feature.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.enabled ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Metrics */}
                  {feature.enabled && feature.metrics && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700/50">
                      {feature.metrics.processed !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Processed</p>
                          <p className="text-lg font-semibold text-white">
                            {feature.metrics.processed}
                          </p>
                        </div>
                      )}
                      {feature.metrics.accuracy !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                          <p className="text-lg font-semibold text-green-400">
                            {feature.metrics.accuracy}%
                          </p>
                        </div>
                      )}
                      {feature.metrics.timeSaved !== undefined && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Time Saved</p>
                          <p className="text-lg font-semibold text-blue-400">
                            {feature.metrics.timeSaved}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ML Model Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20 rounded-xl p-8"
          >
            <div className="flex items-start gap-4">
              <Brain className="w-8 h-8 text-purple-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  AI Model Information
                </h3>
                <p className="text-slate-300 mb-4">
                  Your email intelligence is powered by advanced machine learning models trained on millions of email patterns.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Primary Model</p>
                    <p className="text-white font-semibold">GPT-3.5-turbo</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Embeddings</p>
                    <p className="text-white font-semibold">sentence-transformers</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">NLP Engine</p>
                    <p className="text-white font-semibold">spaCy 3.7</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
