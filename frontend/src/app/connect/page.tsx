'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Server, ArrowRight, CheckCircle } from 'lucide-react';

export default function ConnectPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [imapConfig, setImapConfig] = useState({
    username: '',
    password: '',
    imapServer: '',
    smtpServer: ''
  });

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '📧',
      type: 'imap',
      description: 'Connect with App Password',
      defaultServers: {
        imap: 'imap.gmail.com',
        smtp: 'smtp.gmail.com'
      }
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: '📨',
      type: 'imap',
      description: 'Connect with App Password',
      defaultServers: {
        imap: 'outlook.office365.com',
        smtp: 'smtp.office365.com'
      }
    },
    {
      id: 'yahoo',
      name: 'Yahoo',
      icon: '✉️',
      type: 'imap',
      description: 'IMAP/SMTP connection',
      defaultServers: {
        imap: 'imap.mail.yahoo.com',
        smtp: 'smtp.mail.yahoo.com'
      }
    },
    {
      id: 'custom',
      name: 'Custom IMAP',
      icon: '⚙️',
      type: 'imap',
      description: 'Any IMAP/SMTP server'
    }
  ];

  const handleOAuthConnect = (authUrl: string) => {
    window.location.href = authUrl;
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider?.defaultServers) {
      setImapConfig({
        ...imapConfig,
        imapServer: provider.defaultServers.imap,
        smtpServer: provider.defaultServers.smtp
      });
    }
  };

  const handleImapConnect = async () => {
    try {
      const response = await fetch('http://localhost:8003/api/v1/auth/connect/imap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: selectedProvider,
          username: imapConfig.username,
          password: imapConfig.password,
          imap_server: imapConfig.imapServer,
          smtp_server: imapConfig.smtpServer
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        
        // Store email config for sync
        localStorage.setItem('email_config', JSON.stringify({
          provider: selectedProvider,
          email: imapConfig.username,
          password: imapConfig.password,
          imap_server: imapConfig.imapServer,
          smtp_server: imapConfig.smtpServer
        }));
        
        window.location.href = '/dashboard';
      } else {
        const error = await response.json();
        alert(`Connection failed: ${error.detail || 'Please check your credentials'}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Connection failed. Please check your credentials and network connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Connect Your Email
            </h1>
            <p className="text-slate-300">
              Choose your email provider to get started with AI-powered email management
            </p>
          </div>

          {/* Provider Selection */}
          {!selectedProvider && (
            <div className="grid md:grid-cols-2 gap-6">
              {providers.map((provider, index) => (
                <motion.button
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleProviderSelect(provider.id)}
                  className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-8 hover:border-purple-500/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{provider.icon}</div>
                    <ArrowRight className="w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {provider.name}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {provider.description}
                  </p>
                </motion.button>
              ))}
            </div>
          )}

          {/* OAuth Providers */}
          {selectedProvider && providers.find(p => p.id === selectedProvider)?.type === 'oauth' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-8"
            >
              <div className="text-center">
                <div className="text-6xl mb-6">
                  {providers.find(p => p.id === selectedProvider)?.icon}
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Connect {providers.find(p => p.id === selectedProvider)?.name}
                </h2>
                <p className="text-slate-300 mb-8">
                  You'll be redirected to sign in with your {providers.find(p => p.id === selectedProvider)?.name} account
                </p>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setSelectedProvider('')}
                    className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleOAuthConnect(providers.find(p => p.id === selectedProvider)?.authUrl || '')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                  >
                    Continue with {providers.find(p => p.id === selectedProvider)?.name}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* IMAP Configuration */}
          {selectedProvider && providers.find(p => p.id === selectedProvider)?.type === 'imap' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Server className="w-8 h-8 text-purple-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {providers.find(p => p.id === selectedProvider)?.name} Configuration
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Enter your email credentials
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={imapConfig.username}
                    onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password / App Password
                  </label>
                  <input
                    type="password"
                    value={imapConfig.password}
                    onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    IMAP Server
                  </label>
                  <input
                    type="text"
                    value={imapConfig.imapServer}
                    onChange={(e) => setImapConfig({ ...imapConfig, imapServer: e.target.value })}
                    placeholder={selectedProvider === 'yahoo' ? 'imap.mail.yahoo.com' : 'imap.example.com'}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    SMTP Server
                  </label>
                  <input
                    type="text"
                    value={imapConfig.smtpServer}
                    onChange={(e) => setImapConfig({ ...imapConfig, smtpServer: e.target.value })}
                    placeholder={selectedProvider === 'yahoo' ? 'smtp.mail.yahoo.com' : 'smtp.example.com'}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <strong>How to get an App Password:</strong>
                      <ul className="mt-2 space-y-1 ml-4 list-disc">
                        <li><strong>Gmail:</strong> Enable 2FA → Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">myaccount.google.com/apppasswords</a> → Generate new app password</li>
                        <li><strong>Outlook:</strong> Visit Security settings → App passwords → Generate new</li>
                        <li><strong>Yahoo:</strong> Account Security → Generate app password → Select "Other app"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end mt-8">
                  <button
                    onClick={() => setSelectedProvider('')}
                    className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImapConnect}
                    disabled={!imapConfig.username || !imapConfig.password}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Connect Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
