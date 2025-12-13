'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Mail, Key, Bell, Shield, Save } from 'lucide-react';

export default function Settings() {
  const [provider, setProvider] = useState('gmail');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4"
      >
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <SettingsIcon className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto mt-8 px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Account Settings */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Email Account</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="yahoo">Yahoo</option>
                  <option value="imap">IMAP/SMTP</option>
                </select>
              </div>

              {provider === 'imap' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      IMAP Server
                    </label>
                    <input
                      type="text"
                      placeholder="imap.example.com"
                      className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      SMTP Server
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.example.com"
                      className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="your@email.com"
                      className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">AI Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Smart Replies</p>
                  <p className="text-sm text-slate-400">AI-generated reply suggestions</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Summarization</p>
                  <p className="text-sm text-slate-400">Automatic email summaries</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-400">Get notified of new emails</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Priority Alerts</p>
                  <p className="text-sm text-slate-400">High priority message alerts</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Security</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Phishing Detection</p>
                  <p className="text-sm text-slate-400">AI-powered phishing detection</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">PII Protection</p>
                  <p className="text-sm text-slate-400">Detect sensitive information</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
