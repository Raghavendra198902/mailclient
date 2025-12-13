'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, Sparkles, TrendingUp, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Universal Email AI Manager
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Supercharge your email (Gmail, Outlook, Yahoo, IMAP) with AI-powered automation, smart replies,
            and intelligent inbox management
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/connect">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Connect Email
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                View Dashboard
              </motion.button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}

const features = [
  {
    title: 'AI Summarization',
    description: 'Get instant summaries of long emails',
    icon: <Sparkles size={32} />,
  },
  {
    title: 'Smart Replies',
    description: 'AI-generated context-aware responses',
    icon: <Mail size={32} />,
  },
  {
    title: 'Priority Detection',
    description: 'Auto-classify urgent emails',
    icon: <TrendingUp size={32} />,
  },
  {
    title: 'Security Scanning',
    description: 'Phishing and anomaly detection',
    icon: <Shield size={32} />,
  },
]
