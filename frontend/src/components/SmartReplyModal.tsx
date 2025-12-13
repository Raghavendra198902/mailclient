'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Loader, RefreshCw } from 'lucide-react';

interface ReplyOption {
  label: string;
  text: string;
}

interface SmartReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
  messageId: string;
  originalFrom: string;
  originalSubject: string;
}

export default function SmartReplyModal({
  isOpen,
  onClose,
  onSend,
  messageId,
  originalFrom,
  originalSubject
}: SmartReplyModalProps) {
  const [selectedReply, setSelectedReply] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ReplyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tone, setTone] = useState<'professional' | 'casual' | 'brief'>('professional');

  useEffect(() => {
    if (isOpen && messageId) {
      fetchSmartReplies();
    }
  }, [isOpen, messageId, tone]);

  const fetchSmartReplies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8003/api/v1/ml/smart-replies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: messageId,
          tone: tone,
          num_suggestions: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        if (data.suggestions && data.suggestions.length > 0) {
          setSelectedReply(data.suggestions[0].text);
        }
      }
    } catch (error) {
      console.error('Failed to fetch smart replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedReply.trim()) return;
    
    setSending(true);
    try {
      const subject = originalSubject.toLowerCase().startsWith('re:') 
        ? originalSubject 
        : `Re: ${originalSubject}`;
      
      await onSend(originalFrom, subject, selectedReply);
      onClose();
      setSelectedReply('');
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 rounded-xl border border-purple-500/20 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Smart Reply</h2>
                  <p className="text-sm text-slate-400">AI-generated response suggestions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Tone Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Reply Tone
                </label>
                <div className="flex gap-3">
                  {(['professional', 'casual', 'brief'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                        tone === t
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={fetchSmartReplies}
                    disabled={loading}
                    className="ml-auto p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Regenerate suggestions"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Select a Suggestion
                    </label>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedReply(suggestion.text)}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            selectedReply === suggestion.text
                              ? 'border-purple-500 bg-purple-900/20'
                              : 'border-slate-700 hover:border-slate-600 bg-slate-700/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-400">
                              {suggestion.label}
                            </span>
                            {selectedReply === suggestion.text && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {suggestion.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Reply */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Edit or Write Custom Reply
                    </label>
                    <textarea
                      value={selectedReply}
                      onChange={(e) => setSelectedReply(e.target.value)}
                      placeholder="Edit the selected suggestion or write your own reply..."
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* Reply Info */}
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">To:</span>
                    <span className="text-white">{originalFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subject:</span>
                    <span className="text-white truncate ml-4">
                      {originalSubject.toLowerCase().startsWith('re:') 
                        ? originalSubject 
                        : `Re: ${originalSubject}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700/50 bg-slate-900/30">
              <button
                onClick={onClose}
                className="px-6 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedReply.trim() || sending}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
