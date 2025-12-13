'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Bold, Italic, Link as LinkIcon } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
}

export default function ComposeModal({ isOpen, onClose, onSend }: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await onSend(to, subject, body);
      setTo('');
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-purple-500/20 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">New Message</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
              <button className="p-2 hover:bg-slate-600 rounded transition-colors">
                <Bold className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-600 rounded transition-colors">
                <Italic className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-600 rounded transition-colors">
                <LinkIcon className="w-4 h-4 text-slate-400" />
              </button>
              <div className="flex-1" />
              <button className="p-2 hover:bg-slate-600 rounded transition-colors">
                <Paperclip className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose your message..."
                rows={12}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="text-sm text-slate-400">
              {body.length} characters
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !to || !subject || !body}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
