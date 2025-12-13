'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Star, Trash2, Search, Edit, X } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  emailCount: number;
  lastContact: string;
  starred: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '' });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8003/api/v1/messages/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        
        // Extract unique contacts from messages
        const contactMap: { [key: string]: Contact } = {};
        messages.forEach((msg: any) => {
          if (!contactMap[msg.from_email]) {
            contactMap[msg.from_email] = {
              id: msg.from_email,
              name: msg.from_email.split('@')[0],
              email: msg.from_email,
              emailCount: 0,
              lastContact: msg.received_date,
              starred: false
            };
          }
          contactMap[msg.from_email].emailCount++;
          if (new Date(msg.received_date) > new Date(contactMap[msg.from_email].lastContact)) {
            contactMap[msg.from_email].lastContact = msg.received_date;
          }
        });

        setContacts(Object.values(contactMap).sort((a, b) => b.emailCount - a.emailCount));
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.email) {
      const contact: Contact = {
        id: Date.now().toString(),
        name: newContact.name,
        email: newContact.email,
        company: newContact.company,
        emailCount: 0,
        lastContact: new Date().toISOString(),
        starred: false
      };
      setContacts([contact, ...contacts]);
      setNewContact({ name: '', email: '', company: '' });
      setShowAddContact(false);
    }
  };

  const toggleStar = (contactId: string) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, starred: !c.starred } : c
    ));
  };

  const deleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

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
            <Users className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
          </div>
          
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Contact</span>
          </button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-purple-400" />
              <span className="text-sm text-slate-400">Total Contacts</span>
            </div>
            <p className="text-3xl font-bold text-white">{contacts.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <span className="text-sm text-slate-400">Starred</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {contacts.filter(c => c.starred).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-slate-400">Total Emails</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {contacts.reduce((sum, c) => sum + c.emailCount, 0)}
            </p>
          </motion.div>
        </div>

        {/* Contacts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <p>Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No contacts found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                          {contact.starred && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{contact.email}</p>
                        {contact.company && (
                          <p className="text-xs text-slate-500">{contact.company}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="text-right">
                        <p className="text-sm text-slate-400">
                          {contact.emailCount} {contact.emailCount === 1 ? 'email' : 'emails'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Last: {formatDate(contact.lastContact)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStar(contact.id)}
                          className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                          title="Star contact"
                        >
                          <Star className={`w-5 h-5 ${contact.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => window.location.href = `/dashboard?compose=${contact.email}`}
                          className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                          title="Send email"
                        >
                          <Mail className="w-5 h-5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-purple-500/20 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Contact</h2>
              <button
                onClick={() => setShowAddContact(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Acme Inc."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={!newContact.name || !newContact.email}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
