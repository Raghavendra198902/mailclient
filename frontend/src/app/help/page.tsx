'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Book, MessageCircle, Mail, Zap, Shield, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: Book },
    { id: 'getting-started', name: 'Getting Started', icon: Zap },
    { id: 'ai-features', name: 'AI Features', icon: MessageCircle },
    { id: 'security', name: 'Security & Privacy', icon: Shield },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: HelpCircle }
  ];

  const faqs: FAQItem[] = [
    {
      category: 'getting-started',
      question: 'How do I connect my email account?',
      answer: 'Go to the Connect page, select your email provider (Gmail, Outlook, Yahoo, or IMAP/SMTP), and follow the authentication flow. For Gmail and Outlook, you\'ll use OAuth. For IMAP/SMTP, enter your server details and credentials.'
    },
    {
      category: 'getting-started',
      question: 'Which email providers are supported?',
      answer: 'We support Gmail, Outlook (Office 365), Yahoo Mail, and any email service that provides IMAP/SMTP access. OAuth authentication is available for Gmail and Outlook for enhanced security.'
    },
    {
      category: 'getting-started',
      question: 'How do I sync my emails?',
      answer: 'After connecting your account, emails sync automatically every 5 minutes. You can also manually sync by clicking the refresh button in the dashboard. The first sync may take a few minutes depending on your inbox size.'
    },
    {
      category: 'ai-features',
      question: 'What is Smart Reply?',
      answer: 'Smart Reply uses AI to generate contextual response suggestions for your emails. It analyzes the email content and offers 3 reply options in different tones (professional, casual, brief). You can edit suggestions before sending.'
    },
    {
      category: 'ai-features',
      question: 'How does email summarization work?',
      answer: 'Our AI reads your emails and generates concise summaries highlighting key points, action items, and important information. This helps you quickly understand email content without reading everything.'
    },
    {
      category: 'ai-features',
      question: 'What is priority detection?',
      answer: 'Priority detection analyzes emails and assigns a priority score (0-1). Emails with scores above 0.7 are marked as high priority. The AI considers factors like sender importance, urgency keywords, and content context.'
    },
    {
      category: 'ai-features',
      question: 'How accurate is phishing detection?',
      answer: 'Our phishing detection has 98% accuracy. It analyzes sender patterns, suspicious links, urgency tactics, and common phishing indicators. Detected threats are flagged with red warnings in your inbox.'
    },
    {
      category: 'ai-features',
      question: 'What is sentiment analysis?',
      answer: 'Sentiment analysis detects the emotional tone of emails (positive, neutral, negative). This helps you prioritize responses and understand the urgency or mood of communications.'
    },
    {
      category: 'security',
      question: 'Is my email data secure?',
      answer: 'Yes. All data is encrypted in transit (TLS) and at rest. Passwords are hashed using industry-standard algorithms. We never store your email provider password - OAuth tokens are used for Gmail/Outlook.'
    },
    {
      category: 'security',
      question: 'Do you read my emails?',
      answer: 'No. Email processing happens locally on your server using AI models. Only you have access to your email content. We don\'t share, sell, or analyze your personal emails for any purpose.'
    },
    {
      category: 'security',
      question: 'Can I delete my data?',
      answer: 'Yes. You can disconnect your account anytime from Settings, which removes all synced emails and data from our system. Original emails in your provider account remain unchanged.'
    },
    {
      category: 'security',
      question: 'What permissions does the app need?',
      answer: 'For OAuth (Gmail/Outlook): read email, send email, and modify labels/folders. For IMAP/SMTP: full mailbox access. We only request necessary permissions and you can revoke access anytime.'
    },
    {
      category: 'troubleshooting',
      question: 'Emails not syncing - what should I do?',
      answer: 'Check your internet connection, verify your email credentials are correct in Settings, ensure your email provider isn\'t blocking access, and try manually syncing. For OAuth, you may need to re-authenticate.'
    },
    {
      category: 'troubleshooting',
      question: 'AI features not working?',
      answer: 'AI features require OpenAI API key (optional). If not configured, fallback templates are used. Check Settings to add your API key. Some features work offline using built-in models.'
    },
    {
      category: 'troubleshooting',
      question: 'Search not returning results?',
      answer: 'Make sure emails are synced first. Advanced search uses specific filters - try clearing filters or using broader search terms. The search looks through subject, body, and sender fields.'
    },
    {
      category: 'troubleshooting',
      question: 'How do I report a bug?',
      answer: 'Use the "Send Feedback" button below or email support@emailaimanager.com. Include details about the issue, steps to reproduce, and any error messages. Screenshots are helpful.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4"
      >
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <HelpCircle className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">How can we help you?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Find answers to common questions and learn how to use Email AI Manager
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white text-lg placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8 justify-center"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                Frequently Asked Questions
                <span className="text-sm text-slate-400 ml-3">
                  ({filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'})
                </span>
              </h3>

              {filteredFAQs.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">No results found. Try a different search term.</p>
                </div>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                    >
                      <span className="text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6"
                      >
                        <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>

          {/* Quick Links Sidebar */}
          <div className="space-y-6">
            {/* Documentation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Book className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Documentation</h3>
              </div>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  <span className="text-slate-300">Getting Started Guide</span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  <span className="text-slate-300">API Documentation</span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  <span className="text-slate-300">Video Tutorials</span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                </a>
              </div>
            </motion.div>

            {/* Contact Support */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Contact Support</h3>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white font-medium">
                Send Feedback
              </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-white font-semibold">&lt; 2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Support Languages</span>
                  <span className="text-white font-semibold">5+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Satisfaction Rate</span>
                  <span className="text-green-400 font-semibold">98%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
